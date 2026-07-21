/**
 * 3D Interactive Maritime, Weather & Defense Globe Module
 * Built using Three.js & Globe.gl
 * Features: 3D Earth, Cloud Layer, Orbiting Satellites, 3D Vessels, Raycast Targeting, and Telemetry HUD.
 */

class Maritime3DGlobe {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.globe = null;
    this.satellites = [];
    this.vessels = [];
    this.clouds = [];
    this.animTimer = null;
  }

  initialize() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    // Clear existing content
    this.container.innerHTML = '';

    // Initialize Globe.gl 3D Globe instance
    if (typeof Globe === 'undefined') {
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--yellow)">
          <i class="fas fa-satellite fa-spin" style="font-size:2rem;margin-bottom:12px"></i><br/>
          <strong>Loading 3D Earth Engine...</strong>
        </div>
      `;
      return;
    }

    this.globe = Globe()(this.container)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#00b4d8')
      .atmosphereAltitude(0.22)
      .width(this.container.clientWidth || 800)
      .height(540);

    // Auto-rotate Earth slowly
    this.globe.controls().autoRotate = true;
    this.globe.controls().autoRotateSpeed = 0.5;

    // Load initial 3D layers
    this.load3DVessels();
    this.load3DSatellites();
    this.load3DClouds();
    this.load3DCyclones();

    // Enable 3D Click-to-Target Raycaster
    this.globe.onGlobeClick(({ lat, lng }) => {
      this.on3DPointClick(lat, lng);
    });

    // Handle container resize
    window.addEventListener('resize', () => {
      if (this.globe && this.container) {
        this.globe.width(this.container.clientWidth).height(540);
      }
    });
  }

  /**
   * 3D Vessels Layer
   */
  load3DVessels() {
    const vesselList = Object.values(window.vessels || {});
    const pointsData = vesselList.map(v => ({
      lat: v.lat,
      lng: v.lon,
      size: v.vessel_type === 'Naval Vessel' ? 0.6 : 0.4,
      color: v.vessel_type === 'Naval Vessel' ? '#4895ef' : v.vessel_type === 'Tanker' ? '#ffd60a' : '#06d6a0',
      label: `${v.name || v.mmsi} (${v.vessel_type})`,
      vessel: v
    }));

    this.globe
      .pointsData(pointsData)
      .pointColor('color')
      .pointAltitude(0.02)
      .pointRadius(0.35)
      .pointLabel('label')
      .onPointClick(p => {
        if (p.vessel) {
          this.on3DPointClick(p.vessel.lat, p.vessel.lon);
        }
      });
  }

  /**
   * 3D Satellite Orbits
   */
  load3DSatellites() {
    const sats = [
      { name: 'ISS (Zarya)', lat: 25.0, lng: 70.0, alt: 0.25, color: '#ffd60a' },
      { name: 'Sentinel-2A', lat: 10.0, lng: 85.0, alt: 0.30, color: '#00e5ff' },
      { name: 'Landsat-9', lat: -5.0, lng: 75.0, alt: 0.28, color: '#06d6a0' },
      { name: 'GOES-16', lat: 15.0, lng: 60.0, alt: 0.35, color: '#ef476f' },
      { name: 'Terra (EOS AM-1)', lat: 30.0, lng: 95.0, alt: 0.32, color: '#b5179e' }
    ];

    this.globe
      .objectsData(sats)
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude('alt')
      .objectLabel('name');
  }

  /**
   * 3D Cloud Bands
   */
  load3DClouds() {
    const cloudRings = [
      { lat: 14.5, lng: 86.2, maxR: 12, color: '#ffffff', propagationSpeed: 2 },
      { lat: 10.2, lng: 65.4, maxR: 15, color: '#e2e8f0', propagationSpeed: 2.5 },
      { lat: 4.5, lng: 95.0, maxR: 18, color: '#cbd5e1', propagationSpeed: 1.8 }
    ];

    this.globe
      .ringsData(cloudRings)
      .ringColor('color')
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod(1200);
  }

  /**
   * 3D Cyclone Arc Vectors
   */
  load3DCyclones() {
    const stormArcs = [
      { startLat: 8.0, startLng: 92.0, endLat: 19.0, endLng: 85.0, color: ['#ef476f', '#ffd60a'] },
      { startLat: 12.0, startLng: 62.0, endLat: 22.0, endLng: 68.0, color: ['#ef476f', '#00b4d8'] }
    ];

    this.globe
      .arcsData(stormArcs)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .arcStroke(1.5);
  }

  /**
   * 3D Click-to-Target Raycaster Handler
   */
  async on3DPointClick(lat, lng) {
    // Focus camera smoothly on clicked lat/lng
    this.globe.pointOfView({ lat, lng, altitude: 1.8 }, 1200);

    // Call global inspect Earth Point function
    if (window.weatherMapInstance && window.weatherMapInstance.inspectEarthPoint) {
      window.weatherMapInstance.inspectEarthPoint(lat, lng);
    }
  }
}

// Global singleton
window.Maritime3DGlobe = Maritime3DGlobe;
