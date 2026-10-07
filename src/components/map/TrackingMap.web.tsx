import { View } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';
import type { TrackingMapProps } from './TrackingMap';
export default function TrackingMap({
  stops = [],
  center = { latitude: -2.124, longitude: -79.867 },
  currentPosition,
  routeCoordinates = [],
}: TrackingMapProps) {
  const points = stops.map((s) => ({
    id: s.id,
    label: s.label,
    lng: s.coordinates.longitude,
    lat: s.coordinates.latitude,
  }));
  if (currentPosition)
    points.push({
      id: 'driver',
      label: 'Chofer',
      lng: currentPosition.longitude,
      lat: currentPosition.latitude,
    });
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css" rel="stylesheet"><script src="https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js"></script><style>body{margin:0}#map{height:100vh;width:100vw}</style></head><body><div id="map"></div><script>mapboxgl.accessToken=${JSON.stringify(MAPBOX_ACCESS_TOKEN)};const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[${center.longitude},${center.latitude}],zoom:13});const points=${JSON.stringify(points).replaceAll('<', '\\u003c')};for(const p of points)new mapboxgl.Marker({color:p.id==='driver'?'#159A72':'#0F4C81'}).setLngLat([p.lng,p.lat]).setPopup(new mapboxgl.Popup().setText(p.label)).addTo(map);map.on('load',()=>{const coordinates=${JSON.stringify(routeCoordinates.map((p) => [p.longitude, p.latitude]))};if(coordinates.length>1){map.addSource('route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates}}});map.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':'#0F4C81','line-width':4}});}});</script></body></html>`;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${center.longitude - 0.035},${center.latitude - 0.035},${center.longitude + 0.035},${center.latitude + 0.035}&layer=mapnik&marker=${center.latitude},${center.longitude}`;
  return (
    <View style={{ flex: 1, minHeight: 300 }}>
      <iframe
        title="Mapa del servicio"
        srcDoc={MAPBOX_ACCESS_TOKEN ? html : undefined}
        src={!MAPBOX_ACCESS_TOKEN ? osm : undefined}
        style={{ width: '100%', height: 340, border: 0 }}
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
}
