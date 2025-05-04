@echo off
title Galb Full Stack Dev Server

REM شغل الفرونت في نافذة مستقلة
start "Galb Frontend" cmd /k "cd Frontend-local && call pnpm dev --port 3333"

REM شغل الباك اند في نافذة مستقلة
start "Galb Backend" cmd /k "cd backend-laravel && call php artisan serve --port=8000"

echo تم تشغيل النظام الكامل.
pause
