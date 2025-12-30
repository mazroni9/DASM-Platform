<?php

namespace App\Jobs;

use App\Models\Car;
use App\Services\CloudinaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180;
    public int $tries = 3;
    public array $backoff = [10, 60, 180];

    public function __construct(public int $carId) {}

    public function handle(CloudinaryService $cloudinary): void
    {
        $car = Car::find($this->carId);
        if (!$car) return;

        if (empty($car->review_status)) {
            $car->review_status = 'processing';
            $car->save();
        }

        $aiUrl = rtrim((string) config('services.ai.url'), '/');
        if ($aiUrl === '') {
            $this->markFailed($car, 'AI_SERVICE_URL is missing');
            return;
        }

        try {
            $images = [];

            if (is_array($car->images)) {
                $images = $car->images;
            } elseif (is_string($car->images) && $car->images !== '') {
                $decoded = json_decode($car->images, true);
                if (is_array($decoded)) $images = $decoded;
            }

            $images = array_values(array_filter(array_map(
                fn ($u) => $cloudinary->makeAccessibleUrl(is_string($u) ? $u : null),
                $images
            )));

            $registrationUrl = $cloudinary->makeAccessibleUrl($car->registration_card_image);

            Log::info('CarAnalyticsJob sending to AI', [
                'car_id' => $car->id,
                'registration_card_image' => $registrationUrl,
                'images_count' => count($images),
                'first_image' => $images[0] ?? null,
            ]);

            $payload = [
                'car_id' => $car->id,
                'car' => [
                    'make'  => $car->make,
                    'model' => $car->model,
                    'year'  => $car->year,
                    'vin'   => $car->vin,
                    'odometer' => $car->odometer,
                    'evaluation_price' => $car->evaluation_price,
                ],
                'images' => $images,
                'registration_card_image' => $registrationUrl,
            ];

            $res = Http::acceptJson()
                ->timeout($this->timeout)
                ->retry(2, 500)
                ->post($aiUrl . '/analyze-car', $payload);

            $res->throw();

            $data = $res->json();
            if (!is_array($data)) {
                throw new \RuntimeException('AI response is not valid JSON object');
            }

            $realProb = (float) ($data['real_probability'] ?? 0);
            $reason   = (string) ($data['reason'] ?? '');

            // ✅ منطقك كما هو
            $status = $realProb >= 0.50 ? 'under_review' : 'rejected';

            $car->review_status  = $status;
            $car->review_score   = round($realProb * 100, 2);
            $car->review_reason  = $reason !== '' ? $reason : null;
            $car->review_details = $data;
            $car->reviewed_at    = now();
            $car->save();

        } catch (\Throwable $e) {
            Log::error('CarAnalyticsJob failed', [
                'car_id' => $this->carId,
                'error'  => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $e): void
    {
        $car = Car::find($this->carId);
        if (!$car) return;

        $this->markFailed($car, $e->getMessage());
    }

    private function markFailed(Car $car, string $reason): void
    {
        $car->review_status = 'failed';
        $car->review_reason = $reason;
        $car->reviewed_at   = now();
        $car->save();
    }
}
