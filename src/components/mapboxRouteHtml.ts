import { MAPBOX_STYLES } from "../config/mapbox";
import type { MapThemeMode } from "./routeMapShared";

export interface MapboxRouteHtmlParams {
  accessToken: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number; addressFull?: string };
  facility?: { latitude: number; longitude: number; name?: string };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  mode: MapThemeMode;
  isSearching: boolean;
  driverLabel: string;
  driverBearing?: number | null;
}

/**
 * Plantilla Mapbox GL JS v2.15.0 para react-native-webview (portada de AnubisRide).
 * Expone la misma API JS que leafletHtml (setTileMode, updateDriverPosition, updateRoutePolyline)
 * más soporte para rotación del vehículo (bearing) y seguimiento de cámara.
 */
export function buildRouteMapboxHtml(params: MapboxRouteHtmlParams): string {
  const {
    accessToken,
    origin,
    destination,
    facility,
    routeCoordinates,
    mode,
    isSearching,
    driverLabel,
    driverBearing,
  } = params;

  const initialStyle =
    mode === "light" ? MAPBOX_STYLES.light : MAPBOX_STYLES.tactical;

  const initialRouteCoords =
    routeCoordinates && routeCoordinates.length >= 2
      ? routeCoordinates.map((c) => [c.longitude, c.latitude])
      : [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ];

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0B1320; }
    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
    .dest-pin {
      width: 18px; height: 18px; border-radius: 50%;
      background: #10B981; border: 3px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    }
    .facility-pin {
      width: 14px; height: 14px; border-radius: 4px;
      background: #6366F1; border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .driver-wrap {
      display: flex; flex-direction: column; align-items: center;
    }
    .driver-tag {
      background: rgba(15, 23, 42, 0.92); color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px; font-weight: 700; padding: 2px 7px;
      border-radius: 10px; margin-bottom: 4px; white-space: nowrap;
      border: 1px solid rgba(56, 189, 248, 0.45);
    }
    .driver-arrow {
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      transition: transform 0.35s ease-out;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = ${JSON.stringify(accessToken)};
    var STYLES = ${JSON.stringify(MAPBOX_STYLES)};
    var currentStyle = ${JSON.stringify(initialStyle)};
    var currentRoute = ${JSON.stringify(initialRouteCoords)};
    var currentDriver = {
      lat: ${origin.latitude},
      lng: ${origin.longitude},
      searching: ${JSON.stringify(isSearching)},
      label: ${JSON.stringify(driverLabel)},
      bearing: ${typeof driverBearing === "number" && Number.isFinite(driverBearing) ? Math.round(driverBearing) : "null"}
    };
    var destCoords = [${destination.longitude}, ${destination.latitude}];
    var facilityCoords = ${facility ? JSON.stringify([facility.longitude, facility.latitude]) : "null"};

    var map = new mapboxgl.Map({
      container: 'map',
      style: currentStyle,
      center: [${origin.longitude}, ${origin.latitude}],
      zoom: 14,
      attributionControl: false
    });

    var destEl = document.createElement('div');
    destEl.className = 'dest-pin';
    new mapboxgl.Marker({ element: destEl }).setLngLat(destCoords).addTo(map);

    if (facilityCoords) {
      var facEl = document.createElement('div');
      facEl.className = 'facility-pin';
      new mapboxgl.Marker({ element: facEl }).setLngLat(facilityCoords).addTo(map);
    }

    var driverWrap = document.createElement('div');
    driverWrap.className = 'driver-wrap';
    var driverTag = document.createElement('div');
    driverTag.className = 'driver-tag';
    driverTag.textContent = currentDriver.label;
    var driverArrow = document.createElement('div');
    driverArrow.className = 'driver-arrow';
    driverArrow.innerHTML =
      '<svg width="32" height="32" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="18" cy="18" r="16" fill="#0EA5E9" fill-opacity="0.22"/>' +
      '<circle cx="18" cy="18" r="11" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5"/>' +
      '<path d="M18 9 L23 22 L18 19 L13 22 Z" fill="#FFFFFF"/>' +
      '</svg>';
    driverWrap.appendChild(driverTag);
    driverWrap.appendChild(driverArrow);

    var driverMarker = new mapboxgl.Marker({ element: driverWrap, anchor: 'bottom' })
      .setLngLat([currentDriver.lng, currentDriver.lat])
      .addTo(map);

    function applyBearing(bearing) {
      if (typeof bearing === 'number' && isFinite(bearing)) {
        driverArrow.style.transform = 'rotate(' + Math.round(bearing) + 'deg)';
      }
    }
    applyBearing(currentDriver.bearing);

    function ensureRouteLayer() {
      var geojson = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: currentRoute }
      };
      if (map.getSource('active-route')) {
        map.getSource('active-route').setData(geojson);
        return;
      }
      map.addSource('active-route', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'active-route-casing',
        type: 'line',
        source: 'active-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#0369A1', 'line-width': 7, 'line-opacity': 0.45 }
      });
      map.addLayer({
        id: 'active-route-line',
        type: 'line',
        source: 'active-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#38BDF8', 'line-width': 4 }
      });
    }

    function fitRouteBounds() {
      var bounds = new mapboxgl.LngLatBounds();
      bounds.extend(destCoords);
      bounds.extend([currentDriver.lng, currentDriver.lat]);
      for (var i = 0; i < currentRoute.length; i++) {
        bounds.extend(currentRoute[i]);
      }
      map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 500 });
    }

    map.on('style.load', function() {
      ensureRouteLayer();
    });

    map.on('load', function() {
      ensureRouteLayer();
      fitRouteBounds();
    });

    window.setTileMode = function(mode) {
      var nextStyle = mode === 'light' ? STYLES.light : STYLES.tactical;
      if (nextStyle !== currentStyle) {
        currentStyle = nextStyle;
        map.setStyle(nextStyle);
      }
    };

    window.updateDriverPosition = function(lat, lng, searching, label, bearing) {
      currentDriver.lat = lat;
      currentDriver.lng = lng;
      currentDriver.searching = !!searching;
      if (label) {
        currentDriver.label = label;
        driverTag.textContent = label;
      }
      driverMarker.setLngLat([lng, lat]);
      applyBearing(bearing);
      if (map.loaded()) {
        map.easeTo({ center: [lng, lat], duration: 450 });
      }
    };

    window.updateRoutePolyline = function(latLngPairs) {
      if (!Array.isArray(latLngPairs) || latLngPairs.length < 2) return;
      currentRoute = latLngPairs.map(function(p) { return [p[1], p[0]]; });
      if (map.isStyleLoaded()) {
        ensureRouteLayer();
      }
    };
  </script>
</body>
</html>`;
}
