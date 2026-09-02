$ErrorActionPreference='Stop'
function New-Secret([int]$bytes=48) {
  $b = New-Object byte[] $bytes
  [Security.Cryptography.RandomNumberGenerator]::Fill($b)
  return [Convert]::ToBase64String($b)
}
Write-Host "ENCRYPTION_KEY=$((New-Secret))"
Write-Host "API_INTERNAL_SECRET=$((New-Secret))"
Write-Host "BOT_SHARED_SECRET=$((New-Secret))"
