import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPBOX_ACCESS_TOKEN, USE_MAPBOX } from '../../config/mapbox';

export interface DriverMarker {
  id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  label?: string;
}

export interface StopMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  completed?: boolean;
  hasIncident?: boolean;
}

export interface MapViewCustomProps {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  drivers?: DriverMarker[];
  stops?: StopMarker[];
  /** Waypoints para calcular ruta por calles via Directions API */
  routeWaypoints?: { latitude: number; longitude: number }[];
  style?: object;
}

const MapViewCustom: React.FC<MapViewCustomProps> = ({
  center = { latitude: -0.2295, longitude: -78.5243 },
  zoom = 13,
  drivers = [],
  stops = [],
  routeWaypoints = [],
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  // HTML se construye UNA SOLA VEZ — nunca cambia
  const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body, #map { width:100vw; height:100vh; overflow:hidden; }
    .mk-sede { background:#fff; border:2.5px solid #3B82F6; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:17px; box-shadow:0 2px 6px rgba(0,0,0,.25); }
    .mk-stop { width:28px; height:28px; border-radius:50%; background:#6B7280; border:2px solid #fff; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:12px; box-shadow:0 2px 5px rgba(0,0,0,.2); }
    .mk-stop.done { background:#10B981; }
    .mk-stop.warn { background:#F59E0B; }
    .mk-driver { background:#1D4ED8; border:2.5px solid #fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:17px; box-shadow:0 2px 8px rgba(0,0,0,.3); }
    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display:none !important; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const TOKEN = '${MAPBOX_ACCESS_TOKEN}';
  mapboxgl.accessToken = TOKEN;

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [${center.longitude}, ${center.latitude}],
    zoom: ${zoom},
    attributionControl: false,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

  const driverMarkers = {};

  // ── Sede ──
  const sedeEl = document.createElement('div');
  sedeEl.className = 'mk-sede';
  sedeEl.textContent = '🏠';
  new mapboxgl.Marker({ element: sedeEl })
    .setLngLat([${center.longitude}, ${center.latitude}])
    .setPopup(new mapboxgl.Popup({ offset:25 }).setText('Sede Principal'))
    .addTo(map);

  // ── Ruta por calles via Directions API ──
  async function fetchRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) return;
    const coords = waypoints.map(p => p.longitude + ',' + p.latitude).join(';');
    const url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + coords +
      '?geometries=geojson&overview=full&access_token=' + TOKEN;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const geom = data.routes[0].geometry;
        if (map.getSource('route')) {
          map.getSource('route').setData({ type:'Feature', geometry: geom });
        }
      }
    } catch(e) {
      console.warn('Directions error', e);
    }
  }

  map.on('load', () => {
    // Source y layer de ruta
    map.addSource('route', {
      type: 'geojson',
      data: { type:'Feature', geometry: { type:'LineString', coordinates:[] } }
    });
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap':'round', 'line-join':'round' },
      paint: { 'line-color':'#3B82F6', 'line-width':4, 'line-opacity':0.9 }
    });

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'mapReady' }));
    }
  });

  // ── Mensajes desde React Native ──
  function handleMsg(event) {
    let msg;
    try { msg = JSON.parse(event.data); } catch(e) { return; }

    if (msg.type === 'setStops') {
      msg.stops.forEach(stop => {
        const el = document.createElement('div');
        el.className = 'mk-stop' + (stop.completed ? ' done' : '') + (stop.hasIncident ? ' warn' : '');
        el.textContent = stop.hasIncident ? '!' : stop.completed ? '✓' : stop.label;
        new mapboxgl.Marker({ element: el })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(new mapboxgl.Popup({ offset:25 }).setText('Parada ' + stop.label))
          .addTo(map);
      });
    }

    if (msg.type === 'setRoute') {
      fetchRoute(msg.waypoints);
    }

    if (msg.type === 'updateDriver') {
      const d = msg.driver;
      if (driverMarkers[d.id]) {
        driverMarkers[d.id].setLngLat([d.longitude, d.latitude]);
      } else {
        const el = document.createElement('div');
        el.className = 'mk-driver';
        el.textContent = '🚚';
        driverMarkers[d.id] = new mapboxgl.Marker({ element: el })
          .setLngLat([d.longitude, d.latitude])
          .setPopup(new mapboxgl.Popup({ offset:25 }).setText(d.label || 'Chofer'))
          .addTo(map);
      }
    }

    if (msg.type === 'flyTo') {
      map.flyTo({ center:[msg.longitude, msg.latitude], zoom: msg.zoom || 14, duration:800 });
    }
  }

  window.addEventListener('message', handleMsg);
  document.addEventListener('message', handleMsg);
</script>
</body>
</html>
  `, []); // [] = nunca se reconstruye el HTML

  // Envía stops al mapa cuando estén listos
  useEffect(() => {
    if (stops.length > 0) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setStops', stops }));
    }
  }, [JSON.stringify(stops)]);

  // Envía waypoints para calcular ruta por calles
  useEffect(() => {
    if (routeWaypoints.length >= 2) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setRoute', waypoints: routeWaypoints }));
    }
  }, [JSON.stringify(routeWaypoints)]);

  // Actualiza posición del chofer SIN reconstruir el HTML
  useEffect(() => {
    drivers.forEach((driver) => {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'updateDriver', driver }));
    });
  }, [drivers]);

  if (!USE_MAPBOX) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Configura EXPO_PUBLIC_MAPBOX_TOKEN en .env.local</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      style={[styles.map, style]}
      source={{ html: htmlContent }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === 'mapReady') {
            // Envía datos iniciales cuando el mapa está listo
            if (stops.length > 0) {
              webViewRef.current?.postMessage(JSON.stringify({ type: 'setStops', stops }));
            }
            if (routeWaypoints.length >= 2) {
              webViewRef.current?.postMessage(JSON.stringify({ type: 'setRoute', waypoints: routeWaypoints }));
            }
            drivers.forEach((driver) => {
              webViewRef.current?.postMessage(JSON.stringify({ type: 'updateDriver', driver }));
            });
          }
        } catch (e) {}
      }}
    />
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  placeholderText: { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 },
});

export default MapViewCustom;
