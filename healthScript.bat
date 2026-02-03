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
pause

wmic diskdrive get model,status
pause

DISM /Online /Cleanup-Image /CheckHealth
pause

DISM /Online /Cleanup-Image /ScanHealth
pause

DISM /Online /Cleanup-Image /RestoreHealth
pause

sfc /verifyonly
pause

SFC /SCANNOW
pause



