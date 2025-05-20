@echo off
echo Building and deploying to Render...

:: Add all changes
git add .

:: Commit changes
git commit -m "fix: Update Render configuration for client-side routing"

:: Push to the repository
git push origin main

echo Deployment complete! Changes will be automatically deployed on Render.
echo Please wait a few minutes for the changes to take effect.
pause
