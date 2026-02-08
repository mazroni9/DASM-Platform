<?php

namespace Modules\Test\Services;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Car;
use App\Models\User;
use App\Enums\UserStatus;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Modules\Test\Entities\AuctionTestEvent;
use Modules\Test\Entities\AuctionTestRun;

class ScenarioRunner
{
    public function getScenariosList(): array
    {
        return config('test.scenarios', []) ?: [];
    }

    /**
     * تشغيل سيناريو: إنشاء مزاد تجريبي + مستخدمين افتراضيين + ضخ مزايدات وحفظ الـ metrics.
     */
    public function runScenario(string $scenarioKey, int $userCount = null, int $durationSeconds = null): AuctionTestRun
    {
        $scenarios = $this->getScenariosList();
        if (!isset($scenarios[$scenarioKey])) {
            throw new \InvalidArgumentException("Unknown scenario: {$scenarioKey}");
        }

        $scenario = $scenarios[$scenarioKey];
        $userCount = $userCount ?? ($scenario['default_users'] ?? 10);
        $durationSeconds = $durationSeconds ?? ($scenario['default_duration_seconds'] ?? 300);

        $run = AuctionTestRun::create([
            'scenario_key' => $scenarioKey,
            'status' => 'running',
            'user_count' => $userCount,
            'duration_seconds' => $durationSeconds,
            'started_at' => now(),
            'options' => ['scenario' => $scenario],
        ]);

        try {
            DB::beginTransaction();

            $owner = $this->createTestUser($run->id, 'owner', 0);
            $car = $this->createTestCar($owner->id, $run->id);
            $auction = $this->createTestAuction($car->id, $run->id, $durationSeconds);

            $run->auction_id = $auction->id;
            $run->save();

            $bidders = [];
            for ($i = 1; $i <= $userCount; $i++) {
                $bidders[] = $this->createTestUser($run->id, 'bidder', $i);
            }

            $bidEvents = $this->generateBidSchedule($scenario, $durationSeconds, $userCount);
            $totalBids = 0;
            $successfulBids = 0;
            $failedBids = 0;
            $latencies = [];

            foreach ($bidEvents as $ev) {
                $totalBids++;
                $bidder = $bidders[$ev['user_index'] % count($bidders)];
                $amount = $ev['amount'] ?? ($auction->current_bid + $ev['increment']);

                $t0 = microtime(true);
                $result = $auction->fresh()->processBid((float) $amount, $bidder->id);
                $latencyMs = (int) round((microtime(true) - $t0) * 1000);

                if (!empty($result['success'])) {
                    $successfulBids++;
                    $latencies[] = $latencyMs;
                    AuctionTestEvent::create([
                        'run_id' => $run->id,
                        'event_type' => 'bid_confirmed',
                        'latency_ms' => $latencyMs,
                        'user_id' => $bidder->id,
                        'bid_id' => $result['bid']->id ?? null,
                        'bid_amount' => $amount,
                        'occurred_at' => now(),
                    ]);
                } else {
                    $failedBids++;
                    AuctionTestEvent::create([
                        'run_id' => $run->id,
                        'event_type' => 'bid_rejected',
                        'latency_ms' => $latencyMs,
                        'user_id' => $bidder->id,
                        'bid_amount' => $amount,
                        'message' => $result['message'] ?? 'rejected',
                        'occurred_at' => now(),
                    ]);
                }
            }

            $avgLatency = !empty($latencies) ? (int) round(array_sum($latencies) / count($latencies)) : null;
            $maxLatency = !empty($latencies) ? max($latencies) : null;

            $run->update([
                'status' => 'completed',
                'total_bids' => $totalBids,
                'successful_bids' => $successfulBids,
                'failed_bids' => $failedBids,
                'avg_latency_ms' => $avgLatency,
                'max_latency_ms' => $maxLatency,
                'completed_at' => now(),
            ]);

            DB::commit();
            return $run->fresh();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ScenarioRunner failed: ' . $e->getMessage(), ['run_id' => $run->id, 'trace' => $e->getTraceAsString()]);
            $run->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
            throw $e;
        }
    }

    protected function createTestUser(int $runId, string $role, int $index): User
    {
        // phone: varchar(20) in DB — keep under 20 chars, unique per test user
        $phone = 's' . $runId . substr($role, 0, 1) . $index . substr(str_replace('.', '', uniqid('', true)), -8);
        $phone = substr($phone, 0, 20);

        // email: unique, can be long
        $email = "test_scenario_{$runId}_{$role}_{$index}_" . uniqid() . '@test.dasm.local';

        return User::create([
            'first_name' => 'Test',
            'last_name' => ucfirst($role) . $index,
            'email' => $email,
            'phone' => $phone,
            'password_hash' => Hash::make('password'),
            'type' => 'user',
            'is_active' => true,
            'status' => UserStatus::ACTIVE,
        ]);
    }

    protected function createTestCar(int $ownerId, int $runId): Car
    {
        return Car::create([
            'user_id' => $ownerId,
            'make' => 'TestMake',
            'model' => 'TestModel',
            'year' => 2024,
            'vin' => 'TESTVIN' . $runId . '_' . uniqid(),
            'odometer' => 0,
            'condition' => 'good',
            'evaluation_price' => 50000,
            'auction_status' => 'in_auction',
        ]);
    }

    protected function createTestAuction(int $carId, int $runId, int $durationSeconds): Auction
    {
        $start = Carbon::now();
        $end = Carbon::now()->addSeconds($durationSeconds);
        $openingPrice = 10000;

        return Auction::create([
            'car_id' => $carId,
            'is_test' => true,
            'start_time' => $start,
            'end_time' => $end,
            'minimum_bid' => $openingPrice,
            'maximum_bid' => 500000,
            'current_bid' => $openingPrice,
            'reserve_price' => $openingPrice,
            'opening_price' => $openingPrice,
            'status' => AuctionStatus::ACTIVE,
            'auction_type' => AuctionType::LIVE,
            'control_room_approved' => true,
            'approved_for_live' => false,
        ]);
    }

    /**
     * توليد قائمة أحداث مزايدات حسب السيناريو (وقت، user_index، amount أو increment).
     */
    protected function generateBidSchedule(array $scenario, int $durationSeconds, int $userCount): array
    {
        $pattern = $scenario['bid_pattern'] ?? 'random';
        $minBpm = $scenario['bids_per_minute_min'] ?? 5;
        $maxBpm = $scenario['bids_per_minute_max'] ?? 15;
        $events = [];
        $openingPrice = 10000;
        $currentAmount = $openingPrice;
        $increment = 500;

        if ($pattern === 'burst_end') {
            $burstLast = $scenario['burst_last_seconds'] ?? 60;
            $burstPct = $scenario['burst_percentage'] ?? 0.6;
            $totalBids = (int) round(($durationSeconds / 60) * ($minBpm + $maxBpm) / 2);
            $burstCount = (int) round($totalBids * $burstPct);
            $normalCount = $totalBids - $burstCount;

            $normalEnd = $durationSeconds - $burstLast;
            for ($i = 0; $i < $normalCount; $i++) {
                $t = $normalEnd > 0 ? rand(0, $normalEnd) : 0;
                $currentAmount += $increment;
                $events[] = ['time' => $t, 'user_index' => $i % $userCount, 'amount' => $currentAmount, 'increment' => $increment];
            }
            for ($i = 0; $i < $burstCount; $i++) {
                $t = $normalEnd + rand(0, min($burstLast, 1));
                $currentAmount += $increment;
                $events[] = ['time' => $t, 'user_index' => ($normalCount + $i) % $userCount, 'amount' => $currentAmount, 'increment' => $increment];
            }
            usort($events, fn ($a, $b) => $a['time'] <=> $b['time']);
        } else {
            $totalBids = (int) round(($durationSeconds / 60) * (($minBpm + $maxBpm) / 2));
            for ($i = 0; $i < $totalBids; $i++) {
                $t = $durationSeconds > 0 ? rand(0, $durationSeconds) : 0;
                $currentAmount += $increment;
                $events[] = ['time' => $t, 'user_index' => $i % $userCount, 'amount' => $currentAmount, 'increment' => $increment];
            }
            usort($events, fn ($a, $b) => $a['time'] <=> $b['time']);
        }

        return $events;
    }
}
