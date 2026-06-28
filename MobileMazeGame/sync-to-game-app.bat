@echo off
setlocal

set "ROOT=%~dp0"
set "TARGET=%ROOT%..\game-app\www\MobileMazeGame"

echo Syncing MobileMazeGame into game-app/www...

if not exist "%ROOT%..\game-app\www" (
    echo game-app/www does not exist.
    exit /b 1
)

if exist "%TARGET%" rmdir /S /Q "%TARGET%"
mkdir "%TARGET%"
copy /Y "%ROOT%index.html" "%TARGET%\" >nul
if errorlevel 1 (
    echo Sync failed.
    exit /b 1
)
copy /Y "%ROOT%style.css" "%TARGET%\" >nul
if errorlevel 1 (
    echo Sync failed.
    exit /b 1
)
copy /Y "%ROOT%game.js" "%TARGET%\" >nul
if errorlevel 1 (
    echo Sync failed.
    exit /b 1
)
copy /Y "%ROOT%levels.js" "%TARGET%\" >nul
if errorlevel 1 (
    echo Sync failed.
    exit /b 1
)
copy /Y "%ROOT%favicon.ico" "%TARGET%\" >nul
if errorlevel 1 (
    echo Sync failed.
    exit /b 1
)

echo Sync completed: %TARGET%
exit /b 0
