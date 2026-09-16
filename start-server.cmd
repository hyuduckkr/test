@echo off
chcp 65001 > nul
cd /d "%~dp0"
title KMEI 자료실 저장 서버
echo KMEI 자료실 저장 서버를 시작합니다.
echo 이 창은 홈페이지 사용 중에 닫지 마세요.
echo.

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not "%NODE_EXE%"=="node" if not exist "%NODE_EXE%" (
    echo [오류] Node.js를 찾지 못했습니다.
    echo Node.js를 설치한 후 이 파일을 다시 실행해 주세요.
    pause
    exit /b 1
)

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:8080/board-library-write.html'"
"%NODE_EXE%" server.js

echo.
echo [오류] 저장 서버가 종료되었습니다. 위 오류 내용을 확인해 주세요.
pause
