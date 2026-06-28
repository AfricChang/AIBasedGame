@echo off
setlocal

set "ROOT=%~dp0"
set "APP_DIR=%ROOT%android-app"
set "WWW_DIR=%APP_DIR%\www"
set CORDOVA_CMD=npx cordova
set "GRADLE_HOME=E:\Android\gradle\gradle-8.7"

if exist "%GRADLE_HOME%\bin\gradle.bat" (
    set "PATH=%GRADLE_HOME%\bin;%PATH%"
)

echo Preparing standalone Cordova shell for MobileMazeGame...

if not exist "%APP_DIR%" (
    echo Creating Cordova project...
    call %CORDOVA_CMD% create "%APP_DIR%" com.webgames.mobilemazegame MobileMazeGame
    if errorlevel 1 goto :error

    pushd "%APP_DIR%"
    call %CORDOVA_CMD% platform add android@12.0.0
    if errorlevel 1 (
        popd
        goto :error
    )
    popd
)

if exist "%APP_DIR%\config.xml" (
    (
        echo ^<?xml version='1.0' encoding='utf-8'?^>
        echo ^<widget id="com.webgames.mobilemazegame" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"^>
        echo     ^<name^>MobileMazeGame^</name^>
        echo     ^<description^>Standalone Mobile Maze Game^</description^>
        echo     ^<author email="dev@cordova.apache.org" href="https://cordova.apache.org"^>Apache Cordova Team^</author^>
        echo     ^<content src="index.html" /^>
        echo     ^<allow-intent href="http://*/*" /^>
        echo     ^<allow-intent href="https://*/*" /^>
        echo     ^<platform name="android"^>
        echo         ^<preference name="android-compileSdkVersion" value="33" /^>
        echo         ^<preference name="android-targetSdkVersion" value="33" /^>
        echo         ^<preference name="android-minSdkVersion" value="22" /^>
        echo     ^</platform^>
        echo ^</widget^>
    ) > "%APP_DIR%\config.xml"
)

if not exist "%WWW_DIR%" mkdir "%WWW_DIR%"

echo Syncing MobileMazeGame files...
copy /Y "%ROOT%index.html" "%WWW_DIR%\" >nul
if errorlevel 1 goto :error
copy /Y "%ROOT%style.css" "%WWW_DIR%\" >nul
if errorlevel 1 goto :error
copy /Y "%ROOT%game.js" "%WWW_DIR%\" >nul
if errorlevel 1 goto :error
copy /Y "%ROOT%levels.js" "%WWW_DIR%\" >nul
if errorlevel 1 goto :error
copy /Y "%ROOT%favicon.ico" "%WWW_DIR%\" >nul
if errorlevel 1 goto :error

pushd "%APP_DIR%"
echo Building standalone Android debug APK...
call %CORDOVA_CMD% build android
if errorlevel 1 (
    popd
    goto :error
)
popd

echo Done. APK output is under:
echo %APP_DIR%\platforms\android\app\build\outputs\apk\
exit /b 0

:error
echo Failed to build standalone MobileMazeGame APK.
exit /b 1
