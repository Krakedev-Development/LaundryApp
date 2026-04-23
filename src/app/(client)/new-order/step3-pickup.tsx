import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useOrderStore } from '../../../store/useOrderStore';
import { MAPBOX_ACCESS_TOKEN } from '../../../config/mapbox';
import { TIME_SLOTS } from '../../../data/mockData';
import SchedulePicker from '../../../components/schedule/SchedulePicker';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUITO = { lat: -0.2295, lng: -78.5243 };

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

const SAVED_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'Casa', address: 'Av. Amazonas N23-45, Quito', latitude: -0.2310, longitude: -78.5200, isDefault: true },
  { id: '2', label: 'Trabajo', address: 'Av. 6 de Diciembre N33-12, Quito', latitude: -0.2280, longitude: -78.5150, isDefault: false },
];

const MAP_HTML = (token: string) => `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet'/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body,#map{width:100vw;height:100vh;overflow:hidden}
    #pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);font-size:36px;pointer-events:none;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}
    #addr{position:absolute;bottom:12px;left:12px;right:12px;background:#fff;border-radius:10px;padding:10px 12px;font-family:sans-serif;font-size:12px;color:#374151;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10}
    .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">📍</div>
  <div id="addr">Mueve el mapa para seleccionar</div>
<script>
  mapboxgl.accessToken='${token}';
  const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[${QUITO.lng},${QUITO.lat}],zoom:14,attributionControl:false});
  map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');
  async function rg(lng,lat){
    try{const r=await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/'+lng+','+lat+'.json?access_token=${token}&language=es&limit=1');const d=await r.json();return d.features&&d.features[0]?d.features[0].place_name:'Ubicación seleccionada';}catch(e){return'Ubicación seleccionada';}
  }
  let t;
  map.on('moveend',async()=>{clearTimeout(t);t=setTimeout(async()=>{const c=map.getCenter();const a=await rg(c.lng,c.lat);document.getElementById('addr').textContent=a;if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'loc',lat:c.lat,lng:c.lng,address:a}));},400);});
  map.on('load',()=>{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));});
</script>
</body></html>`;

export default function Step3Pickup() {
  const router = useRouter();
  const { setPickup } = useOrderStore();
  const webRef = useRef<WebView>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [selectedSavedId, setSelectedSavedId] = useState(SAVED_ADDRESSES.find((a) => a.isDefault)?.id ?? SAVED_ADDRESSES[0].id);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');

  const selectedSavedAddress = SAVED_ADDRESSES.find((a) => a.id === selectedSavedId) ?? SAVED_ADDRESSES[0];
  const currentAddress = addressMode === 'saved' ? selectedSavedAddress?.address : address;
  const currentCoords = addressMode === 'saved'
    ? (selectedSavedAddress ? { lat: selectedSavedAddress.latitude, lng: selectedSavedAddress.longitude } : null)
    : coords;

  const dateStr = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`
    : null;
  const canContinue = selectedDate && slot && currentCoords;

  const handleNext = () => {
    if (!canContinue) return;
    setPickup(dateStr!, slot!, currentAddress, { latitude: currentCoords!.lat, longitude: currentCoords!.lng });
    router.push('/(client)/new-order/step4-delivery');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Recogida</Text>
        <Text style={styles.step}>3 / 5</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: '60%' }]} /></View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Dirección de recogida */}
        <Text style={styles.sectionLabel}>Dirección de recogida</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, addressMode === 'saved' && styles.modeChipSelected]}
            onPress={() => setAddressMode('saved')}
          >
            <Ionicons name="bookmark-outline" size={14} color={addressMode === 'saved' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.modeChipText, addressMode === 'saved' && styles.modeChipTextSelected]}>
              Guardadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, addressMode === 'new' && styles.modeChipSelected]}
            onPress={() => setAddressMode('new')}
          >
            <Ionicons name="add-circle-outline" size={14} color={addressMode === 'new' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.modeChipText, addressMode === 'new' && styles.modeChipTextSelected]}>
              Nueva para este pedido
            </Text>
          </TouchableOpacity>
        </View>

        {addressMode === 'saved' ? (
          <View style={styles.savedList}>
            {SAVED_ADDRESSES.map((item) => {
              const isSelected = selectedSavedId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.savedCard, isSelected && styles.savedCardSelected]}
                  onPress={() => setSelectedSavedId(item.id)}
                >
                  <View style={[styles.savedIcon, isSelected && styles.savedIconSelected]}>
                    <Ionicons
                      name={item.label.toLowerCase() === 'casa' ? 'home-outline' : 'business-outline'}
                      size={16}
                      color={isSelected ? '#fff' : '#2563EB'}
                    />
                  </View>
                  <View style={styles.savedInfo}>
                    <View style={styles.savedTitleRow}>
                      <Text style={styles.savedLabel}>{item.label}</Text>
                      {item.isDefault && <Text style={styles.defaultBadge}>Principal</Text>}
                    </View>
                    <Text style={styles.savedAddress} numberOfLines={2}>{item.address}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#2563EB" />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity style={[styles.locationBtn, coords && styles.locationBtnFilled]} onPress={() => setShowMap(true)}>
            <Ionicons name="location-outline" size={20} color={coords ? '#3B82F6' : '#9CA3AF'} />
            <Text style={[styles.locationText, coords && styles.locationTextFilled]} numberOfLines={2}>
              {address || 'Seleccionar en el mapa (solo para este pedido)'}
            </Text>
            <Ionicons name="map-outline" size={18} color={coords ? '#3B82F6' : '#9CA3AF'} />
          </TouchableOpacity>
        )}

        <SchedulePicker
          dateSectionLabel="Fecha de recogida"
          dateHint="Selecciona la fecha de recogida"
          slotSectionLabel="Horario de recogida"
          slotSubtitle="Ventana de recogida"
          selectedDate={selectedDate}
          selectedSlot={slot}
          minDate={today}
          timeSlots={TIME_SLOTS}
          onDateChange={setSelectedDate}
          onSlotChange={setSlot}
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
          <Text style={styles.infoText}>El chofer llegará dentro del rango horario seleccionado.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canContinue}
        >
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal mapa */}
      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.backBtn}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Punto de recogida</Text>
            <View style={{ width: 32 }} />
          </View>
          <WebView
            ref={webRef}
            source={{ html: MAP_HTML(MAPBOX_ACCESS_TOKEN) }}
            style={{ flex: 1 }}
            javaScriptEnabled domStorageEnabled mixedContentMode="always" originWhitelist={['*']}
            onMessage={e => {
              try {
                const m = JSON.parse(e.nativeEvent.data);
                if (m.type === 'loc') { setCoords({ lat: m.lat, lng: m.lng }); setAddress(m.address); }
              } catch {}
            }}
          />
          <View style={styles.mapPanel}>
            <View style={styles.addrRow}>
              <Ionicons name="location" size={16} color="#3B82F6" />
              <Text style={styles.addrText} numberOfLines={2}>{address || 'Mueve el mapa para seleccionar'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmMapBtn, !(addressMode === 'saved' ? currentCoords : coords) && styles.nextBtnDisabled]}
              onPress={() => (addressMode === 'saved' ? currentCoords : coords) && setShowMap(false)}
              disabled={!(addressMode === 'saved' ? currentCoords : coords)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmMapBtnText}>Confirmar ubicación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  step: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.3, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  modeChipSelected: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  modeChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  modeChipTextSelected: { color: '#2563EB' },
  savedList: { marginBottom: 12, gap: 8 },
  savedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.3, borderColor: '#E5E7EB', padding: 12 },
  savedCardSelected: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  savedIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  savedIconSelected: { backgroundColor: '#2563EB' },
  savedInfo: { flex: 1 },
  savedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  savedLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  defaultBadge: { fontSize: 10, fontWeight: '700', color: '#2563EB', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  savedAddress: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 20 },
  locationBtnFilled: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  locationText: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  locationTextFilled: { color: '#111827', fontWeight: '500' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  infoText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 16 },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  mapPanel: { backgroundColor: '#fff', padding: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 12 },
  addrText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  confirmMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 14 },
  confirmMapBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
