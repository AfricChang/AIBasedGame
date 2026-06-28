@echo off
setlocal

set "ROOT=%~dp0"
set "APP_DIR=%ROOT%android-app"
set "BUILD_JSON=%APP_DIR%\build.json"
set "KEYSTORE=%ROOT%..\game-app\game-app-release.keystore"
set "GRADLE_HOME=E:\Android\gradle\gradle-8.7"

if exist "%GRADLE_HOME%\bin\gradle.bat" (
    set "PATH=%GRADLE_HOME%\bin;%PATH%"
)

if not exist "%APP_DIR%" (
    echo Standalone android-app does not exist. Run build-standalone-apk.bat first.
    exit /b 1
)

if not exist "%KEYSTORE%" (
    echo Keystore not found: %KEYSTORE%
    exit /b 1
)

(
    echo {
    echo   "android": {
    echo     "release": {
    echo       "keystore": "%KEYSTORE:\=\\%",
    echo       "storePassword": "game-app-store",
    echo       "alias": "game-app",
    echo       "password": "game-app-store",
    echo       "keystoreType": "PKCS12"
    echo     }
    echo   }
    echo }
) > "%BUILD_JSON%"

pushd "%APP_DIR%"
echo Building standalone Android release APK...
call npx cordova build android --release --buildConfig build.json
if errorlevel 1 (
    popd
    echo Failed to build standalone MobileMazeGame release APK.
    exit /b 1
)
popd

echo Done. Release APK output is under:
echo %APP_DIR%\platforms\android\app\build\outputs\apk\release\
exit /b 0
