Dim objShell, objArgs, fso, scriptPath
Set objShell = CreateObject("WScript.Shell")
Set objArgs = WScript.Arguments
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName

Dim phase2Commands, i, commandString

phase2Commands = Array( _
    "powercfg -duplicatescheme a1841308-3541-4fab-bc81-f71556f20b4a", _
    "powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", _
    "powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61", _
    "powercfg -duplicatescheme 381b4222-f694-41f0-9685-ff5bb260df2e" _
)

If objArgs.Count > 0 And objArgs(0) = "phase2" Then
    On Error Resume Next
    objShell.RegDelete "HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce\ResumePowerScript"
    On Error Goto 0

    commandString = ""
    For i = 0 To UBound(phase2Commands)
        commandString = commandString & phase2Commands(i) & " && "
    Next
    commandString = commandString & "pause"

    objShell.ShellExecute "cmd.exe", "/k " & commandString, "", "runas", 1

Else
    objShell.RegWrite "HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce\ResumePowerScript", _
        "wscript.exe """ & scriptPath & """ phase2", "REG_SZ"

    commandString = "reg add HKLM\System\CurrentControlSet\Control\Power /v PlatformAoAcOverride /t REG_DWORD /d 0 /f && shutdown /r /t 5"

    objShell.ShellExecute "cmd.exe", "/k " & commandString, "", "runas", 1

End If

Set objShell = Nothing