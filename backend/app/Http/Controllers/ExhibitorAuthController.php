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
            'name' => 'required',
            'email' => 'required|email|unique:exhibitors',
            'password' => 'required|min:6|confirmed',
            'showroom_name' => 'required',
            'showroom_address' => 'required',
            'phone' => 'required',
        ]);

        $exhibitor = Exhibitor::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'showroom_name' => $request->showroom_name,
            'showroom_address' => $request->showroom_address,
            'phone' => $request->phone,
        ]);

        return response()->json(['exhibitor' => $exhibitor], 201);
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

        // هنا يمكنك إصدار توكن JWT أو session حسب إعداداتك
        // مؤقتاً نرجع بيانات المعرض فقط
        return response()->json(['exhibitor' => $exhibitor]);
    }
}
