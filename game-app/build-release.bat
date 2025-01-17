@echo off
rem Proxy configuration
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
set JAVA_OPTS=-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=7890 -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=7890

echo Syncing game files...

rem Ensure www directory exists
if not exist "www" mkdir www

rem Copy homepage
xcopy /Y "..\index.html" "www\"

rem Copy game files
xcopy /Y /E /I "..\FlappyBird" "www\FlappyBird"
xcopy /Y /E /I "..\Minesweeper" "www\Minesweeper"
xcopy /Y /E /I "..\TicTacToe" "www\TicTacToe"

echo Game files sync completed

rem Build Android app (Release)
echo Starting Android app release build...
cordova build android --release
echo Build completed
