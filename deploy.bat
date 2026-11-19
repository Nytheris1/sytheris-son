@echo off
chcp 65001 >nul
title Sytheris - GitHub Deploy
cd /d "%~dp0"

echo ========================================
echo   SYTHERIS - GitHub Deploy
echo ========================================
echo.

REM Git kimligi (sadece bu repo icin)
git config user.name "Nytheris1"
git config user.email "mumyabra@gmail.com"

REM Remote kontrolu
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [1/4] Remote ekleniyor...
    git remote add origin https://github.com/Nytheris1/sytheris-son.git
) else (
    echo [1/4] Remote zaten mevcut.
)

echo.
echo [2/4] Degisiklikler ekleniyor...
git add -A

echo.
echo [3/4] Commit atiliyor...
git commit -m "auto: %date% %time%"

if errorlevel 1 (
    echo.
    echo [!] Commit edilecek degisiklik yok. Yine de push denenecek.
)

echo.
echo [4/4] GitHub'a push ediliyor...
git branch -M main 2>nul
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo ========================================
    echo   HATA! Push basarisiz oldu.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   BASARILI! Vercel otomatik deploy edecek.
    echo ========================================
)

echo.
pause