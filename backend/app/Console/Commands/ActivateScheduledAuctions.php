<?php

namespace App\Console\Commands;

use App\Models\Auction;
use App\Models\Car;
use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivateScheduledAuctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auction:activate-scheduled {--dry-run : Show what would be activated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Activate scheduled auctions that are due to start today at 7:00 PM';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timezone = 'Asia/Riyadh';
        $today = Carbon::now($timezone)->toDateString();
        $activationTime = Carbon::now($timezone)->setTime(19, 0, 0); // 7:00 PM
        $isDryRun = $this->option('dry-run');

        $this->info("🕐 Auction Activation Job Started");
        $this->info("📅 Date: {$today}");
        $this->info("⏰ Activation Time: {$activationTime->format('Y-m-d H:i:s')} ({$timezone})");

        if ($isDryRun) {
            $this->warn("🔍 DRY RUN MODE - No changes will be made");
        }

        // Find scheduled auctions that:
        // 1. Have status = 'scheduled'
        // 2. Have start_time date matching today
        // 3. Are approved by control room
        $scheduledAuctions = Auction::with('car')
            ->where('status', AuctionStatus::SCHEDULED->value)
            ->where('control_room_approved', true)
            ->whereDate('start_time', $today)
            ->get();

        $count = $scheduledAuctions->count();
        $this->info("📋 Found {$count} auction(s) to activate");

        if ($count === 0) {
            $this->info("✅ No scheduled auctions to activate today");
            Log::info('ActivateScheduledAuctions: No auctions to activate', ['date' => $today]);
            return Command::SUCCESS;
        }

        $activated = 0;
        $errors = 0;

        foreach ($scheduledAuctions as $auction) {
            try {
                $car = $auction->car;

                if (!$car) {
                    $this->warn("⚠️  Auction #{$auction->id}: No associated car found, skipping");
                    Log::warning('ActivateScheduledAuctions: Auction has no car', ['auction_id' => $auction->id]);
                    $errors++;
                    continue;
                }

                // Get duration from car's main_auction_duration (defaults to 10 if not set)
                $durationDays = (int) ($car->main_auction_duration ?: 10);

                // Calculate end time based on activation time + duration
                $startTime = $activationTime->copy();
                $endTime = $startTime->copy()->addDays($durationDays);

                $this->line("  🚗 Auction #{$auction->id} | Car: {$car->make} {$car->model} ({$car->year})");
                $this->line("     Duration: {$durationDays} days");
                $this->line("     Start: {$startTime->format('Y-m-d H:i:s')}");
                $this->line("     End: {$endTime->format('Y-m-d H:i:s')}");

                if (!$isDryRun) {
                    DB::beginTransaction();

                    try {
                        // Update auction
                        $auction->update([
                            'status' => AuctionStatus::ACTIVE->value,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'auction_type' => AuctionType::LIVE_INSTANT->value,
                        ]);

                        // Update car status
                        $car->update([
                            'auction_status' => 'in_auction',
                        ]);

                        DB::commit();

                        $this->info("     ✅ Activated successfully");
                        Log::info('ActivateScheduledAuctions: Auction activated', [
                            'auction_id' => $auction->id,
                            'car_id' => $car->id,
                            'duration_days' => $durationDays,
                            'start_time' => $startTime->toDateTimeString(),
                            'end_time' => $endTime->toDateTimeString(),
                        ]);

                        $activated++;
                    } catch (\Exception $e) {
                        DB::rollBack();
                        throw $e;
                    }
                } else {
                    $this->info("     🔍 Would be activated (dry run)");
                    $activated++;
                }
            } catch (\Exception $e) {
                $this->error("     ❌ Error: {$e->getMessage()}");
                Log::error('ActivateScheduledAuctions: Failed to activate auction', [
                    'auction_id' => $auction->id,
                    'error' => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        $this->newLine();
        $this->info("📊 Summary:");
        $this->info("   ✅ Activated: {$activated}");
        if ($errors > 0) {
            $this->warn("   ❌ Errors: {$errors}");
        }

        Log::info('ActivateScheduledAuctions: Job completed', [
            'date' => $today,
            'total_found' => $count,
            'activated' => $activated,
            'errors' => $errors,
            'dry_run' => $isDryRun,
        ]);

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
