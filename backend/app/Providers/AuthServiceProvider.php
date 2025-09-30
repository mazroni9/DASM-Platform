<?php

namespace App\Providers;

use App\Auth\Guards\KeycloakJwtGuard;
use App\Auth\Providers\KeycloakUserProvider;
use App\Services\KeycloakJwtService;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Register the Keycloak JWT guard
        Auth::extend('keycloak-jwt', function ($app, $name, $config) {
            return new KeycloakJwtGuard(
                $app->make('auth')->createUserProvider($config['provider']),
                $app->make('request'),
                $app->make(KeycloakJwtService::class)
            );
        });

        // Register the Keycloak user provider
        Auth::provider('keycloak', function ($app, $config) {
            return new KeycloakUserProvider(
                $app->make('hash'),
                $config['model']
            );
        });
    }
}
