@echo off
:: Tool Khoi Dong 1-Click Cho Giao Vien
title Ung Dung Hoc Tap & On Luyen Lich Su & Dia Ly THCS
color 0A

echo ===================================================================
echo   CHAO MONG QUY THAY CO DEN VOI APP LICH SU & DIA LY THCS 2026
echo ===================================================================
echo.
echo   [+] Dang khoi dong may chu va mo trinh duyet cho giao vien...
echo.

:: Mo trinh duyet web tu dong sau 2 giay
timeout /t 2 /nobreak >nul
start http://localhost:5173

:: Chay may chu Web
npm run dev
