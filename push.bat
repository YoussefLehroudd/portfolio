@echo off
git add .
set /p commit_msg="Enter commit message: "
git commit -m "%commit_msg%"
git push
