@echo off
setlocal

REM hkt-memory - Windows wrapper for vendor/hkt-memory/scripts/hkt_memory_v5.py
REM
REM Search order:
REM   1. Git repo root + vendor path
REM   2. Relative to this script's own location
REM   3. HKT_MEMORY_SCRIPT env var
REM
REM Exit codes:
REM   0 - command succeeded
REM   1 - command failed (passed through from hkt_memory_v5.py)
REM   2 - script not found

set "HKT_SCRIPT="

REM Strategy 1: Git repo root + vendor path
for /f "tokens=*" %%g in ('git rev-parse --show-toplevel 2^>nul') do set "GIT_ROOT=%%g"
if defined GIT_ROOT if exist "%GIT_ROOT%\vendor\hkt-memory\scripts\hkt_memory_v5.py" (
    set "HKT_SCRIPT=%GIT_ROOT%\vendor\hkt-memory\scripts\hkt_memory_v5.py"
    goto :found
)

REM Strategy 2: Relative to this script's own location
set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%..") do set "PARENT=%%~fi"
if exist "%PARENT%\scripts\hkt_memory_v5.py" (
    set "HKT_SCRIPT=%PARENT%\scripts\hkt_memory_v5.py"
    goto :found
)

REM Strategy 3: HKT_MEMORY_SCRIPT env var
if defined HKT_MEMORY_SCRIPT if exist "%HKT_MEMORY_SCRIPT%" (
    set "HKT_SCRIPT=%HKT_MEMORY_SCRIPT%"
    goto :found
)

echo Error: Could not find hkt_memory_v5.py
echo Searched:
echo   1. Git repo root vendor\ path
echo   2. Relative to wrapper script (%PARENT%\scripts\)
echo   3. HKT_MEMORY_SCRIPT env var
echo Install via: bash vendor\hkt-memory\install.sh
exit /b 2

:found
where uv >nul 2>nul
if %errorlevel% equ 0 (
    uv run "%HKT_SCRIPT%" %*
) else (
    python "%HKT_SCRIPT%" %*
)
