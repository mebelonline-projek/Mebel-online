$data = Invoke-RestMethod -Uri 'https://www.cloudflarestatus.com/api/v2/components.json'
$degraded = $data.components | Where-Object { $_.status -ne 'operational' }
if ($degraded) {
    Write-Host "=== DEGRADED COMPONENTS ==="
    foreach ($c in $degraded) {
        Write-Host "$($c.name) : $($c.status)"
    }
} else {
    Write-Host "All components operational"
}

Write-Host ""
Write-Host "=== ACTIVE INCIDENTS ==="
$incidents = Invoke-RestMethod -Uri 'https://www.cloudflarestatus.com/api/v2/incidents.json'
$active = $incidents.incidents | Where-Object { $_.status -ne 'resolved' }
if ($active) {
    foreach ($i in $active) {
        Write-Host "Name: $($i.name)"
        Write-Host "Status: $($i.status)"
        Write-Host "Impact: $($i.impact)"
        Write-Host "Created: $($i.created_at)"
        Write-Host "Updated: $($i.updated_at)"
        Write-Host "---"
    }
} else {
    Write-Host "No active incidents"
}