@echo off
chcp 65001 >nul
title Proje Icerigini TXT'ye Dok
cd /d "%~dp0"

set "OUT=proje-icerik.txt"

echo Proje taranıyor...
if exist "%OUT%" del "%OUT%"

echo ======================================== >> "%OUT%"
echo   SYTHERIS - PROJE ICERIGI >> "%OUT%"
echo   Tarih: %date% %time% >> "%OUT%"
echo ======================================== >> "%OUT%"
echo. >> "%OUT%"

echo === KLASOR YAPISI === >> "%OUT%"
dir /s /b /a-d | findstr /v /i "node_modules \.next \.git dist build \.vercel package-lock pnpm-lock \.fix-backup proje-icerik.txt" >> "%OUT%"
echo. >> "%OUT%"

echo Dosyalar ekleniyor...

for /r %%f in (*.ts *.tsx *.js *.jsx *.mjs *.json *.css *.html *.md *.bat *.yaml *.yml) do (
    echo %%f | findstr /i "node_modules \.next \.git dist build \.vercel package-lock pnpm-lock \.fix-backup proje-icerik.txt" >nul
    if errorlevel 1 (
        echo. >> "%OUT%"
        echo ======================================== >> "%OUT%"
        echo DOSYA: %%~dpnxf >> "%OUT%"
        echo ======================================== >> "%OUT%"
        type "%%f" >> "%OUT%"
        echo. >> "%OUT%"
    )
)

echo.
echo ========================================
echo   TAMAMLANDI!
echo   Dosya: %OUT%
echo ========================================
echo.
echo Boyut:
for %%A in ("%OUT%") do echo   %%~zA byte
echo.
pause