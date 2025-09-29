# TODO: Fix MongoDB Authentication Failure on Render Deployment

## Overview
The MongoDB connection fails due to authentication issues in the deployment environment. The code is correct; fixes involve updating environment variables on Render and verifying MongoDB Atlas settings. Follow these steps in order.

## Steps

### 1. Update MONGODB_URI in Render Environment Variables [PENDING]
   - Log in to your Render dashboard (https://dashboard.render.com).
   - Select the "portfolio" service (or the relevant web service).
   - Go to the "Environment" tab.
   - Add or edit the `MONGODB_URI` variable:
     - Full example value (with encoded password): `mongodb+srv://youssef:Youssef2004%21@cluster0.your-cluster-shard.mongodb.net/portfolio?retryWrites=true&w=majority`
       - **Get your exact cluster SRV URL**:
         1. Go to MongoDB Atlas (https://cloud.mongodb.com) > Your Project > Clusters > Click "Connect" on your cluster (e.g., Cluster0).
         2. Select "Drivers" > Node.js > Version 4.7 or later.
         3. Copy the connection string: It will look like `mongodb+srv://youssef:<password>@cluster0.abcde123.mongodb.net/?retryWrites=true&w=majority`.
         4. Replace `<password>` with `Youssef2004%21` (encoded for "!").
         5. Change the end from `/?retryWrites=true&w=majority` to `/portfolio?retryWrites=true&w=majority` to specify the "portfolio" database.
       - Username: `youssef` (as shown in your images).
       - Password: `Youssef2004!` (must be URL-encoded as `Youssef2004%21` – this fixes the AuthenticationFailed error).
       - Database: `/portfolio` (your database name from Atlas).
     - Ensure other vars are set: `JWT_SECRET` (generate a secure one if missing, e.g., via https://generate-secret.vercel.app/32), `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NODE_ENV=production`.
   - Save changes. This is the key fix for the auth failure.

### 2. Verify and Update MongoDB Atlas Settings [PENDING]
   - Log in to MongoDB Atlas (https://cloud.mongodb.com).
   - Select your cluster.
   - **Database Access** (left sidebar):
     - Ensure user "youssef" exists with password "Youssef2004!".
     - Role: "Read and write to any database" (or Atlas admin if needed).
     - If issues, edit user or create new with these creds.
   - **Network Access** (left sidebar):
     - Click "Add IP Address".
     - Select "Allow Access from Anywhere" (0.0.0.0/0) to permit Render's dynamic IPs.
     - Confirm and save.
   - Note: For security, monitor access logs after enabling 0.0.0.0/0.

### 3. Redeploy the Service on Render [PENDING]
   - In Render dashboard, go to your service > "Deploys" tab.
   - Click "Manual Deploy" > "Deploy latest commit".
   - Monitor the build and deploy logs in real-time.
   - Look for "Connected to MongoDB" in logs instead of the auth error.
   - If successful, the service should stay running without exiting (status 1).

### 4. Test the Deployment [PENDING]
   - Once deployed, visit your Render URL (e.g., https://portfolio-qjxg.onrender.com).
   - Test API endpoints:
     - GET `/health` or `/api` (should return JSON without errors).
     - If admin routes need testing, use Postman or browser to hit e.g., `/api/hero` (assuming data exists).
   - Check Render logs for any runtime DB query errors.
   - Local test: Add `.env` file in project root with the same `MONGODB_URI`, run `npm run prod` to verify.

### 5. Troubleshooting if Issues Persist [PENDING]
   - If auth still fails: Double-check encoding (use online URL encoder for password), confirm cluster name, or reset password in Atlas.
   - Network error: Ensure Atlas project is active and no VPC peering issues.
   - Share new logs here for further debugging.
   - Update this TODO as steps complete (e.g., mark [DONE]).

## Completion Criteria
- Server deploys and stays running on Render.
- DB connection logs "Connected to MongoDB".
- Basic API calls succeed (e.g., fetch hero or projects data).

Last Updated: [Current Date]
