# 🚀 Deploy NavSight AI in 5 Minutes

## Answer: YES! One Platform (Render)

Your entire application (frontend + backend + WebSocket) can be deployed on **Render** for **FREE**.

---

## 🎯 Three Simple Steps

### 1. Get API Keys (2 minutes)
- **AISStream**: https://aisstream.io/ → Sign up → Copy API key
- **OpenWeather**: https://openweathermap.org/api → Sign up → Copy API key

### 2. Push to GitHub (1 minute)
```bash
git init
git add .
git commit -m "Deploy NavSight AI"
git remote add origin https://github.com/YOUR_USERNAME/navsight-ai.git
git push -u origin main
```

### 3. Deploy on Render (2 minutes)
1. Go to: https://dashboard.render.com/
2. Click: **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   ```
   Build Command: pip install -r requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Add Environment Variables:
   - `AISSTREAM_API_KEY` = (your key)
   - `OPENWEATHER_API_KEY` = (your key)
   - `PYTHON_VERSION` = 3.11.0
6. Click: **"Create Web Service"**

**Done!** Your app is live at: `https://your-app.onrender.com` 🎉

---

## 📚 Detailed Guides

- **Quick Start**: See `QUICK_DEPLOY.md`
- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Summary**: See `DEPLOYMENT_SUMMARY.md`

---

## ✅ What's Included

- ✅ Real-time vessel tracking (AIS data)
- ✅ Weather & disaster monitoring
- ✅ Alert system
- ✅ Naval response planning
- ✅ Analytics dashboard
- ✅ WebSocket live updates

---

## 💰 Cost

**FREE** on Render's free tier:
- 750 hours/month
- Automatic HTTPS
- Custom domains
- Sleeps after 15 min (wakes in 30 sec)

---

## 🆘 Problems?

Check the logs in Render dashboard or read the troubleshooting section in `QUICK_DEPLOY.md`.

---

**Ready?** Follow `QUICK_DEPLOY.md` now! 🚀
