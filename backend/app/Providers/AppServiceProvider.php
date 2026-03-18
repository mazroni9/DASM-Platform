<?php

namespace App\Providers;

use App\Http\Middleware\SetSpatieTeamContext;
use App\Models\Shipment;
use App\Models\VenueOwnerReview;
use App\Policies\ShipmentPolicy;
use App\Policies\VenueOwnerReviewPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Http\Kernel;
use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Middleware\SubstituteBindings;

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
        Gate::policy(\App\Models\Organization::class, \App\Policies\OrganizationPolicy::class);
        
        // ✅ جديد: Policy للتقييمات
        Gate::policy(VenueOwnerReview::class, VenueOwnerReviewPolicy::class);

        // Super Admin bypass
        Gate::before(function ($user, $ability) {
            if ($user->type === \App\Enums\UserRole::SUPER_ADMIN) {
                return true;
            }
        });

        \App\Models\User::observe(\App\Observers\UserObserver::class);

        $kernel = app()->make(Kernel::class);

        $kernel->addToMiddlewarePriorityBefore(
            SetSpatieTeamContext::class,
            SubstituteBindings::class,
        );
    }
}
