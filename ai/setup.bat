@echo off
setlocal

cd /d %~dp0

python -m venv .venv
call .venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt

REM Download models into ai\models using huggingface-cli
python -c "from huggingface_hub import hf_hub_download; import os; os.makedirs('models', exist_ok=True); hf_hub_download(repo_id='Ultralytics/YOLOv8', filename='yolov8n.pt', local_dir='models'); print('Downloaded yolov8n.pt');"
python -c "from huggingface_hub import hf_hub_download; import os; os.makedirs('models', exist_ok=True); hf_hub_download(repo_id='TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF', filename='tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf', local_dir='models'); print('Downloaded tinyllama gguf');"

echo.
echo Done. Now install Tesseract (if not installed) then run run.bat
pause
