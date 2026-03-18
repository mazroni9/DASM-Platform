<?php

namespace Modules\Test\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'Test';
    protected string $moduleNameLower = 'test';

    public function map(): void
    {
        $this->mapApiRoutes();
    }

    protected function mapApiRoutes(): void
    {
        Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureAdminOrSuperAdmin::class])
            ->prefix('api/auction-tests')
            ->group(module_path($this->moduleName, 'Routes/api.php'));
    }
}
