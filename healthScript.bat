@echo off
C:
IF EXIST "C:\Program Files\McAfee\" (
ECHO McAfee is on the system
) ELSE (
ECHO McAfee is not on the system
)

IF EXIST "C:\Program Files\Norton\" (
ECHO Norton is on the system
) ELSE (
ECHO Norton is not on the system
)


IF EXIST "D:" (
D:
MBSetup.exe
C:
)

@echo on

winsat formal

wmic diskdrive get model,status

@echo off
echo Start DISM checks?
pause
echo.
echo.

echo ---- Starting DISM Checks ----
@echo on

DISM /Online /Cleanup-Image /CheckHealth

DISM /Online /Cleanup-Image /ScanHealth

DISM /Online /Cleanup-Image /RestoreHealth

@echo off
echo Start SFC Checks?
pause
echo.
echo.

echo ---- Starting SFC Checks ----
@echo on

sfc /verifyonly

SFC /SCANNOW

Your setup is done.
@echo off
pause



