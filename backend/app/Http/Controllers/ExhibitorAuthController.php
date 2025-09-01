<?php

namespace App\Http\Controllers;

use App\Models\Exhibitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ExhibitorAuthController extends Controller
{
    // تسجيل صاحب معرض جديد
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:exhibitors',
            'password' => 'required|min:8|confirmed',
            'showroom_name' => 'required|string|max:255',
            'showroom_address' => 'required|string|max:500',
            'phone' => 'required|string|max:20',
        ]);

        $exhibitor = Exhibitor::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'showroom_name' => $request->showroom_name,
            'showroom_address' => $request->showroom_address,
            'phone' => $request->phone,
        ]);

        // إنشاء التوكن
        $token = $exhibitor->createToken('exhibitor-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'exhibitor' => $exhibitor
        ], 201);
    }

    // تسجيل الدخول لصاحب معرض
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $exhibitor = Exhibitor::where('email', $request->email)->first();

        if (!$exhibitor || !Hash::check($request->password, $exhibitor->password)) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة'], 401);
        }

        // إنشاء التوكن
        $token = $exhibitor->createToken('exhibitor-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'exhibitor' => $exhibitor
        ]);
    }
}
