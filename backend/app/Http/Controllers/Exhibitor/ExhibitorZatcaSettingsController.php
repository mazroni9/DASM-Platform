<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exhibitor\ExhibitorZatcaSettingsRequest;
use App\Models\ZatcaUser;

class ExhibitorZatcaSettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $zatca = ZatcaUser::query()->find(auth()->id());

        return response()->json([
            'success' => true,
            'data' => array_merge($zatca->zatca_fields, [
                'is_zatca_verified' => $zatca->zatca_verified,
            ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ExhibitorZatcaSettingsRequest $request)
    {
        $zatca = ZatcaUser::query()->find(auth()->id());

        $zatca->zatca_fields = $request->validated();

        $zatca->save();

        return response()->json([
            'success' => true,
            'data' => array_merge($zatca->zatca_fields, [
                'is_zatca_verified' => $zatca->zatca_verified,
            ]),
        ]);
    }
}
