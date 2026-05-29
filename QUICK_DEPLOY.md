# 🚀 Quick Deploy to Render (5 Minutes)

## ✅ What You Need
1. GitHub account
2. Render account (free): https://render.com
3. AISStream API key: https://aisstream.io/
4. OpenWeather API key: https://openweathermap.org/api

---

## 📦 Step-by-Step Deployment

### 1️⃣ Push to GitHub (2 minutes)

```bash
cd navsight-ai-maritime-awareness-v2
git init
git add .
git commit -m "Deploy NavSight AI"
git branch -M main

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/navsight-ai.git
git push -u origin main
```

### 2️⃣ Deploy on Render (3 minutes)

1. **Go to**: https://dashboard.render.com/
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub repository
4. **Configure**:
   ```
   Name: navsight-ai
   Region: (Choose closest to you)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. **Add Environment Variables**:
   - Click "Advanced" → "Add Environment Variable"
   - Add these:
     ```
     AISSTREAM_API_KEY = your_aisstream_key_here
     OPENWEATHER_API_KEY = your_openweather_key_here
     PYTHON_VERSION = 3.11.0
     ```

6. **Click**: "Create Web Service"

7. **Wait**: 3-5 minutes for deployment

8. **Done!** Your app is live at: `https://navsight-ai.onrender.com`

---

## 🎯 Access Your Application

- **Frontend**: `https://your-app.onrender.com`
- **API Docs**: `https://your-app.onrender.com/docs`
- **WebSocket**: `wss://your-app.onrender.com/ws/vessels`

---

## 🔧 Update Frontend URL (Important!)

After deployment, update the frontend to use your Render URL:

1. Open `frontend/app.js`
2. Find line ~11:
   ```javascript
   const BACKEND = _isLiveServer ? 'http://127.0.0.1:8000' : _origin;
   ```
3. This will automatically use your Render URL when deployed!

---

## 💡 Tips

- **Free Tier**: Render free tier sleeps after 15 min of inactivity
- **First Load**: May take 30-60 seconds to wake up
- **Logs**: Check Render dashboard → Logs for debugging
- **Updates**: Just `git push` to deploy changes automatically

---

## 🆘 Troubleshooting

### Problem: Build fails
**Solution**: Check logs in Render dashboard. Usually Python version issue.
- Add `PYTHON_VERSION=3.11.0` in environment variables

### Problem: WebSocket not connecting
**Solution**: Frontend is using wrong URL
- Check browser console for errors
- Ensure `app.js` uses `_origin` for production

### Problem: No vessels showing
**Solution**: Check API keys
- Verify `AISSTREAM_API_KEY` is set correctly in Render
- Check logs: "No AIS API key" means it's missing

---

## 🎉 That's It!

Your maritime intelligence platform is now live and accessible worldwide!

**Share your deployment**: `https://your-app.onrender.com`
