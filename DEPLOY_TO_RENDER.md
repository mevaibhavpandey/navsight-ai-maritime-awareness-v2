# Deploy NavSight AI to Render

## Step 1: Push Configuration Files to GitHub

Copy and paste these commands in your terminal:

```bash
cd navsight-ai-maritime-awareness
git add requirements.txt render.yaml runtime.txt __init__.py
git commit -m "Add Render deployment configuration"
git push origin Realtime_001
```

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to: https://dashboard.render.com/
2. Click "New +" → "Blueprint"
3. Connect your repository: `https://github.com/raksh3011/navsight-ai-maritime-awareness`
4. Select branch: `Realtime_001`
5. Render will automatically detect `render.yaml` and configure everything
6. Click "Apply" to deploy

### Option B: Manual Web Service Setup

1. Go to: https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect repository: `https://github.com/raksh3011/navsight-ai-maritime-awareness`
4. Configure:
   - **Name**: navsight-backend
   - **Branch**: Realtime_001
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `AIS_PROVIDER` = `demo`
   - `AIS_API_KEY` = `your_api_key_here`
   - `PYTHON_VERSION` = `3.11.0`
6. Click "Create Web Service"

## Step 3: Access Your Application

Once deployed, Render will give you a URL like:
```
https://navsight-backend.onrender.com
```

Your frontend will be accessible at:
```
https://navsight-backend.onrender.com/
```

API docs at:
```
https://navsight-backend.onrender.com/docs
```

## Login Credentials

- **Officer ID**: DEMO001
- **Security Code**: demo123

## Troubleshooting

If deployment fails:
1. Check Python version is set to 3.11.0 (not 3.14)
2. Verify all files are committed and pushed
3. Check Render logs for specific errors
4. Ensure the start command includes `cd backend`

## Notes

- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Demo mode runs with 15 simulated vessels
- To use real AIS data, update `AIS_API_KEY` in environment variables
