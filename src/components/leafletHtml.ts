import type { MapThemeMode } from "./routeMapShared";
import type { LatLng } from "../services/maps/routingService";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const OSM_TILE_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_FILTER_CSS = `
    body.tactical .leaflet-tile-pane {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(85%);
    }
    body.light .leaflet-tile-pane {
      filter: contrast(98%) saturate(92%) brightness(101%);
    }
`;

export function buildPinPickerLeafletHtml(
  initialLat: number,
  initialLng: number,
  mode: MapThemeMode,
): string {
  const bg = mode === "tactical" ? "#0B1320" : "#E2E8F0";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS}" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${bg};
      overflow: hidden;
      touch-action: none;
    }
    .leaflet-control-attribution { display: none !important; }
    ${TILE_FILTER_CSS}
  </style>
</head>
<body class="${mode}">
  <div id="map"></div>
  <script src="${LEAFLET_JS}"></script>
  <script>
    (function () {
      var map = L.map('map', {
        center: [${initialLat}, ${initialLng}],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('${OSM_TILE_TEMPLATE}', {
        maxZoom: 19
      }).addTo(map);

      var suppressNextMoveEnd = false;

      function post(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      map.on('movestart', function () {
        post({ type: 'MOVE_START' });
      });

      map.on('moveend', function () {
        if (suppressNextMoveEnd) {
          suppressNextMoveEnd = false;
          return;
        }
        var c = map.getCenter();
        post({
          type: 'MOVE_END',
          latitude: Number(c.lat.toFixed(6)),
          longitude: Number(c.lng.toFixed(6))
        });
      });

      window.flyToPoint = function (lat, lng) {
        suppressNextMoveEnd = true;
        map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
      };

      window.setTileMode = function (nextMode) {
        document.body.className = nextMode;
        document.body.style.background = nextMode === 'tactical' ? '#0B1320' : '#E2E8F0';
      };
    })();
  </script>
</body>
</html>`;
}

export interface RouteRadarHtmlParams {
  origin: LatLng;
  destination: LatLng & { addressFull: string };
  facility?: LatLng & { name?: string };
  routeCoordinates?: LatLng[];
  mode: MapThemeMode;
  isSearching: boolean;
  driverLabel: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildRouteRadarLeafletHtml(
  params: RouteRadarHtmlParams,
): string {
  const {
    origin,
    destination,
    facility,
    routeCoordinates,
    mode,
    isSearching,
    driverLabel,
  } = params;

  const isTactical = mode === "tactical";
  const bg = isTactical ? "#0B1320" : "#E2E8F0";
  const lineColor = isTactical ? "#38BDF8" : "#2563EB";
  const initialCoords =
    routeCoordinates && routeCoordinates.length >= 2
      ? routeCoordinates
      : [origin, destination];

  const polyJson = JSON.stringify(
    initialCoords.map((c) => [c.latitude, c.longitude]),
  );
  const boundsPoints = [
    [origin.latitude, origin.longitude],
    [destination.latitude, destination.longitude],
    ...(facility ? [[facility.latitude, facility.longitude]] : []),
  ];

  const safeDestLabel = escapeHtml(destination.addressFull || "Destino");
  const safeFacilityLabel = escapeHtml(facility?.name || "Sede Central");
  const safeDriverLabel = escapeHtml(driverLabel);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS}" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${bg};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-attribution { display: none !important; }
    .radar-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
    }
    .radar-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid #334155;
      background: rgba(15, 23, 42, 0.9);
      color: #F8FAFC;
      margin-bottom: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    }
    .radar-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${isSearching ? "#FACC15" : "#22C55E"};
    }
    .radar-core-wrap {
      position: relative;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .radar-halo {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${isSearching ? "#FACC15" : "#38BDF8"};
      animation: radarPulse 1.8s infinite ease-out;
    }
    .radar-core {
      position: relative;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${isSearching ? "#CA8A04" : "#0284C7"};
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .dest-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
    }
    .dest-ring {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(165, 205, 57, 0.28);
      border: 1.5px solid #A5CD39;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dest-core {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #A5CD39;
      border: 2px solid #FFFFFF;
    }
    .pin-label {
      margin-top: 3px;
      padding: 2px 7px;
      border-radius: 7px;
      font-size: 10px;
      font-weight: 600;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: rgba(15, 23, 42, 0.88);
      color: #E2E8F0;
      border: 1px solid #334155;
    }
    .fac-core {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #334155;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
    }
    @keyframes radarPulse {
      0% { transform: scale(1); opacity: 0.7; }
      75% { transform: scale(2.2); opacity: 0.15; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    ${TILE_FILTER_CSS}
  </style>
</head>
<body class="${mode}">
  <div id="map"></div>
  <script src="${LEAFLET_JS}"></script>
  <script>
    (function () {
      var map = L.map('map', {
        center: [${origin.latitude}, ${origin.longitude}],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('${OSM_TILE_TEMPLATE}', {
        maxZoom: 19
      }).addTo(map);

      var routeLine = L.polyline(${polyJson}, {
        color: '${lineColor}',
        weight: 4,
        dashArray: '8, 6',
        opacity: 0.92
      }).addTo(map);

      function driverIconHtml(searching, label) {
        var dotColor = searching ? '#FACC15' : '#22C55E';
        var haloColor = searching ? '#FACC15' : '#38BDF8';
        var coreColor = searching ? '#CA8A04' : '#0284C7';
        var svg = searching
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
        return '<div class="radar-wrap">' +
          '<div class="radar-badge"><span class="radar-dot" style="background:' + dotColor + '"></span><span>' + label + '</span></div>' +
          '<div class="radar-core-wrap"><div class="radar-halo" style="background:' + haloColor + '"></div><div class="radar-core" style="background:' + coreColor + '">' + svg + '</div></div>' +
          '</div>';
      }

      var driverMarker = L.marker([${origin.latitude}, ${origin.longitude}], {
        icon: L.divIcon({
          className: '',
          html: driverIconHtml(${isSearching}, '${safeDriverLabel}'),
          iconSize: [0, 0]
        }),
        zIndexOffset: 500
      }).addTo(map);

      var destHtml = '<div class="dest-wrap">' +
        '<div class="dest-ring"><div class="dest-core"></div></div>' +
        '<div class="pin-label">${safeDestLabel}</div>' +
        '</div>';

      L.marker([${destination.latitude}, ${destination.longitude}], {
        icon: L.divIcon({ className: '', html: destHtml, iconSize: [0, 0] })
      }).addTo(map);

      ${
        facility
          ? `
      var facHtml = '<div class="dest-wrap">' +
        '<div class="fac-core">S</div>' +
        '<div class="pin-label">${safeFacilityLabel}</div>' +
        '</div>';
      L.marker([${facility.latitude}, ${facility.longitude}], {
        icon: L.divIcon({ className: '', html: facHtml, iconSize: [0, 0] })
      }).addTo(map);
      `
          : ""
      }

      var bounds = L.latLngBounds(${JSON.stringify(boundsPoints)});
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [46, 46], maxZoom: 15 });
      }

      window.updateDriverPosition = function (lat, lng, searching, label) {
        driverMarker.setLatLng([lat, lng]);
        driverMarker.setIcon(L.divIcon({
          className: '',
          html: driverIconHtml(searching, label),
          iconSize: [0, 0]
        }));
      };

      window.updateRoutePolyline = function (coords) {
        if (Array.isArray(coords) && coords.length >= 2) {
          routeLine.setLatLngs(coords);
        }
      };

      window.setTileMode = function (nextMode) {
        document.body.className = nextMode;
        document.body.style.background = nextMode === 'tactical' ? '#0B1320' : '#E2E8F0';
        routeLine.setStyle({ color: nextMode === 'tactical' ? '#38BDF8' : '#2563EB' });
      };
    })();
  </script>
</body>
</html>`;
}
