@echo off
cd /d "C:\Users\DELL\Downloads\old\Frontend-local"

echo -----------------------------
echo 🔁 جاري رفع التحديث إلى Vercel ...
echo -----------------------------
vercel --prod

echo.
echo ✅ تم نشر المشروع بنجاح على Vercel!
echo 🔗 افتح الرابط: https://mazbrothers.com أو https://www.mazbrothers.com
echo -----------------------------

pause
