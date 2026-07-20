@echo off
setlocal EnableDelayedExpansion
title MPoints Tracker - Crear Backup ZIP

:: ============================
:: CONFIGURACION
:: ============================

set "SOURCE=D:\Mi Home\Desktop\proyectos\mpoints-tracker"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set DATETIME=%%i

set "ZIPNAME=mpoints-tracker_%DATETIME%.zip"
set "DEST=%~dp0%ZIPNAME%"
set "STAGE=%~dp0mpoints-tracker"

echo.
echo ============================================================
echo        MPoints Tracker - Generador de Backup ZIP
echo ============================================================
echo.
echo Proyecto:
echo   %SOURCE%
echo.
echo Destino:
echo   %DEST%
echo.

:: ============================
:: LIMPIEZA
:: ============================

if exist "%STAGE%" rd /s /q "%STAGE%"
mkdir "%STAGE%"

echo Copiando proyecto...
echo.

robocopy "%SOURCE%" "%STAGE%" /E /R:1 /W:1 ^
/XD ^
.git ^
.github ^
.vscode ^
.idea ^
node_modules ^
dist ^
coverage ^
playwright-report ^
test-results ^
graphify-out ^
.wrangler ^
.cache ^
.vite ^
.next ^
out ^
build ^
temp ^
tmp ^
/XF ^
.env ^
.env.local ^
.env.development ^
.env.production ^
.env.test ^
*.log ^
*.tmp ^
*.bak ^
Thumbs.db ^
Desktop.ini ^
nul ^
>nul

echo Eliminando archivos temporales...

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem '%STAGE%' -Recurse -Force | Where-Object { $_.Name -match '^\.env' -or $_.Extension -in '.log','.tmp','.bak' } | Remove-Item -Force -ErrorAction SilentlyContinue"

echo.
echo Comprimiendo...

if exist "%DEST%" del "%DEST%"

powershell -NoProfile -ExecutionPolicy Bypass ^
"Compress-Archive -Path '%STAGE%\*' -DestinationPath '%DEST%' -CompressionLevel Optimal -Force"

if not exist "%DEST%" (
    echo.
    echo ERROR: No se pudo crear el ZIP.
    rd /s /q "%STAGE%"
    pause
    exit /b 1
)

for %%F in ("%DEST%") do set SIZE=%%~zF

set /a MB=%SIZE%/1024/1024

rd /s /q "%STAGE%"

echo.
echo ============================================================
echo                    PROCESO FINALIZADO
echo ============================================================
echo.
echo Archivo:
echo   %ZIPNAME%
echo.
echo Tamano aproximado:
echo   %MB% MB
echo.
echo Ubicacion:
echo   %DEST%
echo.
echo Backup listo.
echo ============================================================
echo.

pause