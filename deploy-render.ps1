# PowerShell deployment script
Write-Host "Building and deploying to Render..."

# Add all changes
git add .

# Commit changes
git commit -m "fix: Update server configuration for client-side routing"

# Push to the repository
git push origin main

Write-Host "Deployment complete! Changes will be automatically deployed on Render."
Write-Host "Please wait a few minutes for the changes to take effect."
pause
