<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\Shipment;
use App\Policies\ShipmentPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // إخراج الـ JSON Resources بدون الطبقة الخارجية "data"
        JsonResource::withoutWrapping();

        // ربط سياسة الوصول لشحنات المعارض
        Gate::policy(Shipment::class, ShipmentPolicy::class);
    }
}
