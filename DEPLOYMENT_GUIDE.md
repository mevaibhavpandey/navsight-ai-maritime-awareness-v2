# NavSight AI - Single Platform Deployment Guide

## 🚀 Deploy on Render (Recommended)

### Why Render?
- ✅ Free tier available
- ✅ Supports Python backend with WebSockets
- ✅ Can serve static frontend from same service
- ✅ Automatic HTTPS
- ✅ Easy environment variable management

---

## 📋 Pre-Deployment Checklist

### 1. Get Your API Keys
- **AISStream API Key**: Get from https://aisstream.io/
- **OpenWeather API Key**: Get from https://openweathermap.org/api

### 2. Update `.env` file (for local testing)
```env
AISSTREAM_API_KEY=your_aisstream_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
```

---

## 🎯 Render Deployment Steps

### Step 1: Push to GitHub
```bash
cd navsight-ai-maritime-awareness-v2
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/navsight-ai.git
git push -u origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `navsight-ai`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `./`)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 4: Add Environment Variables
In Render dashboard, add:
- `AISSTREAM_API_KEY` = your_key
- `OPENWEATHER_API_KEY` = your_key
- `PYTHON_VERSION` = 3.11.0

### Step 5: Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for deployment
- Your app will be live at: `https://navsight-ai.onrender.com`

---

## 🔧 Alternative: Railway Deployment

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Deploy
```bash
cd navsight-ai-maritime-awareness-v2
railway login
railway init
railway up
```

### Step 3: Add Environment Variables
```bash
railway variables set AISSTREAM_API_KEY=your_key
railway variables set OPENWEATHER_API_KEY=your_key
```

---

## 🐳 Alternative: Fly.io Deployment

### Step 1: Install Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Step 2: Login and Launch
```bash
cd navsight-ai-maritime-awareness-v2
fly auth login
fly launch
```

### Step 3: Set Secrets
```bash
fly secrets set AISSTREAM_API_KEY=your_key
fly secrets set OPENWEATHER_API_KEY=your_key
```

---

## 📱 Access Your Application

After deployment:
- **Backend API**: `https://your-app.onrender.com/docs`
- **Frontend**: `https://your-app.onrender.com`
- **WebSocket**: `wss://your-app.onrender.com/ws/vessels`

---

## 🔍 Troubleshooting

### Issue: WebSocket not connecting
**Solution**: Update frontend to use deployed URL
- Open `frontend/app.js`
- Change `BACKEND` to your Render URL

### Issue: Build fails
**Solution**: Check Python version
- Ensure `runtime.txt` has: `python-3.11.0`

### Issue: Port binding error
**Solution**: Use `$PORT` environment variable
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 💰 Cost Comparison

| Platform | Free Tier | WebSocket | Ease |
|----------|-----------|-----------|------|
| **Render** | ✅ 750hrs/mo | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Railway** | ✅ $5 credit | ✅ Yes | ⭐⭐⭐⭐ |
| **Fly.io** | ✅ Limited | ✅ Yes | ⭐⭐⭐ |

**Recommendation**: Start with Render's free tier!
