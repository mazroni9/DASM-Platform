<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exhibitor\ExhibitorZatcaVerifyRequest;
use App\Models\ZatcaUser;

class ExhibitorZatcaVerifyController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ExhibitorZatcaVerifyRequest $request)
    {
        $zatca = ZatcaUser::query()->find(auth()->id());

        // ...
    }
}
