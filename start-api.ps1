# ========================================
# SCRIPT PARA INICIAR LA API
# ========================================
# Proposito: Levanta el servidor Bun en port 5000
# Uso: .\start-api.ps1

Write-Host "Iniciando First-Bun-Backend API..." -ForegroundColor Cyan
Write-Host ""

# 1. Detener cualquier instancia anterior de Bun
Write-Host "Deteniendo instancias previas de Bun..." -ForegroundColor Yellow
Stop-Process -Name "bun" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Cambiar al directorio del proyecto
Write-Host "Entrando al directorio del proyecto..." -ForegroundColor Yellow
Set-Location "d:\First-Bun-Backend-develop\First-Bun-Backend-develop"

# 2.5 Activar entorno virtual si existe
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    & ".\.venv\Scripts\Activate.ps1"
    Write-Host "Entorno virtual activado" -ForegroundColor Green
} else {
    Write-Host "No se encontro entorno virtual (opcional)" -ForegroundColor DarkYellow
}

# 3. Iniciar el servidor
Write-Host "Levantando servidor Bun..." -ForegroundColor Green
Write-Host ""
bun run src/index.ts

# 4. Si ocurre un error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error al iniciar la API" -ForegroundColor Red
    Write-Host "Codigo de error: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
