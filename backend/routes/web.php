<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return view('welcome');
});

// اختبار الاتصال بقاعدة البيانات: عرض بيانات جدول jobs
Route::get('/test-db', function () {
    return DB::table('jobs')->get();
});
