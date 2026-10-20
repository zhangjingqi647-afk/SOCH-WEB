@echo off
setlocal
cd /d "%~dp0"
set "SOCH_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%SOCH_NODE%" (
  "%SOCH_NODE%" scripts\start-react-preview.mjs
) else (
  node scripts\start-react-preview.mjs
)
if errorlevel 1 pause
