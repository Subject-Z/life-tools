@echo off
cd /d "%~dp0"

:: 通过 PowerShell 获取当前月/日，格式如 06/01
for /f %%i in ('powershell -Command "Get-Date -Format 'MM/dd'"') do set today=%%i

:: 构造完整的提交信息
set commit_msg=%today%：我不知道更新了什么

:: 执行 Git 操作
git add .
git commit -m "%commit_msg%"
git push origin main

:: 显示执行结果，按任意键关闭窗口
echo 操作完成，按任意键退出...
pause > nul