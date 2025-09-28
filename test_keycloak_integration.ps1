# Keycloak Integration Test Script
Write-Host "=== Keycloak Integration Test ===" -ForegroundColor Green

# Test 1: Check if Keycloak is running
Write-Host "`n1. Testing Keycloak connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/dasm-platform" -Method GET -TimeoutSec 10
    Write-Host "✅ Keycloak realm accessible: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Keycloak realm not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check JWKS endpoint
Write-Host "`n2. Testing JWKS endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/dasm-platform/protocol/openid-connect/certs" -Method GET -TimeoutSec 10
    Write-Host "✅ JWKS endpoint accessible: $($response.StatusCode)" -ForegroundColor Green
    $jwks = $response.Content | ConvertFrom-Json
    Write-Host "   Keys found: $($jwks.keys.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ JWKS endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test client credentials for dasm-backend
Write-Host "`n3. Testing dasm-backend client credentials..." -ForegroundColor Yellow
try {
    $body = "grant_type=client_credentials&client_id=dasm-backend&client_secret=89YPkROWWw36k9CSq8A4t29YkSE2heL6"
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded" -TimeoutSec 10
    Write-Host "✅ dasm-backend client credentials work: $($response.StatusCode)" -ForegroundColor Green
    $token = $response.Content | ConvertFrom-Json
    Write-Host "   Token type: $($token.token_type)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ dasm-backend client credentials failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test ROPC flow for dasm-frontend
Write-Host "`n4. Testing dasm-frontend ROPC flow..." -ForegroundColor Yellow
try {
    $body = "grant_type=password&client_id=dasm-frontend&username=admin&password=admin123"
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded" -TimeoutSec 10
    Write-Host "✅ dasm-frontend ROPC flow works: $($response.StatusCode)" -ForegroundColor Green
    $token = $response.Content | ConvertFrom-Json
    Write-Host "   Access token length: $($token.access_token.Length)" -ForegroundColor Cyan
    $global:frontendToken = $token.access_token
} catch {
    Write-Host "❌ dasm-frontend ROPC flow failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test backend configuration
Write-Host "`n5. Testing backend configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/debug-keycloak-config" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend configuration accessible: $($response.StatusCode)" -ForegroundColor Green
    $config = $response.Content | ConvertFrom-Json
    Write-Host "   Realm: $($config.keycloak_config.realm)" -ForegroundColor Cyan
    Write-Host "   Client ID: $($config.keycloak_config.client_id)" -ForegroundColor Cyan
    Write-Host "   Client Secret: $($config.keycloak_config.client_secret.Substring(0,10))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend configuration not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Test token validation (if we have a token)
if ($global:frontendToken) {
    Write-Host "`n6. Testing token validation..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $($global:frontendToken)"
            "Content-Type" = "application/json"
        }
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/validate-keycloak-token" -Method POST -Headers $headers -Body "{}" -TimeoutSec 10
        Write-Host "✅ Token validation works: $($response.StatusCode)" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($result.status)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Token validation failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorContent = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorContent)
            $errorText = $reader.ReadToEnd()
            Write-Host "   Error details: $errorText" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
