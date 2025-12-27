@echo off
setlocal
cd /d %~dp0
call .venv\Scripts\activate

REM لو tesseract مش في PATH، حط مساره هنا (مثال):
REM set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

uvicorn app.main:app --host 127.0.0.1 --port 8001
