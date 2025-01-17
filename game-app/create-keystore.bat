@echo off
echo Creating Android release keystore...

rem Delete old keystore if exists
if exist game-app-release.keystore del game-app-release.keystore

rem Create new keystore
keytool -genkey -v -keystore game-app-release.keystore -alias game-app -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12 -storepass game-app-store -keypass game-app-key -dname "CN=Game App"

echo.
echo Keystore created successfully!
echo Please keep these credentials safe:
echo Keystore file: game-app-release.keystore
echo Alias: game-app
echo Store password: game-app-store
echo Key password: game-app-key
echo.
pause
