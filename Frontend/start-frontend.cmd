@echo off
cd /d "%~dp0"
echo Starting Interview IQ at http://localhost:5173
call npm.cmd run dev -- --host 0.0.0.0 --port 5173
