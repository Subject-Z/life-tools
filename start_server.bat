@off
cd /d "%~dp0"
:: 延迟2秒打开浏览器，确保服务器已经起来了
start "" "http://127.0.0.1:8080"
:: 运行服务器
python -m http.server 8080