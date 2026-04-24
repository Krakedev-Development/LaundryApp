import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useOrderStore } from '../../../store/useOrderStore';
import { MAPBOX_ACCESS_TOKEN } from '../../../config/mapbox';
import { TIME_SLOTS } from '../../../data/mockData';
import AppHeader from '../../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function parseDDMMYYYY(value: string | null): Date | null {
  if (!value) return null;
  const [dd, mm, yyyy] = value.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  const date = new Date(yyyy, mm - 1, dd);
  date.setHours(0, 0, 0, 0);
  return date;
}

const MAP_HTML = (token: string) => `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet'/>
  <style>*{margin:0;padding:0;box-sizing:border-box}body,#map{width:100vw;height:100vh;overflow:hidden}#pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);font-size:36px;pointer-events:none;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}#addr{position:absolute;bottom:12px;left:12px;right:12px;background:#fff;border-radius:10px;padding:10px 12px;font-family:sans-serif;font-size:12px;color:#374151;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10}.mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}</style>
</head>
<body>
  <div id="map"></div><div id="pin">📦</div><div id="addr">Mueve el mapa para seleccionar</div>
<script>
  mapboxgl.accessToken='${token}';
  const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[-78.5243,-0.2295],zoom:14,attributionControl:false});
  map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');
  async function rg(lng,lat){try{const r=await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/'+lng+','+lat+'.json?access_token=${token}&language=es&limit=1');const d=await r.json();return d.features&&d.features[0]?d.features[0].place_name:'Ubicación seleccionada';}catch(e){return'Ubicación seleccionada';}}
  let t;
  map.on('moveend',async()=>{clearTimeout(t);t=setTimeout(async()=>{const c=map.getCenter();const a=await rg(c.lng,c.lat);document.getElementById('addr').textContent=a;if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'loc',lat:c.lat,lng:c.lng,address:a}));},400);});
  map.on('load',()=>{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));});
</script>
</body></html>`;

const WASH_TIME_DAYS: Record<string, { min: number; max: number }> = {
  alfombra: { min: 10, max: 15 },
  blanqueo: { min: 6, max: 10 },
  costura: { min: 7, max: 12 },
  desmanche: { min: 5, max: 9 },
  edredones: { min: 8, max: 14 },
  lp: { min: 5, max: 8 },
  ls: { min: 5, max: 8 },
  reproceso: { min: 7, max: 12 },
  solo_plancha: { min: 5, max: 7 },
  tinturado: { min: 9, max: 15 },
  zapatos: { min: 10, max: 15 },
};

function formatDateShort(date: Date) {
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' });
}

export default function Step4Delivery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pickupAddress, pickupDate, pickupCoords, garments, setDelivery } = useOrderStore();

  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState<'weekdays' | 'weekend'>('weekdays');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDateObj = parseDDMMYYYY(pickupDate);
  const minDays = garments.length > 0
    ? Math.max(...garments.map((g) => (WASH_TIME_DAYS[g.washType]?.min ?? 5)))
    : 5;
  const maxDays = garments.length > 0
    ? Math.max(...garments.map((g) => (WASH_TIME_DAYS[g.washType]?.max ?? 15)))
    : 15;

  const tentativeStartDate = new Date(pickupDateObj ?? today);
  tentativeStartDate.setDate(tentativeStartDate.getDate() + minDays);
  tentativeStartDate.setHours(0, 0, 0, 0);

  const tentativeEndDate = new Date(pickupDateObj ?? today);
  tentativeEndDate.setDate(tentativeEndDate.getDate() + maxDays);
  tentativeEndDate.setHours(0, 0, 0, 0);

  const preferredDates: Date[] = [];
  const cursor = new Date(tentativeStartDate);
  while (cursor <= tentativeEndDate) {
    const day = cursor.getDay(); // 0 domingo, 6 sábado
    const isWeekend = day === 0 || day === 6;
    const allowed = deliveryPreference === 'weekend' ? isWeekend : !isWeekend;
    if (allowed) preferredDates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const tentativeDeliveryLabel = preferredDates.length > 0
    ? `Tentativa ${formatDateShort(preferredDates[0])} - ${formatDateShort(preferredDates[preferredDates.length - 1])}`
    : `Tentativa ${formatDateShort(tentativeStartDate)} - ${formatDateShort(tentativeEndDate)}`;

  const [slot, setSlot] = useState<string | null>(null);

  const deliveryAddress = sameAsPickup ? pickupAddress : address;
  const canContinue = slot && (sameAsPickup || coords);

  const handleNext = () => {
    if (!canContinue) return;
    setDelivery(tentativeDeliveryLabel, slot!, deliveryAddress, sameAsPickup);
    router.push('/(client)/new-order/step5-confirm');
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Entrega" rightText="4 / 5" onBack={() => router.back()} />
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: '80%' }]} /></View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Misma dirección */}
        <View style={styles.sameRow}>
          <View style={styles.sameLeft}>
            <Ionicons name="location-outline" size={18} color="#3B82F6" />
            <View>
              <Text style={styles.sameLabel}>Misma dirección de recogida</Text>
              <Text style={styles.sameAddr} numberOfLines={1}>{pickupAddress || 'Sin dirección'}</Text>
            </View>
          </View>
          <Switch
            value={sameAsPickup}
            onValueChange={setSameAsPickup}
            trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
            thumbColor={sameAsPickup ? '#3B82F6' : '#9CA3AF'}
          />
        </View>

        {/* Dirección diferente */}
        {!sameAsPickup && (
          <>
            <Text style={styles.sectionLabel}>Dirección de entrega</Text>
            <TouchableOpacity style={[styles.locationBtn, coords && styles.locationBtnFilled]} onPress={() => setShowMap(true)}>
              <Ionicons name="location-outline" size={20} color={coords ? '#3B82F6' : '#9CA3AF'} />
              <Text style={[styles.locationText, coords && styles.locationTextFilled]} numberOfLines={2}>
                {address || 'Seleccionar en el mapa'}
              </Text>
              <Ionicons name="map-outline" size={18} color={coords ? '#3B82F6' : '#9CA3AF'} />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>Preferencia de entrega</Text>
        <View style={styles.preferenceRow}>
          <TouchableOpacity
            style={[styles.preferenceChip, deliveryPreference === 'weekdays' && styles.preferenceChipSelected]}
            onPress={() => setDeliveryPreference('weekdays')}
          >
            <Ionicons name="briefcase-outline" size={14} color={deliveryPreference === 'weekdays' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.preferenceChipText, deliveryPreference === 'weekdays' && styles.preferenceChipTextSelected]}>
              Días hábiles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.preferenceChip, deliveryPreference === 'weekend' && styles.preferenceChipSelected]}
            onPress={() => setDeliveryPreference('weekend')}
          >
            <Ionicons name="sunny-outline" size={14} color={deliveryPreference === 'weekend' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.preferenceChipText, deliveryPreference === 'weekend' && styles.preferenceChipTextSelected]}>
              Fines de semana
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tentativeCard}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <View style={styles.tentativeInfo}>
            <Text style={styles.tentativeTitle}>Estado de entrega</Text>
            <Text style={styles.tentativeValue}>Fecha de entrega aun no asignada</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Horario de entrega</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map(s => (
            <TouchableOpacity key={s} style={[styles.slotChip, slot === s && styles.slotChipSelected]} onPress={() => setSlot(s)}>
              <View style={[styles.slotIconWrap, slot === s && styles.slotIconWrapSelected]}>
                <Ionicons name="time-outline" size={13} color={slot === s ? '#fff' : '#6B7280'} />
              </View>
              <View style={styles.slotTextWrap}>
                <Text style={[styles.slotText, slot === s && styles.slotTextSelected]}>{s}</Text>
                <Text style={[styles.slotSubText, slot === s && styles.slotSubTextSelected]}>
                  Ventana de entrega
                </Text>
              </View>
              {slot === s && <Ionicons name="checkmark-circle" size={16} color="#2563EB" />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
          <Text style={styles.infoText}>
            Definimos una fecha exacta cuando tu pedido avance en proceso.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]} onPress={handleNext} disabled={!canContinue}>
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal mapa entrega */}
      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.backBtn}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Punto de entrega</Text>
            <View style={{ width: 32 }} />
          </View>
          <WebView source={{ html: MAP_HTML(MAPBOX_ACCESS_TOKEN) }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled mixedContentMode="always" originWhitelist={['*']}
            onMessage={e => { try { const m = JSON.parse(e.nativeEvent.data); if (m.type === 'loc') { setCoords({ lat: m.lat, lng: m.lng }); setAddress(m.address); } } catch {} }} />
          <View style={styles.mapPanel}>
            <View style={styles.addrRow}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={styles.addrText} numberOfLines={2}>{address || 'Mueve el mapa para seleccionar'}</Text>
            </View>
            <TouchableOpacity style={[styles.confirmMapBtn, !coords && styles.nextBtnDisabled]} onPress={() => coords && setShowMap(false)} disabled={!coords}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmMapBtnText}>Confirmar ubicación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
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
  sameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F7FF', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  sameLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sameLabel: { fontSize: 14, fontWeight: '600', color: '#1D4ED8' },
  sameAddr: { fontSize: 12, color: '#3B82F6', marginTop: 2, maxWidth: 220 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 20 },
  locationBtnFilled: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  locationText: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  locationTextFilled: { color: '#111827', fontWeight: '500' },
  preferenceRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  preferenceChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48, backgroundColor: '#fff' },
  preferenceChipSelected: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  preferenceChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  preferenceChipTextSelected: { color: '#2563EB' },
  tentativeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16 },
  tentativeInfo: { flex: 1 },
  tentativeTitle: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  tentativeValue: { fontSize: 14, color: '#1D4ED8', fontWeight: '700' },
  slotGrid: { gap: 8, marginBottom: 16 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  slotChipSelected: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  slotIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  slotIconWrapSelected: { backgroundColor: '#2563EB' },
  slotTextWrap: { flex: 1 },
  slotText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  slotTextSelected: { color: '#2563EB' },
  slotSubText: { fontSize: 11, color: '#6B7280' },
  slotSubTextSelected: { color: '#1D4ED8' },
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
