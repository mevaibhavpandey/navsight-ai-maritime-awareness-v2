# Weather Module - Quick Reference Card

## 🚀 Quick Start (30 seconds)

1. Login: `DEMO001` / `demo123`
2. Click **"Weather & Disaster"** in sidebar
3. Done! Explore demo weather data

## 🔑 Add Real Weather Data (2 minutes)

1. Get free API key: https://openweathermap.org/api
2. Open browser console (F12)
3. Run: `localStorage.setItem('openWeatherKey', 'YOUR_KEY');`
4. Refresh page

## 📍 Key Features at a Glance

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Current Weather** | Top KPI cards | Temp, wind, humidity, risk level |
| **Location Search** | Search bar | Find any coastal city |
| **7-Day Forecast** | Forecast card | Daily weather predictions |
| **Cyclone Tracking** | Red alert card | Active storms with paths |
| **Weather Map** | Bottom section | Interactive visualization |
| **Historical Data** | Date selector | Past disasters & events |
| **Safety Tips** | Precautions card | Context-aware guidance |

## 🗺️ Map Layers

| Layer | Icon | Shows |
|-------|------|-------|
| **Cyclones** | 🌀 | Active storms, paths, danger zones |
| **Rainfall** | 💧 | Precipitation heatmap |
| **Wind** | 💨 | Wind speed & direction |
| **Historical** | 📍 | Past disaster locations |

**Toggle:** Use checkboxes above map

## ⚠️ Risk Levels

| Level | Color | Meaning | Action |
|-------|-------|---------|--------|
| **Low** | 🟢 Green | Normal conditions | Standard precautions |
| **Medium** | 🟡 Yellow | Increased risk | Exercise caution |
| **High** | 🟠 Orange | Significant risk | Limit activities |
| **Critical** | 🔴 Red | Immediate danger | Emergency protocols |

## 🎯 Common Tasks

### Search Location
```
1. Click search bar
2. Type city name (e.g., "Mumbai")
3. Select from results
4. Weather updates automatically
```

### Track Cyclone
```
1. Look for red "Active Cyclone Alert"
2. Review details (wind, pressure)
3. Click "View on Map"
4. See historical & forecast paths
```

### View Historical Disaster
```
1. Use date selector (calendar icon)
2. Pick past date
3. View disaster timeline
4. Click entry to see on map
```

### Check Forecast
```
1. Scroll to "7-Day Forecast"
2. Hover over days for details
3. Note precipitation probability
4. Check wind conditions
```

## 🛠️ Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| No data loading | Check API key or use demo mode |
| Map not showing | Refresh page, check browser console |
| Search not working | Try demo locations: Mumbai, Chennai, Kochi |
| Old forecast | Change location to force update |

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl + F` | Focus search bar |
| `Esc` | Close popups |
| `+` / `-` | Zoom map in/out |
| `Arrow keys` | Pan map |

## 🌊 Safety Precautions Quick Guide

### For Fishermen

**Critical Risk:**
- ⚠️ DO NOT sail
- 🔒 Secure all equipment
- 📡 Monitor coast guard
- 🏠 Move to shelter

**High Risk:**
- ⚠️ Avoid sailing
- 🌊 Stay close to shore
- 📡 Maintain radio contact

**Medium Risk:**
- ⚠️ Limit operations
- 🔒 Check equipment
- ⚓ Return before sunset

**Low Risk:**
- 📡 Monitor updates
- 🔒 Standard checks
- 📱 Emergency contacts ready

## 📊 Data Sources

| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| OpenWeather | Current weather | 10 minutes |
| OpenWeather | Forecast | 6 hours |
| Demo Mode | Simulated | Real-time |
| Historical DB | Past disasters | Static |

## 🔗 Quick Links

- **OpenWeather API**: https://openweathermap.org/api
- **IMD Official**: https://mausam.imd.gov.in/
- **Full Documentation**: `frontend/modules/weather/README.md`
- **Setup Guide**: `WEATHER_SETUP_GUIDE.md`

## 💡 Pro Tips

1. **Bookmark Locations**: Search once, note coordinates
2. **Check Before Sailing**: Always review weather + risk level
3. **Monitor Monsoon Season**: June-September for India
4. **Use Historical Data**: Learn patterns for your region
5. **Enable Notifications**: Get alerts for critical conditions
6. **Combine with Vessel Tracking**: See weather + ship positions
7. **Toggle Layers**: Customize map for your needs
8. **Save API Key**: Configure once, works forever

## 📞 Emergency Contacts

**Indian Coast Guard:**
- Emergency: 1554
- Maritime Rescue: +91-11-2309-2037

**IMD Cyclone Warning:**
- Website: https://mausam.imd.gov.in/
- Twitter: @Indiametdept

**State Disaster Management:**
- Check your state's emergency number
- Keep local contacts handy

## 🎓 Learning Path

**Beginner (Day 1):**
1. Explore demo mode
2. Search your location
3. Check current weather
4. View forecast

**Intermediate (Week 1):**
1. Configure API key
2. Track active cyclones
3. Review historical disasters
4. Understand risk levels

**Advanced (Month 1):**
1. Customize precautions
2. Integrate with vessel tracking
3. Analyze weather patterns
4. Set up alerts

## 📈 API Usage Limits

**OpenWeather Free Tier:**
- 1,000 calls/day
- 60 calls/minute
- ~100 location searches/day
- ~140 weather updates/day (10 min interval)

**Optimization Tips:**
- Use demo mode for testing
- Increase update interval if needed
- Cache frequently searched locations
- Monitor usage in OpenWeather dashboard

## 🎨 Customization Quick Codes

**Change Update Interval:**
```javascript
// In weatherService.js
updateInterval: 600000  // 10 min (default)
updateInterval: 300000  // 5 min
updateInterval: 1800000 // 30 min
```

**Add Custom Location:**
```javascript
// In weatherService.js _getDemoLocations()
{ name: 'YourCity', lat: XX.XX, lon: YY.YY, country: 'IN' }
```

**Adjust Risk Threshold:**
```javascript
// In weatherService.js calculateRiskLevel()
if (weather.wind?.speed > 40) risk = 'critical';  // Change 40
```

## ✅ Pre-Voyage Checklist

- [ ] Check current weather
- [ ] Review 7-day forecast
- [ ] Verify no active cyclones
- [ ] Confirm risk level is Low/Medium
- [ ] Read safety precautions
- [ ] Check wind speed < 25 km/h
- [ ] Verify no rainfall warnings
- [ ] Monitor coast guard advisories
- [ ] Ensure communication devices charged
- [ ] Note emergency contacts

## 🌟 Feature Highlights

**What Makes This Special:**
- ✅ Works without API key (demo mode)
- ✅ Specifically designed for fishermen
- ✅ Indian Ocean focus
- ✅ Real cyclone tracking
- ✅ Historical disaster database
- ✅ Integrated with vessel monitoring
- ✅ Mobile-responsive
- ✅ Dark/light themes
- ✅ Offline-capable (cached data)
- ✅ Free and open source

---

**Print this card and keep it handy!** 📄

For detailed information, see `WEATHER_SETUP_GUIDE.md`
