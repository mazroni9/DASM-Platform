<?php

namespace Bl\FatooraZatca;

use Bl\FatooraZatca\Commands\PackageInfoCommand;
use Bl\FatooraZatca\Middleware\SetEnvironmentMiddleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class FatooraZatcaServiceProvider extends ServiceProvider
{
    /**
     * the path of config file.
     *
     * @var string
     */
    private $configPath = __DIR__ . '/Config/zatca.php';

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom($this->configPath, 'zatca');
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        $this->publishes([
            $this->configPath => config_path('zatca.php'),
        ], 'fatoora-zatca');

        $this->commands(PackageInfoCommand::class);

        Route::macro('fatooraZatcaApi', function() {
            Route::prefix('fatoora-zatca')
            ->namespace('\Bl\FatooraZatca\Controllers')
            ->middleware(SetEnvironmentMiddleware::class)->group(function() {
                Route::post('setting', 'SettingsController');
                Route::post('renew-setting', 'RenewSettingsController');
                Route::post('b2c', 'B2cController');
                Route::post('b2b', 'B2bController');
            });
        });
    }
}
