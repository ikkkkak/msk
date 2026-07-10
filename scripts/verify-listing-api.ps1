# Run while the Go server is up: go run .  (port 4000)
$hostIp = "192.168.100.44"
$port = 4000

$checks = @(
  @{ Name = "Health"; Method = "GET"; Url = "http://${hostIp}:${port}/health" },
  @{ Name = "Create sale (no auth)"; Method = "POST"; Url = "http://${hostIp}:${port}/api/property-sales/" }
)

Write-Host "Verifying API at ${hostIp}:${port} (update hostIp if your LAN IP changed)`n"

foreach ($c in $checks) {
  try {
    if ($c.Method -eq "GET") {
      $r = Invoke-WebRequest -Uri $c.Url -Method GET -TimeoutSec 8 -UseBasicParsing
    } else {
      $body = '{"title":"t","description":"d","property_type":"Apartment","price":1,"area":1,"address":"a","city":"c","state":"-","country":"Mauritania","latitude":1,"longitude":1,"images":["https://example.com/x.jpg"],"videos":[]}'
      $r = Invoke-WebRequest -Uri $c.Url -Method POST -Body $body -ContentType "application/json" -TimeoutSec 8 -UseBasicParsing
    }
    Write-Host "[OK] $($c.Name) -> $($r.StatusCode)" -ForegroundColor Green
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($c.Name -like "*no auth*" -and $code -eq 401) {
      Write-Host "[OK] $($c.Name) -> 401 (route exists, auth required)" -ForegroundColor Green
    } else {
      Write-Host "[FAIL] $($c.Name) -> $code $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

Write-Host "`nExpected app URLs (constants.ts LOCAL_DEV_SERVER_URL):"
Write-Host "  http://${hostIp}:${port}/api/property-sales/"
Write-Host "  http://${hostIp}:${port}/api/upload/image"
Write-Host "  http://${hostIp}:${port}/api/listing-ai/jobs"
