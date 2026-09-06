@echo off
title Green Forest - podglad (localhost:8080)
cd /d "%~dp0"
echo Uruchamiam serwer podgladu Green Forest...
echo Otworze przegladarke na http://localhost:8080
timeout /t 1 >nul
start "" http://localhost:8080
node server.js
pause
