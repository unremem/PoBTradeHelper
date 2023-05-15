; PobTradeHelper.nsi
;
; Install the trade helper python.exe and host scripts to the desired location and
; add to registry.

;--------------------------------

; The name of the installer
Name "PobTradeHelper"

; The file to write
OutFile "PobTradeHelper.exe"

; Request application privileges for Windows Vista and higher
RequestExecutionLevel admin

; Build Unicode installer
Unicode True

; The default installation directory
InstallDir $PROGRAMFILES\PobTradeHelper

; Registry key to check for directory (so if you install again, it will 
; overwrite the old one automatically)
InstallDirRegKey HKLM "Software\PobTradeHelper" "Install_Dir"

;--------------------------------

; Pages

Page components
Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

;--------------------------------

; The stuff to install
Section "PobTradeHelper (required)"

  SectionIn RO
  
  ; Set output path to the installation directory.
  SetOutPath $INSTDIR
  
  ; Put file there
  File pob-trade-helper-native-host
  File pob-trade-helper-native-host.bat
  File com.google.chrome.pob.tradehelper-win.json
  File /r pob_wrapper
  File /r python-3.10.11-embed-amd64
  
  ; Write the installation path into the registry
  WriteRegStr HKLM SOFTWARE\PobTradeHelper "Install_Dir" "$INSTDIR"

  ; Write the chrome extension manifest
  WriteRegStr HKCU Software\Google\Chrome\NativeMessagingHosts\com.google.chrome.pob.tradehelper "" "$INSTDIR\com.google.chrome.pob.tradehelper-win.json"
  
  ; Write the uninstall keys for Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PobTradeHelper" "DisplayName" "PobTradeHelper"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PobTradeHelper" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PobTradeHelper" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PobTradeHelper" "NoRepair" 1
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
SectionEnd

;--------------------------------

; Uninstaller

Section "Uninstall"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\PobTradeHelper"
  DeleteRegKey HKLM SOFTWARE\PobTradeHelper
  DeleteRegKey HKCU Software\Google\Chrome\NativeMessagingHosts\com.google.chrome.pob.tradehelper

  Delete $INSTDIR\pob-trade-helper-native-host
  Delete $INSTDIR\pob-trade-helper-native-host.bat
  Delete $INSTDIR\com.google.chrome.pob.tradehelper-win.json
  Delete $INSTDIR\uninstall.exe

  ; Remove directories
  RMDir "$INSTDIR\pob_wrapper"
  RMDir "$INSTDIR\python-3.10.11-embed-amd64"
  RMDir "$INSTDIR"

SectionEnd
