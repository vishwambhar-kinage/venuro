$source = Get-Location
$destination = "$source\Venuro-FullStack-Project.zip"
$temp = "$env:TEMP\Venuro-Package"

if (Test-Path $temp) {
    Remove-Item -Recurse -Force $temp
}

New-Item -ItemType Directory -Path $temp | Out-Null

robocopy "$source" "$temp" /E /XD node_modules .git dist /XF *.zip
Compress-Archive -Path "$temp\*" -DestinationPath $destination -Force
Remove-Item -Recurse -Force $temp

$item = Get-Item $destination
Write-Host "SUCCESS: $($item.FullName) ($([math]::Round($item.Length/1KB, 2)) KB)"
