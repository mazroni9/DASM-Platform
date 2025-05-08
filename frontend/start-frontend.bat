@echo off
title Galb Frontend Local Server
cd /d %~dp0

echo 🌐 جاري تشغيل واجهة منصة Galb على http://localhost:3336

:: تشغيل Next.js على البورت 3336
pnpm dev --port 3336 || npm run dev -- --port 3336 || yarn dev --port 3336

pause
