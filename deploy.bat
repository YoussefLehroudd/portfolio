@echo off
echo Building React app...
npm run build

echo Deploying to production...
git add .
git commit -m "Build for production"
git push

echo Done!
pause
