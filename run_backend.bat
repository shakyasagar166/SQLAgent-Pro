@echo off
echo ========================================================
echo Starting SQLAgent Pro Backend (FastAPI on Port 8001)
echo ========================================================
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
pause
