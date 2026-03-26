/**
 * Ocean Risk and Vessel Monitoring System (ORVMS)
 * Fetches vessel data from backend (which streams from aisstream.io)
 */

// Auto-detect backend: if served from Live Server (port 5500/5501) or file://,
// point to the FastAPI backend on localhost:8000
const _origin = window.location.origin;
const _isLiveServer = /:(5[45]\d\d|3000|4000|8080)$/.test(_origin) || _origin.startsWith('file:');
const BACKEND = _isLiveServer ? 'http://127.0.0.1:8000' : _origin;
const WS_URL  = BACKEND.replace(/^http/, 'ws') + '/ws/vessels';

localStorage.setItem('tileStyle', localStorage.getItem('tileStyle') || 'satellite');

let CFG = {
  trailLength: parseInt(localStorage.getItem('trailLength') || '8'),
  tileStyle:   localStorage.getItem('tileStyle'),
  theme:       localStorage.getItem('theme') || 'dark',
};

// ── 15 distinct vessel category colors — defined first so drawCanvas can use them ──
const VESSEL_COLORS = {
  'Naval Vessel':      '#4895ef',
  'Coast Guard':       '#00b4d8',
  'Cargo Ship':        '#06d6a0',
  'Container Ship':    '#0ead69',
  'Tanker':            '#ffd60a',
  'Passenger Ship':    '#ff9f1c',
  'Fishing Vessel':    '#adb5bd',
  'High Speed Craft':  '#f72585',
  'Special Craft':     '#b5179e',
  'Wing In Ground':    '#7209b7',
  'Research Vessel':   '#3a86ff',
  'Sailing Vessel':    '#8ecae6',
  'Tug':               '#fb8500',
  'Suspicious':        '#ef476f',
  'Unknown':           '#90caf9',
};
function vesselColor(v) {
  const t = v.vessel_type || 'Unknown';
  // Yellow for vessels inside or near (within ~1°) a piracy zone
  if (_nearPiracyZone(v.lat, v.lon)) return '#ffd60a';
  if (isCriticalVessel(v)) return '#ef476f';
  return VESSEL_COLORS[t] || VESSEL_COLORS['Unknown'];
}

function isCriticalVessel(v) {
  return !FRIENDLY_FLAGS.has(v.flag || '') && v.flag !== 'Unknown' &&
         _inIndiaEEZ(v.lat, v.lon) && (v.speed || 0) >= HIGH_SPEED_KNOTS;
}

function _nearPiracyZone(lat, lon) {
  const BUFFER = 1.0; // ~110km
  return PIRACY_ZONE_BOUNDS.some(z =>
    lat >= z.latMin - BUFFER && lat <= z.latMax + BUFFER &&
    lon >= z.lonMin - BUFFER && lon <= z.lonMax + BUFFER
  );
}

// ── Persistent state ──────────────────────────────────────────────────────────
const vessels = {};
const alerts  = [];
let backendWs = null, wsRetry = 2000;
let pollTimer = null;
let currentPage = 'dashboard';
let mainMap, miniMap, tileMain, tileMini;
let charts = {}, timelineData = { labels:[], counts:[] };
let layerBoundary, layerPatrol, layerExercise, layerPiracy, layerCheckpoints;
let _overlay = null, _rafPending = false;
let _miniCanvas = null, _uiTimer = null;

// ── Canvas vessel rendering ───────────────────────────────────────────────────
function scheduleRedraw() {
  if (!_rafPending) { _rafPending = true; requestAnimationFrame(() => { _rafPending = false; drawCanvas(); }); }
}

function initCanvasOverlay() {
  if (_overlay) return;
  // Use a fixed-position canvas over the map container — simplest, most reliable
  const mapEl = document.getElementById('main-map');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:auto;z-index:500;';
  mapEl.style.position = 'relative';
  mapEl.appendChild(canvas);
  _overlay = canvas;

  function resize() {
    canvas.width  = mapEl.offsetWidth;
    canvas.height = mapEl.offsetHeight;
    scheduleRedraw();
  }
  resize();
  new ResizeObserver(resize).observe(mapEl);
  mainMap.on('move zoom moveend zoomend', scheduleRedraw);

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    let best = null, bestD = 16;
    for (const v of Object.values(vessels)) {
      try {
        const p = mainMap.latLngToContainerPoint([v.lat, v.lon]);
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < bestD) { bestD = d; best = v; }
      } catch {}
    }
    if (best) showVesselDetail(best.mmsi);
  });
}

function drawCanvas() {
  if (!_overlay || !mainMap) return;
  const canvas = _overlay, ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const zoom = mainMap.getZoom();
  const vList = Object.values(vessels);

  // ── Piracy zones — geographic rectangles drawn on canvas, stable at all zooms ──
  if (_piracyVisible) {
    ctx.save();
    PIRACY_ZONES.forEach(z => {
      try {
        // Convert all 4 geographic corners to screen pixels
        const sw = mainMap.latLngToContainerPoint([z.lat - z.dLat, z.lon - z.dLon]);
        const ne = mainMap.latLngToContainerPoint([z.lat + z.dLat, z.lon + z.dLon]);
        const x = Math.min(sw.x, ne.x), y = Math.min(sw.y, ne.y);
        const w = Math.abs(ne.x - sw.x), h = Math.abs(ne.y - sw.y);
        // Fill
        ctx.fillStyle = '#ef476f';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x, y, w, h);
        // Border
        ctx.strokeStyle = '#ef476f';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 4]);
        ctx.globalAlpha = 0.9;
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        // Label
        ctx.font = 'bold 11px Segoe UI,sans-serif';
        ctx.fillStyle = '#ef476f';
        ctx.globalAlpha = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4;
        ctx.fillText(z.name, x + 5, y + 15);
        ctx.shadowBlur = 0;
      } catch {}
    });
    ctx.restore();
  }

  // Trails at zoom >= 8
  if (zoom >= 8) {
    ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    for (const v of vList) {
      if (!v.trail || v.trail.length < 2) continue;
      try {
        ctx.beginPath(); ctx.strokeStyle = vesselColor(v);
        let first = true;
        for (const pt of v.trail) {
          const p = mainMap.latLngToContainerPoint([pt[0], pt[1]]);
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false;
        }
        const lp = mainMap.latLngToContainerPoint([v.lat, v.lon]);
        ctx.lineTo(lp.x, lp.y); ctx.stroke();
      } catch {}
    }
    ctx.globalAlpha = 1;
  }

  // Vessel markers — MarineTraffic-style triangle ship icons
  for (const v of vList) {
    try {
      const p = mainMap.latLngToContainerPoint([v.lat, v.lon]);
      if (p.x < -20 || p.y < -20 || p.x > canvas.width+20 || p.y > canvas.height+20) continue;

      // Critical = unfriendly inside EEZ at high speed, or has active critical alert
      const isCritical = isCriticalVessel(v);
      const isUnfriendlyInEEZ = !FRIENDLY_FLAGS.has(v.flag||'') && v.flag !== 'Unknown' &&
                                 _inIndiaEEZ(v.lat, v.lon);

      const color = isCritical ? '#ef476f' : vesselColor(v);
      const angle = (v.heading || 0) * Math.PI / 180;

      // Pulsing red ring for critical vessels (drawn behind the icon)
      if (isCritical || isUnfriendlyInEEZ) {
        const ringR = zoom >= 9 ? 14 : 8;
        const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 400);
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef476f';
        ctx.lineWidth = isCritical ? 2.5 : 1.5;
        ctx.globalAlpha = pulse;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Schedule continuous redraw for animation
        if (!_rafPending) scheduleRedraw();
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      if (zoom >= 9) {
        const h = zoom >= 12 ? 20 : zoom >= 10 ? 15 : 11;
        const w = h * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w, h * 0.5);
        ctx.lineTo(0, h * 0.2);
        ctx.lineTo(-w, h * 0.5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.strokeStyle = isCritical ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = isCritical ? 1.5 : 0.8;
        ctx.stroke();
      } else if (zoom >= 5) {
        // Medium triangle
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fill();
      } else {
        // Small triangle even at world zoom — no circles
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3, 4);
        ctx.lineTo(-3, 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    } catch {}
  }

  // Labels at zoom >= 12
  if (zoom >= 12) {
    ctx.font = '10px Segoe UI,sans-serif'; ctx.globalAlpha = 0.9;
    for (const v of vList) {
      try {
        const p = mainMap.latLngToContainerPoint([v.lat, v.lon]);
        if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height) continue;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 3;
        ctx.fillText(v.name || v.mmsi, p.x + 10, p.y + 4);
        ctx.shadowBlur = 0;
      } catch {}
    }
    ctx.globalAlpha = 1;
  }
}

// ── Auth / Init ───────────────────────────────────────────────────────────────
let _appInited = false;
function login() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (!u || !p) return showToast('Enter credentials','warning');
  sessionStorage.setItem('nv_user', u);
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initApp();
}
function logout() { sessionStorage.removeItem('nv_user'); location.reload(); }

function initApp() {
  if (_appInited) return;
  _appInited = true;
  applyTheme(CFG.theme);
  initMaps();
  initCharts();
  startClock();
  connectAIS();
  const el = document.getElementById('cfg-trail'); if (el) el.value = CFG.trailLength;
  const ts = document.getElementById('cfg-tiles'); if (ts) ts.value = CFG.tileStyle;
}
function startClock() {
  const el = document.getElementById('header-time');
  if (el) setInterval(() => { el.textContent = new Date().toUTCString().slice(17,25)+' UTC'; }, 1000);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  currentPage = page;
  if (page === 'map') {
    setTimeout(() => {
      mainMap?.invalidateSize({ animate: false });
      scheduleRedraw();
      updateViewportCount();
    }, 50);
  }
  if (page === 'analytics') updateCharts();
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) sb.classList.toggle('mobile-open');
  else sb.classList.toggle('collapsed');
}

// ── Maps ──────────────────────────────────────────────────────────────────────
const TILES = {
  satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'© Esri' },
  dark:      { url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr:'© CartoDB' },
  osm:       { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr:'© OSM' },
};
// India 200-NM EEZ boundary — traced from official maritime survey map
// Main EEZ polygon (Arabian Sea + Bay of Bengal) + Andaman & Nicobar extension
const INDIA_BOUNDARY_MAIN = [
  // North boundary (top edge, west to east)
  [23.5, 62.0], [23.5, 68.0], [23.5, 72.0], [23.0, 80.0], [22.5, 87.0], [22.0, 89.5],
  // Northeast corner — Bangladesh/Myanmar
  [21.5, 89.5],
  // East coast going south (Bay of Bengal outer limit ~88-89°E)
  [20.0, 89.0], [18.0, 88.5], [16.0, 88.0], [14.0, 87.5], [12.5, 87.0],
  [11.0, 86.5], [10.0, 85.5], [9.0, 84.0],
  // Southeast — below Sri Lanka gap
  [8.0, 82.5], [7.0, 81.0], [6.0, 80.0],
  // Southern tip (dips to ~2°N between Sri Lanka and Maldives)
  [5.0, 78.5], [3.5, 77.0], [2.5, 75.5], [2.0, 74.0],
  [2.5, 72.5], [3.5, 71.0],
  // Southwest — Lakshadweep Sea, curving back up
  [5.0, 69.5], [6.5, 68.0], [7.5, 67.5],
  // West coast going north (Arabian Sea outer limit ~67-68°E)
  [9.0, 67.0], [11.0, 66.5], [13.0, 66.0], [15.0, 65.5],
  [17.0, 65.0], [19.0, 64.0], [21.0, 63.0], [22.5, 62.5],
  // Close
  [23.5, 62.0],
];

// Andaman & Nicobar Islands EEZ — separate eastern block
const INDIA_BOUNDARY_ANDAMAN = [
  [14.0, 91.5], [14.0, 96.5],
  [13.0, 97.0], [12.0, 97.0], [11.0, 96.5],
  [10.0, 96.0], [9.0, 95.5],  [8.0, 95.0],
  [7.0, 94.5],  [6.5, 93.5],  [6.0, 92.5],
  [6.5, 91.5],  [7.5, 91.0],  [9.0, 91.0],
  [11.0, 91.0], [13.0, 91.0],
  [14.0, 91.5],
];
// Piracy zones — correct geographic positions
// Piracy zones — center lat/lon + geographic half-size in degrees
// px field = half-size in degrees (not pixels) so zone stays geographically consistent
const PIRACY_ZONES = [
  { lat: 12.5, lon: 47.5, dLat: 2.0, dLon: 4.5, name: 'Gulf of Aden' },
  { lat:  8.5, lon: 56.0, dLat: 3.5, dLon: 8.5, name: 'Somali Basin' },
  { lat:  4.5, lon: 99.5, dLat: 1.5, dLon: 1.5, name: 'Malacca Strait' },
];

// Geographic bounding boxes for alert detection (lat/lon)
const PIRACY_ZONE_BOUNDS = [
  { latMin:10, latMax:15, lonMin:43, lonMax:52, name:'Gulf of Aden' },
  { latMin: 5, latMax:12, lonMin:48, lonMax:65, name:'Somali Basin' },
  { latMin: 3, latMax: 6, lonMin:98, lonMax:101, name:'Malacca Strait' },
];

let _piracyVisible = true;

function initMaps() {
  const t = TILES[CFG.tileStyle] || TILES.satellite;
  miniMap = L.map('mini-map', {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    dragging: false,
  }).setView([15,78], 3);
  tileMini = L.tileLayer(t.url,{ maxZoom:18, attribution:t.attr, noWrap:true }).addTo(miniMap);

  mainMap = L.map('main-map',{
    zoomControl: true,
    worldCopyJump: false,
    maxBoundsViscosity: 1.0,
    maxBounds: [[-85,-180],[85,180]],
    minZoom: 2,
  }).setView([15,78], 3);
  tileMain = L.tileLayer(t.url,{ maxZoom:18, attribution:t.attr, noWrap:true }).addTo(mainMap);

  const eezStyle = {
    color: '#00e5ff', weight: 2, dashArray: '6,4',
    opacity: 0.9, fillColor: '#00e5ff', fillOpacity: 0.08,
    smoothFactor: 1.5,
  };
  layerBoundary = L.layerGroup([
    L.polygon(INDIA_BOUNDARY_MAIN, eezStyle)
      .bindTooltip('India 200-NM EEZ — Main'),
    L.polygon(INDIA_BOUNDARY_ANDAMAN, eezStyle)
      .bindTooltip('India 200-NM EEZ — Andaman & Nicobar'),
  ]).addTo(mainMap).addTo(miniMap);

  layerPatrol      = L.layerGroup().addTo(mainMap);
  layerExercise    = L.layerGroup().addTo(mainMap);
  layerPiracy      = L.layerGroup().addTo(mainMap); // kept for toggleLayer compat
  layerCheckpoints = L.layerGroup().addTo(mainMap);

  mainMap.on('moveend zoomend', updateViewportCount);
  setTimeout(() => { miniMap.invalidateSize(); mainMap.invalidateSize(); initCanvasOverlay(); }, 300);
}

function buildLegend() { /* legend removed */ }

function changeTiles(style) {
  CFG.tileStyle = style; localStorage.setItem('tileStyle', style);
  const t = TILES[style];
  if (tileMini) miniMap.removeLayer(tileMini);
  if (tileMain) mainMap.removeLayer(tileMain);
  tileMini = L.tileLayer(t.url,{ maxZoom:18, attribution:t.attr, noWrap:true }).addTo(miniMap);
  tileMain = L.tileLayer(t.url,{ maxZoom:18, attribution:t.attr, noWrap:true }).addTo(mainMap);
  tileMini.bringToBack(); tileMain.bringToBack();
}

function toggleLayer(name, on) {
  const lmap = { boundary:layerBoundary, patrol:layerPatrol, exercise:layerExercise, checkpoints:layerCheckpoints };
  if (name === 'piracy') { _piracyVisible = on; scheduleRedraw(); return; }
  const layer = lmap[name]; if (!layer) return;
  on ? mainMap.addLayer(layer) : mainMap.removeLayer(layer);
  if (name === 'boundary') on ? miniMap.addLayer(layer) : miniMap.removeLayer(layer);
}
function toggleMapPanel() {
  const body = document.getElementById('map-panel-body'), chev = document.getElementById('panel-chevron');
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  chev.className = open ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
}
function updateViewportCount() {
  if (!mainMap) return;
  const b = mainMap.getBounds();
  setText('map-viewport-count', Object.values(vessels).filter(v => b.contains([v.lat,v.lon])).length);
}

// ── Zone helpers (called from file upload) ────────────────────────────────────
function addPatrolZone(coords, name) {
  if (!layerPatrol) return;
  L.polygon(coords,{ color:'#06d6a0', weight:2, fillOpacity:0.12, fillColor:'#06d6a0' })
    .bindTooltip('Patrol: '+name).addTo(layerPatrol);
}
function addExerciseZone(coords, name) {
  if (!layerExercise) return;
  L.polygon(coords,{ color:'#ffd60a', weight:2, fillOpacity:0.12, fillColor:'#ffd60a' })
    .bindTooltip('Exercise: '+name).addTo(layerExercise);
}
function addCheckpoint(lat, lon, name) {
  if (!layerCheckpoints) return;
  L.circleMarker([lat,lon],{ radius:7, color:'#fff', fillColor:'#00b4d8', fillOpacity:0.9, weight:2 })
    .bindTooltip('Checkpoint: '+name).addTo(layerCheckpoints);
}
function addPiracyZone(bounds, name) {
  if (!layerPiracy) return;
  L.rectangle(bounds,{ color:'#ef476f', weight:1.5, fillOpacity:0.15, fillColor:'#ef476f' })
    .bindTooltip('Piracy: '+name).addTo(layerPiracy);
}

// ── Backend connection — REST polling primary, WebSocket upgrade ──────────────
function connectAIS() {
  setConnStatus('polling');
  setText('st-provider', 'aisstream.io via backend');
  // Start REST polling immediately — don't wait for WebSocket
  startPoll();
  // Also try WebSocket for real-time updates
  tryWebSocket();
}

function tryWebSocket() {
  try {
    backendWs = new WebSocket(WS_URL);
    backendWs.onopen = () => {
      wsRetry = 2000;
      setConnStatus('live');
      console.log('[ORVMS] WS connected');
    };
    backendWs.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.vessels) ingestVessels(data.vessels);
        if (data.alerts)  ingestAlerts(data.alerts);
      } catch {}
    };
    backendWs.onerror = () => {};
    backendWs.onclose = () => {
      setTimeout(tryWebSocket, wsRetry);
      wsRetry = Math.min(wsRetry * 2, 30000);
    };
  } catch {}
}

function startPoll() {
  clearInterval(pollTimer);
  pollOnce();
  pollTimer = setInterval(pollOnce, 3000);
}

async function pollOnce() {
  try {
    const [vr, ar] = await Promise.all([
      fetch(`${BACKEND}/vessels/live`),
      fetch(`${BACKEND}/alerts?limit=50`),
    ]);
    if (vr.ok) { const d = await vr.json(); ingestVessels(d.vessels || []); }
    if (ar.ok) { const d = await ar.json(); ingestAlerts(d.alerts || []); }
    // Update KPIs immediately after every poll
    updateKPIs();
    updateDashVessels();
    updateDashAlerts();
    setText('st-count', Object.keys(vessels).length);
    setText('st-update', new Date().toLocaleTimeString());
    if (!backendWs || backendWs.readyState !== WebSocket.OPEN) {
      setConnStatus('polling');
    }
  } catch (e) {
    console.warn('[ORVMS] Poll failed:', e.message);
    setConnStatus('error');
  }
}

function ingestVessels(list) {
  let changed = false;
  for (const v of list) {
    if (!v || !v.mmsi) continue;
    // Filter obviously bad coordinates (land vessels from bad AIS data)
    const lat = parseFloat(v.lat), lon = parseFloat(v.lon);
    if (isNaN(lat) || isNaN(lon)) continue;
    if (lat === 0 && lon === 0) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    // Speed sanity check — AIS sometimes sends 102.3 kn (invalid)
    if (v.speed > 60) v.speed = 0;
    const prev = vessels[v.mmsi];
    if (prev) {
      v.trail = prev.trail || [];
      const last = v.trail[v.trail.length - 1];
      if (!last || last[0] !== prev.lat || last[1] !== prev.lon)
        v.trail = [...v.trail, [prev.lat, prev.lon]].slice(-CFG.trailLength);
    } else {
      v.trail = v.trail || [];
    }
    vessels[v.mmsi] = v;
    changed = true;
    evaluateAlerts(v);
  }
  if (changed) { scheduleRedraw(); updateMiniDots(); throttledUIUpdate(); }
}

function ingestAlerts(list) {
  for (const a of list) {
    if (!alerts.find(x => x.id === a.id)) alerts.unshift(a);
  }
  if (alerts.length > 1000) alerts.splice(1000);
}

// ── Frontend alert engine ─────────────────────────────────────────────────────
// Rules:
//   1. High speed (≥25 kn) OUTSIDE Indian maritime boundary → LOW
//   2. Unfriendly vessel inside/entering Indian boundary     → HIGH
//   3. Unfriendly vessel inside/entering at high speed       → CRITICAL

const _alertCooldowns = {};
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min per vessel per rule

function _cooldownOk(mmsi, rule) {
  const key = `${mmsi}:${rule}`;
  const last = _alertCooldowns[key] || 0;
  if (Date.now() - last < ALERT_COOLDOWN_MS) return false;
  _alertCooldowns[key] = Date.now();
  return true;
}

function _pushAlert(mmsi, name, type, message, priority, lat, lon) {
  // Deduplicate within 5 min
  const recent = alerts.find(a => a.vessel_mmsi === mmsi && a.alert_type === type);
  if (recent && (Date.now() - new Date(recent.timestamp).getTime()) < ALERT_COOLDOWN_MS) return;
  alerts.unshift({
    id: `fe_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    vessel_mmsi: mmsi, vessel_name: name,
    alert_type: type, message, priority,
    lat, lon, timestamp: new Date().toISOString(),
    acknowledged: false,
  });
  if (alerts.length > 1000) alerts.splice(1000);
  // Refresh alert UI immediately
  updateKPIs(); updateDashAlerts();
  if (currentPage === 'alerts') renderAlertsGrid();
}

// Point-in-polygon using ray casting — works with INDIA_BOUNDARY_MAIN and ANDAMAN
function _pointInPoly(lat, lon, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) &&
      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function _inIndiaEEZ(lat, lon) {
  return _pointInPoly(lat, lon, INDIA_BOUNDARY_MAIN) ||
         _pointInPoly(lat, lon, INDIA_BOUNDARY_ANDAMAN);
}

const HIGH_SPEED_KNOTS = 25;

// Friendly flags — vessels from these nations are not unfriendly
const FRIENDLY_FLAGS = new Set([
  'India','USA','UK','France','Australia','Japan','South Korea',
  'New Zealand','Canada','Germany','Italy','Norway','Netherlands',
  'Denmark','Sweden','Finland','Portugal','Spain','Greece',
]);

function _isUnfriendly(vessel) {
  const flag = (vessel.flag || '').trim();
  // Unknown flag = not unfriendly (can't confirm hostile)
  if (!flag || flag === 'Unknown') return false;
  return !FRIENDLY_FLAGS.has(flag);
}

const _prevVesselStates = {};

function evaluateAlerts(vessel) {
  const mmsi = vessel.mmsi;
  const name = vessel.name || mmsi;
  const lat = vessel.lat, lon = vessel.lon;
  const speed = vessel.speed || 0;
  const prev = _prevVesselStates[mmsi];

  const inEEZ  = _inIndiaEEZ(lat, lon);
  const wasInEEZ = prev ? _inIndiaEEZ(prev.lat, prev.lon) : false;
  // Fire on entry OR on first-ever sighting inside EEZ (no prev)
  const isEnteringOrNew = inEEZ && (!prev || !wasInEEZ);

  // Rule 1 — High speed OUTSIDE boundary → LOW
  if (!inEEZ && speed >= HIGH_SPEED_KNOTS && _cooldownOk(mmsi, 'highspeed_outside')) {
    _pushAlert(mmsi, name, 'high_speed_outside',
      `${name} at ${speed.toFixed(1)} kn outside Indian maritime boundary`,
      'low', lat, lon);
  }

  // Rules 2 & 3 — Unfriendly vessel in/entering boundary
  if (isEnteringOrNew && _isUnfriendly(vessel) && _cooldownOk(mmsi, 'unfriendly_entry')) {
    if (speed >= HIGH_SPEED_KNOTS) {
      _pushAlert(mmsi, name, 'unfriendly_entry_highspeed',
        `${name} (${vessel.flag}) entering Indian boundary at ${speed.toFixed(1)} kn`,
        'critical', lat, lon);
    } else {
      _pushAlert(mmsi, name, 'unfriendly_entry',
        `${name} (${vessel.flag}) entering Indian maritime boundary`,
        'high', lat, lon);
    }
  }

  // Rule 4 — Any vessel (including friendly) entering a piracy zone → HIGH
  const inPiracy = _inPiracyZone(lat, lon);
  const wasInPiracy = prev ? _inPiracyZone(prev.lat, prev.lon) : false;
  if (inPiracy && !wasInPiracy && _cooldownOk(mmsi, 'piracy_zone')) {
    const zoneName = PIRACY_ZONE_BOUNDS.find(z =>
      lat >= z.latMin && lat <= z.latMax && lon >= z.lonMin && lon <= z.lonMax
    )?.name || 'Piracy Zone';
    _pushAlert(mmsi, name, 'piracy_zone_entry',
      `${name} entered ${zoneName}`,
      'high', lat, lon);
  }

  _prevVesselStates[mmsi] = { lat, lon, speed, flag: vessel.flag };
}

// Check if a point is inside any piracy zone
function _inPiracyZone(lat, lon) {
  return PIRACY_ZONE_BOUNDS.some(z =>
    lat >= z.latMin && lat <= z.latMax &&
    lon >= z.lonMin && lon <= z.lonMax
  );
}


function updateMiniDots() {
  if (!miniMap) return;
  if (!_miniCanvas) {
    _miniCanvas = document.createElement('canvas');
    _miniCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:400;';
    // Attach to mapPane — never CSS-transformed by Leaflet during zoom
    miniMap.getPane('mapPane').appendChild(_miniCanvas);
    miniMap.on('moveend zoomend viewreset resize', updateMiniDots);
  }

  const s = miniMap.getSize();
  _miniCanvas.width  = s.x;
  _miniCanvas.height = s.y;

  // Counteract any CSS transform on the pane by resetting top/left to pixel origin
  const origin = miniMap.getPixelOrigin();
  const mapPanePos = miniMap._getMapPanePos();
  _miniCanvas.style.left = (mapPanePos.x < 0 ? -mapPanePos.x : 0) + 'px';
  _miniCanvas.style.top  = (mapPanePos.y < 0 ? -mapPanePos.y : 0) + 'px';

  const ctx = _miniCanvas.getContext('2d');
  ctx.clearRect(0, 0, s.x, s.y);
  ctx.globalAlpha = 0.85;
  for (const v of Object.values(vessels)) {
    try {
      const p = miniMap.latLngToContainerPoint([v.lat, v.lon]);
      if (p.x < 0 || p.y < 0 || p.x > s.x || p.y > s.y) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = vesselColor(v);
      ctx.fill();
    } catch {}
  }
  ctx.globalAlpha = 1;
}

function throttledUIUpdate() {
  if (_uiTimer) return;
  _uiTimer = setTimeout(() => {
    _uiTimer = null;
    updateKPIs(); updateDashVessels(); updateDashAlerts();
    setText('st-count', Object.keys(vessels).length);
    setText('st-update', new Date().toLocaleTimeString());
    updateViewportCount();
    const now = new Date().toLocaleTimeString();
    if (timelineData.labels[timelineData.labels.length-1] !== now) {
      timelineData.labels.push(now); timelineData.counts.push(Object.keys(vessels).length);
      if (timelineData.labels.length > 30) { timelineData.labels.shift(); timelineData.counts.shift(); }
    }
    if (currentPage==='vessels') renderVesselsTable();
    if (currentPage==='analytics') updateCharts();
    if (currentPage==='alerts') renderAlertsGrid();
  }, 1000);
}

function parseAIS(msg) {
  try {
    const meta=msg.MetaData||{}, pos=(msg.Message||{}).PositionReport||{};
    const mmsi=String(meta.MMSI||'').trim(); if (!mmsi) return null;
    const lat=parseFloat(pos.Latitude||0), lon=parseFloat(pos.Longitude||0);
    if (!lat&&!lon) return null;
    return { mmsi, lat, lon, name:(meta.ShipName||'Unknown').trim()||'Unknown',
      speed:parseFloat(pos.Sog||0), heading:parseFloat(pos.TrueHeading||pos.Cog||0),
      course:parseFloat(pos.Cog||0), vessel_type:shipTypeLabel(parseInt(pos.ShipType||0)),
      flag:mmsiToFlag(mmsi), status:navStatus(parseInt(pos.NavigationalStatus||0)),
      timestamp:new Date().toISOString(), trail:[] };
  } catch { return null; }
}
function shipTypeLabel(c) {
  if(c===35)return'Naval Vessel'; if(c>=20&&c<=29)return'Wing In Ground';
  if(c>=30&&c<=39)return'Fishing Vessel'; if(c>=40&&c<=49)return'High Speed Craft';
  if(c>=50&&c<=59)return'Special Craft'; if(c>=60&&c<=69)return'Passenger Ship';
  if(c>=70&&c<=79)return'Cargo Ship'; if(c>=80&&c<=89)return'Tanker'; return'Unknown';
}
function mmsiToFlag(m) {
  const map={'419':'India','338':'USA','235':'UK','477':'China','525':'Indonesia','548':'Philippines',
    '431':'Japan','228':'France','211':'Germany','636':'Liberia','255':'Portugal','351':'Panama',
    '370':'Panama','412':'China','416':'Taiwan','440':'South Korea','503':'Australia','512':'New Zealand',
    '247':'Italy','265':'Sweden','230':'Finland','219':'Denmark','257':'Norway','244':'Netherlands'};
  for(const[mid,flag]of Object.entries(map))if(m.startsWith(mid))return flag; return'Unknown';
}
function navStatus(n){return['Underway','At Anchor','Not Under Command','Restricted','Constrained','Moored','Aground','Fishing','Sailing'][n]||'Unknown';}
function vesselClass(v){
  const t=(v.vessel_type||'').toLowerCase();
  if(t.includes('naval'))return'naval';
  if(t.includes('coast guard'))return'naval';
  if(t.includes('tanker'))return'tanker';
  if(t.includes('cargo')||t.includes('container'))return'cargo';
  if(t.includes('passenger'))return'passenger';
  if(t.includes('fishing'))return'fishing';
  if(t.includes('research'))return'research';
  if(t.includes('high speed'))return'highspeed';
  if(t.includes('special'))return'special';
  if(isCriticalVessel(v))return'suspicious';
  return'unknown';
}
function setConnStatus(state){
  const dot=document.querySelector('.dot'),lbl=document.getElementById('conn-label'),ws=document.getElementById('st-ws');
  if(!dot||!lbl)return; dot.className='dot';
  if(state==='live')     { dot.classList.add('dot-live');       lbl.textContent='Live';     if(ws){ws.textContent='Connected'; ws.className='badge-status green';} }
  else if(state==='polling') { dot.classList.add('dot-live');   lbl.textContent='Polling';  if(ws){ws.textContent='REST Poll'; ws.className='badge-status yellow';} }
  else if(state==='connecting') { dot.classList.add('dot-connecting'); lbl.textContent='Connecting…'; if(ws){ws.textContent='Connecting…'; ws.className='badge-status yellow';} }
  else { dot.classList.add('dot-error'); lbl.textContent='Reconnecting'; if(ws){ws.textContent='Offline'; ws.className='badge-status red';} }
}

// ── UI ────────────────────────────────────────────────────────────────────────
function updateKPIs(){
  const vl=Object.values(vessels);
  const fr=vl.filter(v=>FRIENDLY_FLAGS.has(v.flag||'')).length;
  // Suspicious = unfriendly/unknown vessels inside EEZ OR within ~100km (~0.9°) of boundary
  const NEAR_DEG = 0.9;
  const su=vl.filter(v=>{
    if(FRIENDLY_FLAGS.has(v.flag||'')) return false;
    // inside EEZ
    if(_inIndiaEEZ(v.lat,v.lon)) return true;
    // within 100km buffer — check expanded bounding box first for speed
    const inBuf = v.lat>=(2-NEAR_DEG)&&v.lat<=(24+NEAR_DEG)&&v.lon>=(62-NEAR_DEG)&&v.lon<=(97+NEAR_DEG);
    return inBuf;
  }).length;
  const ac=alerts.filter(a=>!a.acknowledged).length;
  setText('kpi-total',vl.length);setText('kpi-friendly',fr);setText('kpi-suspicious',su);
  setText('kpi-alerts',ac);setText('hdr-vessels',vl.length);setText('hdr-alerts',ac);
  setText('nav-alert-badge',ac);setText('map-vessel-count',vl.length);
}
function setText(id,val){const e=document.getElementById(id);if(e)e.textContent=val;}
function updateDashAlerts(){
  const el=document.getElementById('dash-alerts'); if(!el)return;
  if(!alerts.length){el.innerHTML='<div class="list-item"><div class="list-item-title">No alerts</div></div>';return;}
  el.innerHTML=alerts.slice(0,8).map(a=>`<div class="list-item ${a.priority}"><div class="list-item-title">${escHtml(a.message)}</div><div class="list-item-sub">${(a.alert_type||'').replace(/_/g,' ')} · ${fmtTime(a.timestamp)}</div></div>`).join('');
}
function updateDashVessels(){
  const el=document.getElementById('dash-vessels'); if(!el)return;
  const top=Object.values(vessels).slice(0,8);
  if(!top.length){el.innerHTML='<div class="list-item"><div class="list-item-title">Waiting for AIS data…</div></div>';return;}
  el.innerHTML=top.map(v=>`<div class="list-item" onclick="focusVessel('${v.mmsi}')"><div class="list-item-title">${escHtml(v.name||v.mmsi)}</div><div class="list-item-sub">${v.vessel_type} · ${(v.speed||0).toFixed(1)} kn · ${v.flag}</div></div>`).join('');
}

// ── Vessels Table ─────────────────────────────────────────────────────────────
let _vf='',_tf='';
function filterVessels(){_vf=(document.getElementById('vessel-search')?.value||'').toLowerCase();_tf=document.getElementById('vessel-type-filter')?.value||'';renderVesselsTable();}
function renderVesselsTable(){
  const tbody=document.getElementById('vessels-tbody'); if(!tbody)return;
  let list=Object.values(vessels);
  if(_vf)list=list.filter(v=>(v.name||'').toLowerCase().includes(_vf)||v.mmsi.includes(_vf)||(v.flag||'').toLowerCase().includes(_vf));
  if(_tf)list=list.filter(v=>v.vessel_type===_tf);
  if(!list.length){tbody.innerHTML='<tr><td colspan="10" style="text-align:center;color:var(--text-muted)">No vessels found</td></tr>';return;}
  tbody.innerHTML=list.slice(0,500).map(v=>`<tr><td>${v.mmsi}</td><td>${escHtml(v.name||'—')}</td><td><span class="type-badge ${vesselClass(v)}">${v.vessel_type||'Unknown'}</span></td><td>${v.flag||'—'}</td><td>${(v.lat||0).toFixed(4)}</td><td>${(v.lon||0).toFixed(4)}</td><td>${(v.speed||0).toFixed(1)}</td><td>${(v.heading||0).toFixed(0)}°</td><td>${fmtTime(v.timestamp)}</td><td><button class="btn btn-icon" onclick="focusVessel('${v.mmsi}')"><i class="fas fa-crosshairs"></i></button><button class="btn btn-icon" style="color:var(--red)" onclick="removeVessel('${v.mmsi}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}

// ── Alerts ────────────────────────────────────────────────────────────────────
let _af='';
function filterAlerts(){_af=document.getElementById('alert-filter')?.value||'';renderAlertsGrid();}
function renderAlertsGrid(){
  const el=document.getElementById('alerts-grid'); if(!el)return;
  let list=alerts; if(_af)list=list.filter(a=>a.priority===_af);
  if(!list.length){el.innerHTML='<div class="alert-card"><div class="alert-msg">No alerts yet</div></div>';return;}
  el.innerHTML=list.map(a=>`<div class="alert-card ${a.priority} ${a.acknowledged?'acknowledged':''}"><div class="alert-type">${(a.alert_type||'').replace(/_/g,' ')}</div><div class="alert-msg">${escHtml(a.message)}</div><div class="alert-meta"><span class="priority-pill ${a.priority}">${a.priority}</span><span>${fmtTime(a.timestamp)}</span></div>${!a.acknowledged?`<div class="alert-actions"><button class="btn btn-secondary" style="font-size:11px;padding:4px 10px" onclick="ackAlert('${a.id}')"><i class="fas fa-check"></i> Ack</button>${a.lat?`<button class="btn btn-icon" onclick="focusLatLon(${a.lat},${a.lon})"><i class="fas fa-map-pin"></i></button>`:''}</div>`:''}</div>`).join('');
}
function ackAlert(id){const a=alerts.find(x=>x.id===id);if(a){a.acknowledged=true;renderAlertsGrid();updateKPIs();}}
function clearAcknowledged(){alerts.splice(0,alerts.length,...alerts.filter(a=>!a.acknowledged));renderAlertsGrid();}

// ── Vessel Detail + Wikipedia ─────────────────────────────────────────────────
function showVesselDetail(mmsi){
  const v=vessels[mmsi]; if(!v)return;
  const panel=document.getElementById('vessel-detail'), content=document.getElementById('vessel-detail-content');
  content.innerHTML=`<div class="detail-title"><i class="fas fa-ship"></i> ${escHtml(v.name||v.mmsi)}</div>${dr('MMSI',v.mmsi)}${dr('Type',v.vessel_type)}${dr('Flag',v.flag)}${dr('Speed',(v.speed||0).toFixed(1)+' kn')}${dr('Heading',(v.heading||0).toFixed(0)+'°')}${dr('Status',v.status||'—')}${dr('Position',(v.lat||0).toFixed(4)+', '+(v.lon||0).toFixed(4))}${dr('Updated',fmtTime(v.timestamp))}<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)"><div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:8px"><i class="fab fa-wikipedia-w"></i> Wikipedia</div><div id="wiki-content"><i class="fas fa-spinner fa-spin" style="color:var(--text-muted)"></i> Loading…</div></div>`;
  panel.style.display='block';
  fetchWiki(v.name||v.mmsi);
}
function dr(label,val){return`<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-val">${escHtml(String(val||'—'))}</span></div>`;}
async function fetchWiki(name){
  const el=document.getElementById('wiki-content'); if(!el)return;
  // Strip common vessel prefixes so we search the actual ship name
  const q=name.replace(/^(R\/V|INS|MV|MT|MS|SS|HMS|USS|USNS|HMAS|FS|KRI|BRP|JS|ICGS|CGS|FV|BAP|HMNZS|PLAN)\s+/i,'').trim();
  if(!q||q==='Unknown'||/^\d+$/.test(q)||/^FILE_/.test(q)){
    el.innerHTML='<div style="font-size:11px;color:var(--text-muted)">No Wikipedia article available.</div>';
    return;
  }
  el.innerHTML='<i class="fas fa-spinner fa-spin" style="color:var(--text-muted)"></i> Loading…';
  try{
    // Use action API with origin=* — works from any origin including localhost
    const url=`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=300&redirects=1&format=json&origin=*`;
    const r=await fetch(url);
    if(!r.ok) throw new Error('fetch failed');
    const d=await r.json();
    const pages=d.query?.pages||{};
    const page=Object.values(pages)[0];
    if(!page||page.missing!==undefined||!page.extract){
      // Try searching for the vessel name
      const sr=await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q+' ship')}&srlimit=1&format=json&origin=*`);
      const sd=await sr.json();
      const hit=sd.query?.search?.[0];
      if(!hit) throw new Error('not found');
      const pr=await fetch(`https://en.wikipedia.org/w/api.php?action=query&pageids=${hit.pageid}&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=300&format=json&origin=*`);
      const pd=await pr.json();
      const fp=Object.values(pd.query?.pages||{})[0];
      if(!fp||!fp.extract) throw new Error('not found');
      renderWiki(el, fp, q);
    } else {
      renderWiki(el, page, q);
    }
  }catch{
    el.innerHTML=`<div style="font-size:11px;color:var(--text-muted)">No Wikipedia article found for "<em>${escHtml(q)}</em>".</div>`;
  }
}
function renderWiki(el, page, q){
  const thumb=page.thumbnail?.source;
  const extract=(page.extract||'').slice(0,320);
  const wikiUrl=`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title||q)}`;
  el.innerHTML=`
    ${thumb?`<img src="${thumb}" style="width:100%;border-radius:6px;margin-bottom:8px;max-height:130px;object-fit:cover" onerror="this.remove()">`:''}
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px">${escHtml(page.title||q)}</div>
    <div style="font-size:11px;color:var(--text-muted);line-height:1.6">${escHtml(extract)}${(page.extract||'').length>320?'…':''}</div>
    <a href="${wikiUrl}" target="_blank" rel="noopener" style="font-size:11px;color:var(--accent);margin-top:8px;display:inline-block">
      <i class="fas fa-external-link-alt"></i> Read on Wikipedia</a>`;
}
function closeVesselDetail(){document.getElementById('vessel-detail').style.display='none';}
function focusVessel(mmsi){const v=vessels[mmsi];if(!v)return;navigate('map');setTimeout(()=>{mainMap?.setView([v.lat,v.lon],10,{animate:true});showVesselDetail(mmsi);},100);}
function focusLatLon(lat,lon){navigate('map');setTimeout(()=>mainMap?.setView([lat,lon],8,{animate:true}),100);}
function removeVessel(mmsi){if(!confirm(`Remove ${vessels[mmsi]?.name||mmsi}?`))return;delete vessels[mmsi];scheduleRedraw();updateKPIs();renderVesselsTable();}

// ── Manual Add Vessel ─────────────────────────────────────────────────────────
function addManualVessel(e){
  e.preventDefault(); const f=e.target;
  const v={mmsi:f.mmsi.value.trim()||`MANUAL_${Date.now()}`,name:f.vname.value.trim()||'Unknown',
    lat:parseFloat(f.lat.value),lon:parseFloat(f.lon.value),speed:parseFloat(f.speed.value)||0,
    heading:parseFloat(f.heading.value)||0,course:parseFloat(f.heading.value)||0,
    vessel_type:f.vtype.value,flag:f.flag.value.trim()||'Unknown',timestamp:new Date().toISOString(),trail:[]};
  if(isNaN(v.lat)||isNaN(v.lon))return showToast('Valid lat/lon required','warning');
  vessels[v.mmsi]=v; scheduleRedraw(); updateKPIs(); f.reset();
  showToast(`${v.name} added to map`,'success'); navigate('vessels');
}

// ── File Upload + Zone Parsing ────────────────────────────────────────────────
function handleFileDrop(e){e.preventDefault();document.getElementById('upload-drop').classList.remove('drag-over');processFiles(e.dataTransfer.files);}
function handleFileSelect(e){processFiles(e.target.files);}

async function processFiles(files){
  const results=document.getElementById('upload-results');
  for(const file of files){
    const ext=file.name.split('.').pop().toLowerCase();
    let text='';
    try{
      if(['txt','md','csv','json'].includes(ext)) text=await file.text();
      else if(ext==='docx'&&window.mammoth){const r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});text=r.value;}
      else if(ext==='xlsx'&&window.XLSX){const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});text=XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);}
      else{addUploadResult(results,file.name,'Unsupported format','warn');continue;}

      const result = parseFileContent(text, file.name);
      result.vessels.forEach(v => { vessels[v.mmsi] = v; evaluateAlerts(v); });
      scheduleRedraw(); updateKPIs();
      addUploadResult(results,file.name,
        `${result.vessels.length} vessels, ${result.zones.patrol} patrol zones, ${result.zones.exercise} exercise areas, ${result.zones.checkpoints} checkpoints, ${result.zones.piracy} piracy zones extracted`,'ok');
    }catch(err){addUploadResult(results,file.name,`Error: ${err.message}`,'err');}
  }
}

function parseFileContent(text, source) {
  const result = { vessels:[], zones:{ patrol:0, exercise:0, checkpoints:0, piracy:0 } };

  // ── Extract all JSON blocks from markdown (```json ... ```) ──────────────
  const jsonBlocks = [];
  const mdJsonRe = /```json\s*([\s\S]*?)```/g;
  let m;
  while ((m = mdJsonRe.exec(text)) !== null) {
    try { jsonBlocks.push(JSON.parse(m[1].trim())); } catch {}
  }

  // Also try parsing the whole text as JSON
  if (!jsonBlocks.length) {
    try {
      const j = JSON.parse(text);
      jsonBlocks.push(...(Array.isArray(j) ? j : [j]));
    } catch {}
  }

  // Process each JSON object
  jsonBlocks.forEach((item, i) => {
    if (!item) return;
    const coords = item.coordinates?.map(c => [
      parseFloat(c.lat ?? c[0]), parseFloat(c.lon ?? c[1])
    ]).filter(c => !isNaN(c[0]) && !isNaN(c[1]));

    const name = item.name || item.tooltip || `Zone ${i+1}`;
    const type = (item.type || '').toLowerCase();
    const nameLower = name.toLowerCase();

    // Vessel entry
    if (item.mmsi) {
      const lat = parseFloat(item.lat||0), lon = parseFloat(item.lon||0);
      if (lat || lon) {
        result.vessels.push({ mmsi:String(item.mmsi), name:item.name||'Unknown', lat, lon,
          speed:parseFloat(item.speed||0), heading:parseFloat(item.heading||0), course:0,
          vessel_type:item.vessel_type||'Unknown', flag:item.flag||'Unknown',
          timestamp:new Date().toISOString(), trail:[] });
      }
      return;
    }

    if (!coords || coords.length < 3) return;

    // Classify zone by type field or name keywords
    const isPatrol   = type.includes('patrol') || type.includes('reconnaissance') || type.includes('surveillance') || nameLower.includes('patrol') || nameLower.includes('surveillance') || nameLower.includes('reconnaissance');
    const isExercise = type.includes('exercise') || type.includes('training') || type.includes('asw') || type.includes('amphibious') || type.includes('air defense') || nameLower.includes('exercise') || nameLower.includes('training') || nameLower.includes('asw') || nameLower.includes('amphibious') || nameLower.includes('air defense');
    const isPiracy   = nameLower.includes('piracy') || nameLower.includes('aden') || nameLower.includes('malacca') || nameLower.includes('somalia');

    if (isPiracy) {
      addPiracyZone([[coords[0][0],coords[0][1]],[coords[2][0],coords[2][1]]], name);
      result.zones.piracy++;
    } else if (isPatrol) {
      addPatrolZone(coords, name);
      result.zones.patrol++;
    } else if (isExercise) {
      addExerciseZone(coords, name);
      result.zones.exercise++;
    } else {
      // Default: treat as exercise zone
      addExerciseZone(coords, name);
      result.zones.exercise++;
    }
  });

  // ── Key-value text format: "Vessel Type: ...\nPosition: ..." blocks ──────────
  if (!result.vessels.length && (text.includes('Vessel Type:') || text.includes('Reporting Unit:'))) {
    const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Split on blank lines OR on --- separators
    const records = normalised.split(/\n\s*(?:---+)\s*\n|\n\s*\n+/);

    records.forEach((block, i) => {
      if (!block.trim()) return;
      const get = (key) => {
        const rx = new RegExp('^' + key + ':\\s*(.+)', 'im');
        const m = block.match(rx);
        return m ? m[1].trim() : '';
      };
      const posStr = get('Position');
      const posMatch = posStr.match(/([\d]+)[°']?\s*([\d]*)[°']?\s*([NS])[,\s]+([\d]+)[°']?\s*([\d]*)[°']?\s*([EW])/i);
      if (!posMatch) return;
      const latDeg = parseFloat(posMatch[1]), latMin = parseFloat(posMatch[2] || '0');
      const lonDeg = parseFloat(posMatch[4]), lonMin = parseFloat(posMatch[5] || '0');
      let lat = latDeg + latMin / 60;
      let lon = lonDeg + lonMin / 60;
      if (posMatch[3].toUpperCase() === 'S') lat = -lat;
      if (posMatch[6].toUpperCase() === 'W') lon = -lon;

      const vesselType = get('Vessel Type') || 'Unknown';
      const rawName = get('Observed Vessel') || get('Reporting Unit') || `Vessel_${i}`;
      const speed = parseFloat(get('Speed')) || 0;
      const heading = parseFloat(get('Heading')) || 0;
      const imo = get('IMO') || get('Pennant') || '';

      // Determine flag: Registry field, or infer from name, or from Identification field
      let flag = get('Registry') || _inferFlag(rawName);
      if (!flag || flag === 'Unknown') {
        const ident = get('Identification').toLowerCase();
        // "Unfriendly" with no known flag → assign a non-friendly placeholder so alerts fire
        if (ident.includes('unfriendly')) flag = 'Unfriendly';
        else if (ident.includes('friendly')) flag = 'India'; // treat as friendly
      }

      const mmsi = imo ? `FILE_${imo.replace(/\s+/g,'')}` : `FILE_${rawName.replace(/\W+/g,'_')}_${i}`;
      const status = get('Status') || get('Remarks') || '';

      result.vessels.push({
        mmsi, name: rawName, lat, lon, speed, heading, course: heading,
        vessel_type: vesselType, flag, status,
        timestamp: new Date().toISOString(), trail: []
      });
    });
  }

  // ── CSV fallback ──────────────────────────────────────────────────────────
  if (!result.vessels.length && !jsonBlocks.length) {
    const lines = text.replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const cols = lines[0].split(/[,\t]/);
      const idx = names => cols.findIndex(c => names.some(n => c.toLowerCase().includes(n)));
      const iLat=idx(['lat']),iLon=idx(['lon']),iName=idx(['name','vessel']),iMmsi=idx(['mmsi']),
            iSpeed=idx(['speed']),iHead=idx(['head','course']),iType=idx(['type']),iFlag=idx(['flag']);
      lines.slice(1).forEach((line,i) => {
        const p = line.split(/[,\t]/);
        const lat=parseFloat(p[iLat]),lon=parseFloat(p[iLon]);
        if (!isNaN(lat)&&!isNaN(lon))
          result.vessels.push({mmsi:p[iMmsi]?.trim()||`FILE_${Date.now()}_${i}`,name:p[iName]?.trim()||'Unknown',
            lat,lon,speed:parseFloat(p[iSpeed])||0,heading:parseFloat(p[iHead])||0,course:0,
            vessel_type:p[iType]?.trim()||'Unknown',flag:p[iFlag]?.trim()||'Unknown',
            timestamp:new Date().toISOString(),trail:[]});
      });
    }
  }

  return result;
}

function _inferFlag(name) {
  if (/\(NO\)/i.test(name) || /Haakon|Kronprins/i.test(name)) return 'Norway';
  if (/\(AU\)/i.test(name)) return 'Australia';
  if (/\(KR\)/i.test(name) || /Araon\b/i.test(name)) return 'South Korea';
  if (/\(RU\)/i.test(name) || /Akademik|Yuzhmorgeologiya/i.test(name)) return 'Russia';
  if (/\(ZA\)/i.test(name) || /Agulhas/i.test(name)) return 'South Africa';
  if (/\(ES\)/i.test(name) || /Hesperides/i.test(name)) return 'Spain';
  if (/\(DE\)/i.test(name) || /\bSonne\b/i.test(name)) return 'Germany';
  if (/\(CN\)/i.test(name) || /Xue Long/i.test(name)) return 'China';
  if (/\(FR\)/i.test(name) || /Astrolabe|Marion Dufresne|Ile Amsterdam/i.test(name)) return 'France';
  if (/\(IN\)/i.test(name) || /\bINS\b/i.test(name)) return 'India';
  if (/\(UK\)/i.test(name) || /\bHMS\b|\bRRS\b|Tristan|Gough/i.test(name)) return 'UK';
  if (/\bUSS\b|\bUSNS\b|Okeanos|Falkor|Laurence/i.test(name)) return 'USA';
  if (/HMNZS/i.test(name)) return 'New Zealand';
  if (/\bPLAN\b/i.test(name)) return 'China';
  if (/\bBAP\b/i.test(name)) return 'Peru';
  return 'Unknown';
}

function addUploadResult(container,name,msg,type){
  const colors={ok:'var(--green)',warn:'var(--yellow)',err:'var(--red)'};
  const icons={ok:'fa-check-circle',warn:'fa-triangle-exclamation',err:'fa-circle-xmark'};
  const el=document.createElement('div');
  el.style.cssText=`padding:8px 12px;border-radius:7px;background:rgba(0,0,0,0.2);border-left:3px solid ${colors[type]};font-size:12px`;
  el.innerHTML=`<i class="fas ${icons[type]}" style="color:${colors[type]};margin-right:6px"></i><strong>${escHtml(name)}</strong> — ${escHtml(msg)}`;
  container.appendChild(el);
}

// ── Charts ────────────────────────────────────────────────────────────────────
function initCharts(){
  Chart.defaults.color='#e8f4f8'; const grid='rgba(0,180,216,0.1)';
  charts.types=new Chart(document.getElementById('chart-types'),{type:'doughnut',data:{labels:[],datasets:[{data:[],backgroundColor:['#4895ef','#00b4d8','#ffd60a','#ef476f','#06d6a0','#adb5bd']}]},options:{plugins:{legend:{position:'right'}},responsive:true,maintainAspectRatio:false}});
  charts.speed=new Chart(document.getElementById('chart-speed'),{type:'bar',data:{labels:['0-5','5-10','10-15','15-20','20-25','25+'],datasets:[{label:'Vessels',data:[],backgroundColor:'#00b4d8'}]},options:{plugins:{legend:{display:false}},scales:{y:{grid:{color:grid}},x:{grid:{color:grid}}},responsive:true,maintainAspectRatio:false}});
  charts.timeline=new Chart(document.getElementById('chart-timeline'),{type:'line',data:{labels:[],datasets:[{label:'Vessels',data:[],borderColor:'#00b4d8',backgroundColor:'rgba(0,180,216,0.1)',fill:true,tension:0.4}]},options:{plugins:{legend:{display:false}},scales:{y:{grid:{color:grid}},x:{grid:{color:grid}}},responsive:true,maintainAspectRatio:false}});
  charts.flags=new Chart(document.getElementById('chart-flags'),{type:'bar',data:{labels:[],datasets:[{label:'Vessels',data:[],backgroundColor:'#4895ef'}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{y:{grid:{color:grid}},x:{grid:{color:grid}}},responsive:true,maintainAspectRatio:false}});
}
function updateCharts(){
  const vl=Object.values(vessels); if(!vl.length)return;
  const tc={};vl.forEach(v=>{tc[v.vessel_type||'Unknown']=(tc[v.vessel_type||'Unknown']||0)+1;});
  charts.types.data.labels=Object.keys(tc);charts.types.data.datasets[0].data=Object.values(tc);charts.types.update('none');
  const bins=[0,0,0,0,0,0];vl.forEach(v=>{const s=v.speed||0;if(s<5)bins[0]++;else if(s<10)bins[1]++;else if(s<15)bins[2]++;else if(s<20)bins[3]++;else if(s<25)bins[4]++;else bins[5]++;});
  charts.speed.data.datasets[0].data=bins;charts.speed.update('none');
  charts.timeline.data.labels=timelineData.labels;charts.timeline.data.datasets[0].data=timelineData.counts;charts.timeline.update('none');
  const fc={};vl.forEach(v=>{const f=v.flag||'Unknown';fc[f]=(fc[f]||0)+1;});
  const sorted=Object.entries(fc).sort((a,b)=>b[1]-a[1]).slice(0,8);
  charts.flags.data.labels=sorted.map(x=>x[0]);charts.flags.data.datasets[0].data=sorted.map(x=>x[1]);charts.flags.update('none');
}

// ── Theme / Settings ──────────────────────────────────────────────────────────
function toggleTheme(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('theme',t);CFG.theme=t;const s=document.getElementById('cfg-theme');if(s)s.value=t;}
function applyTheme(t){setTheme(t);}
function applySettings(){
  CFG.trailLength=parseInt(document.getElementById('cfg-trail')?.value||'8');
  localStorage.setItem('trailLength',CFG.trailLength);
  showToast('Settings saved','success');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showToast(msg,type='info'){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div'); t.className=`toast ${type}`;
  const icons={critical:'fa-circle-exclamation',high:'fa-triangle-exclamation',warning:'fa-triangle-exclamation',error:'fa-circle-xmark',success:'fa-circle-check',info:'fa-circle-info'};
  t.innerHTML=`<i class="fas ${icons[type]||'fa-circle-info'}"></i> ${escHtml(msg)}`;
  c.appendChild(t); setTimeout(()=>t.remove(),4200);
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtTime(ts){try{return new Date(ts).toLocaleTimeString();}catch{return'—';}}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
if(sessionStorage.getItem('nv_user')){
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initApp();
}

window.login=login;window.logout=logout;window.navigate=navigate;
window.toggleSidebar=toggleSidebar;window.toggleTheme=toggleTheme;window.setTheme=setTheme;
window.toggleLayer=toggleLayer;window.toggleMapPanel=toggleMapPanel;window.changeTiles=changeTiles;
window.filterVessels=filterVessels;window.filterAlerts=filterAlerts;
window.ackAlert=ackAlert;window.clearAcknowledged=clearAcknowledged;
window.focusVessel=focusVessel;window.focusLatLon=focusLatLon;
window.closeVesselDetail=closeVesselDetail;window.removeVessel=removeVessel;
window.addManualVessel=addManualVessel;window.applySettings=applySettings;
window.handleFileDrop=handleFileDrop;window.handleFileSelect=handleFileSelect;
