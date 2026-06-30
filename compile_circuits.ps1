if (-not (Get-Command nargo -ErrorAction SilentlyContinue)) {
    Write-Host "Installing nargo via noirup..."
    $tag = (Invoke-RestMethod "https://api.github.com/repos/noir-lang/noir/releases/latest").tag_name
    $url = "https://github.com/noir-lang/noir/releases/download/$tag/nargo-x86_64-pc-windows-msvc.zip"
    Invoke-WebRequest $url -OutFile "$env:TEMP\nargo.zip"
    Expand-Archive "$env:TEMP\nargo.zip" -DestinationPath "$env:USERPROFILE\.nargo\bin" -Force
    $env:PATH += ";$env:USERPROFILE\.nargo\bin"
}

$circuits = @("invoice_proof", "kyc_proof", "merkle_membership", "solvency_proof", "age_proof")
foreach ($circuit in $circuits) {
    Write-Host "Compiling $circuit..."
    Set-Location "kryon_zk\$circuit"
    nargo compile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "FAILED to compile $circuit"
        exit 1
    }
    Set-Location "..\..\"
}
Write-Host "All circuits compiled successfully."
