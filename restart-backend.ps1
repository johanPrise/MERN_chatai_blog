# Script pour redémarrer le backend et tester les endpoints

Write-Host "Arrêt du serveur backend..." -ForegroundColor Yellow

# Tuer tous les processus Node.js qui pourraient être en cours
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Démarrage du serveur backend..." -ForegroundColor Green

# Démarrer le serveur en arrière-plan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd api-fastify && npm run dev" -WindowStyle Minimized

# Attendre que le serveur démarre
Write-Host "Attente du démarrage du serveur (10 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Tester les endpoints
Write-Host "Test des endpoints..." -ForegroundColor Cyan

$testId = "507f1f77bcf86cd799439011"  # ID MongoDB valide mais fictif

Write-Host "Test POST /api/posts/$testId/like" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/api/posts/$testId/like" -Method POST -Body "{}" -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Like endpoint accessible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Like endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test POST /api/posts/$testId/dislike" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/api/posts/$testId/dislike" -Method POST -Body "{}" -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Dislike endpoint accessible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Dislike endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test POST /api/comments/$testId/like" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/api/comments/$testId/like" -Method POST -Body "{}" -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Comment like endpoint accessible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Comment like endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test POST /api/comments/$testId/dislike" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/api/comments/$testId/dislike" -Method POST -Body "{}" -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Comment dislike endpoint accessible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Comment dislike endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Tests terminés!" -ForegroundColor Cyan