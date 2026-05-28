$root = Split-Path (Split-Path $PSScriptRoot)
& "$root\node_modules\electron\dist\electron.exe" $PSScriptRoot
