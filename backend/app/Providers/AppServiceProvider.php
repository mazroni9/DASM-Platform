<?php

namespace App\Providers;

use App\Http\Middleware\SetSpatieTeamContext;
use App\Models\Organization;
use App\Models\Shipment;
use App\Models\User;
use App\Observers\UserObserver;
use App\Policies\OrganizationPolicy;
use App\Policies\ShipmentPolicy;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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

        // ربط السياسات
        Gate::policy(Shipment::class, ShipmentPolicy::class);
        Gate::policy(Organization::class, OrganizationPolicy::class);

        /**
         * ✅ Super Admin + Admin bypass (حل مشكلة 403 مع can:*)
         * - يدعم Enum أو string
         */
        Gate::before(function ($user, string $ability) {
            if (!$user) {
                return null;
            }

            $type = $user->type ?? null;

            // Normalize role/type to string (supports BackedEnum or anything with ->value)
            $typeValue = '';
            if ($type instanceof \BackedEnum) {
                $typeValue = (string) $type->value;
            } elseif (is_object($type) && property_exists($type, 'value')) {
                $typeValue = (string) $type->value;
            } elseif (is_string($type)) {
                $typeValue = $type;
            }

            $typeValue = strtolower(trim($typeValue));

            // ✅ Full admin freedom
            if (in_array($typeValue, ['super_admin', 'admin'], true)) {
                return true;
            }

            return null; // ✅ كمل باقي الصلاحيات/السياسات
        });

        // Observers
        User::observe(UserObserver::class);

        /**
         * ✅ تأكد إن SetSpatieTeamContext ييجي قبل SubstituteBindings
         * (تصحيح ترتيب arguments)
         */
        $kernel = app()->make(HttpKernel::class);

        // addToMiddlewarePriorityBefore($before, $middlewareToAdd)
        $kernel->addToMiddlewarePriorityBefore(
            SubstituteBindings::class,
            SetSpatieTeamContext::class
        );
    }
}
