@echo off
setlocal
cd /d "%~dp0"
set "SOCH_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%SOCH_PYTHON%" (
  "%SOCH_PYTHON%" scripts\start_preview.py
) else (
  python scripts\start_preview.py
)
