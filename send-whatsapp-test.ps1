# Send WhatsApp Test Message using Double Tick API to BOTH numbers
Write-Host "Sending WhatsApp message to both numbers..." -ForegroundColor Green

# Phone numbers to send to
$phones = @("+919373111709", "+919822202396")

# Double Tick API format (correct format)
$messages = @()
foreach ($phone in $phones) {
    $messages += @{
        to = $phone
        content = @{
            templateName = "admission_reminder_5days"
            language = "en"
            templateData = @{
                body = @{
                    placeholders = @(
                        "MASTER MOHAMMD MAAZ",
                        "29/09/2025",
                        "esic"
                    )
                }
            }
        }
    }
}

$body = @{
    messages = $messages
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "key_8sc9MP6JpQ"
    "accept" = "application/json"
}

try {
    Write-Host "Sending to: https://public.doubletick.io/whatsapp/message/template" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "https://public.doubletick.io/whatsapp/message/template" -Method Post -Headers $headers -Body $body
    Write-Host "✅ WhatsApp message sent successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error sending message:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details:" $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}
