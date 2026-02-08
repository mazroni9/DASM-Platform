<?php

namespace Bl\FatooraZatca\Middleware;

use Closure;

class SetEnvironmentMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        config()->set('zatca.app.environment', $request->header('ZATCA_ENV', 'local'));
        config()->set('zatca.app.key', $request->header('ZATCA_APP_KEY', 'local'));

        return $next($request);
    }
}
