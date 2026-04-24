import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import MapViewCustom, { DriverMarker, StopMarker } from '../../components/map/MapViewCustom';
import { MOCK_ORDERS, MOCK_DRIVER } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import AppHeader from '../../components/layout/AppHeader';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

type AdminOrderStatus = 'new' | 'assigned' | 'picked_up' | 'delivering' | 'delivered';

interface Branch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface DispatchOrder {
  id: string;
  clientName: string;
  address: string;
  slot: string;
  service: string;
  status: AdminOrderStatus;
  assignedDriverId: string | null;
  coordinates: { latitude: number; longitude: number };
  branchId: string | null;
}

const DRIVER_POOL = [
  { id: MOCK_DRIVER.id, name: MOCK_DRIVER.name, plate: MOCK_DRIVER.plate, coordinates: MOCK_DRIVER.coordinates },
  { id: 'd2', name: 'Luis Ramirez', plate: 'PDT-8841', coordinates: { latitude: -0.2261, longitude: -78.5179 } },
  { id: 'd3', name: 'Ana Mena', plate: 'PCQ-4192', coordinates: { latitude: -0.2354, longitude: -78.5311 } },
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Sede Centro', latitude: -0.2295, longitude: -78.5243, address: 'Av. Amazonas N23-45, Quito' },
  { id: 'b2', name: 'Sede Norte', latitude: -0.2248, longitude: -78.5122, address: 'Av. 6 de Diciembre N33-12, Quito' },
];

const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  new: 'Nueva',
  assigned: 'Asignada',
  picked_up: 'Recogida',
  delivering: 'En entrega',
  delivered: 'Entregada',
};

const STATUS_COLOR: Record<AdminOrderStatus, string> = {
  new: '#F59E0B',
  assigned: BRAND_COLORS.primary,
  picked_up: '#8B5CF6',
  delivering: '#06B6D4',
  delivered: BRAND_COLORS.accentDark,
};

function nearestBranchId(
  point: { latitude: number; longitude: number },
  branches: Branch[]
): string | null {
  if (!branches.length) return null;
  return branches.reduce((best, next) => {
    const dBest = Math.abs(best.latitude - point.latitude) + Math.abs(best.longitude - point.longitude);
    const dNext = Math.abs(next.latitude - point.latitude) + Math.abs(next.longitude - point.longitude);
    return dNext < dBest ? next : best;
  }).id;
}

function mapHtml(token: string) {
  return `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet'/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body,#map{width:100vw;height:100vh;overflow:hidden}
    #pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);font-size:34px;pointer-events:none;z-index:10}
    #addr{position:absolute;bottom:10px;left:10px;right:10px;background:#fff;border-radius:10px;padding:10px;font-family:sans-serif;font-size:12px;color:#374151;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10}
    .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">📍</div>
  <div id="addr">Mueve el mapa para ubicar la sede</div>
<script>
  mapboxgl.accessToken='${token}';
  const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[-78.5243,-0.2295],zoom:13,attributionControl:false});
  let debounce;
  async function rg(lng,lat){
    try{
      const r=await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/'+lng+','+lat+'.json?access_token=${token}&language=es&limit=1');
      const d=await r.json();
      return d.features&&d.features[0]?d.features[0].place_name:'Ubicación seleccionada';
    }catch(e){return 'Ubicación seleccionada';}
  }
  map.on('moveend',async()=>{
    clearTimeout(debounce);
    debounce=setTimeout(async()=>{
      const c=map.getCenter();
      const a=await rg(c.lng,c.lat);
      document.getElementById('addr').textContent=a;
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'location',lat:c.lat,lng:c.lng,address:a}));
      }
    },350);
  });
</script>
</body></html>`;
}

export default function AdminDashboard() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [orders, setOrders] = useState<DispatchOrder[]>(
    MOCK_ORDERS.map((order, idx) => ({
      id: order.id,
      clientName: order.client.name,
      address: order.address,
      slot: idx % 2 === 0 ? '09:00 - 09:30' : '10:00 - 10:30',
      service: order.serviceType.replace('_', ' '),
      status: idx === 0 ? 'assigned' : 'new',
      assignedDriverId: idx === 0 ? MOCK_DRIVER.id : null,
      coordinates: order.client.coordinates,
      branchId: nearestBranchId(order.client.coordinates, INITIAL_BRANCHES),
    }))
  );
  const [selectOrderId, setSelectOrderId] = useState<string | null>(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [pickedAddress, setPickedAddress] = useState('');
  const [pickedCoords, setPickedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const webRef = useRef<WebView>(null);

  const counts = useMemo(() => ({
    incoming: orders.filter((o) => o.status === 'new').length,
    active: orders.filter((o) => ['assigned', 'picked_up', 'delivering'].includes(o.status)).length,
    closed: orders.filter((o) => o.status === 'delivered').length,
  }), [orders]);

  const mapDrivers: DriverMarker[] = DRIVER_POOL.map((driver) => ({
    id: driver.id,
    latitude: driver.coordinates.latitude,
    longitude: driver.coordinates.longitude,
    label: driver.name.split(' ')[0],
  }));

  const mapStops: StopMarker[] = orders.map((order, i) => ({
    id: order.id,
    label: String(i + 1),
    latitude: order.coordinates.latitude,
    longitude: order.coordinates.longitude,
    completed: order.status === 'delivered',
    hasIncident: order.status === 'new',
  }));

  const assignNearestDriver = (orderId: string) => {
    const current = orders.find((o) => o.id === orderId);
    if (!current) return;
    const nearest = DRIVER_POOL.reduce((best, next) => {
      const dBest = Math.abs(best.coordinates.latitude - current.coordinates.latitude) + Math.abs(best.coordinates.longitude - current.coordinates.longitude);
      const dNext = Math.abs(next.coordinates.latitude - current.coordinates.latitude) + Math.abs(next.coordinates.longitude - current.coordinates.longitude);
      return dNext < dBest ? next : best;
    }, DRIVER_POOL[0]);
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, assignedDriverId: nearest.id, status: o.status === 'new' ? 'assigned' : o.status } : o)
    );
  };

  const advanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status === 'new') return { ...o, status: 'assigned' };
        if (o.status === 'assigned') return { ...o, status: 'picked_up' };
        if (o.status === 'picked_up') return { ...o, status: 'delivering' };
        if (o.status === 'delivering') return { ...o, status: 'delivered' };
        return o;
      })
    );
  };

  const updateOrderBranch = (orderId: string, branchId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, branchId } : o)));
    setShowBranchPicker(false);
    setSelectOrderId(null);
  };

  const onMapMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'location') {
        setPickedCoords({ latitude: msg.lat, longitude: msg.lng });
        setPickedAddress(msg.address ?? '');
      }
    } catch {}
  };

  const saveBranch = () => {
    if (!branchName.trim() || !pickedCoords) return;
    const created: Branch = {
      id: `b-${Date.now()}`,
      name: branchName.trim(),
      latitude: pickedCoords.latitude,
      longitude: pickedCoords.longitude,
      address: pickedAddress || 'Ubicación seleccionada',
    };
    setBranches((prev) => [...prev, created]);
    setBranchName('');
    setPickedAddress('');
    setPickedCoords(null);
    setShowCreateBranch(false);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AppHeader title="Centro de Operaciones" subtitle="Recogidas y entregas - gestion por sede" />

        <View style={styles.kpiRow}>
          <KpiCard label="Nuevas" value={counts.incoming} color="#F59E0B" />
          <KpiCard label="Activas" value={counts.active} color={BRAND_COLORS.primary} />
          <KpiCard label="Cerradas" value={counts.closed} color={BRAND_COLORS.accentDark} />
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Mapa global operativo</Text>
          <MapViewCustom center={{ latitude: -0.2295, longitude: -78.5243 }} drivers={mapDrivers} stops={mapStops} style={styles.map} />
        </View>

        <View style={styles.branchHeaderRow}>
          <Text style={styles.sectionTitle}>Sedes</Text>
          <TouchableOpacity style={styles.newBranchBtn} onPress={() => setShowCreateBranch(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newBranchText}>Nueva sede</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Solicitudes de recogida y entrega</Text>
        {orders.map((order) => {
          const assigned = DRIVER_POOL.find((d) => d.id === order.assignedDriverId);
          const selectedBranch = branches.find((b) => b.id === order.branchId);
          const suggested = branches.find((b) => b.id === nearestBranchId(order.coordinates, branches));
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderId}>{order.id}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status]}</Text>
                </View>
              </View>
              <Text style={styles.orderMeta}>{order.clientName} · {order.slot}</Text>
              <Text style={styles.orderMeta}>Servicio: {order.service}</Text>
              <Text style={styles.orderAddress}>{order.address}</Text>
              <Text style={styles.auditNote}>Sede sugerida: {suggested?.name ?? 'Sin sugerencia'}</Text>

              <View style={styles.branchPickerRow}>
                <Text style={styles.branchLabel}>Sede seleccionada:</Text>
                <TouchableOpacity
                  style={styles.branchSelectBtn}
                  onPress={() => {
                    setSelectOrderId(order.id);
                    setShowBranchPicker(true);
                  }}
                >
                  <Text style={styles.branchSelectText}>{selectedBranch?.name ?? 'Elegir sede'}</Text>
                  <Ionicons name="chevron-down" size={15} color={BRAND_COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => assignNearestDriver(order.id)}>
                  <Ionicons name="person-add-outline" size={16} color={BRAND_COLORS.primary} />
                  <Text style={styles.secondaryBtnText}>Asignar chofer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => advanceStatus(order.id)}>
                  <Ionicons name="sync-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Actualizar estado</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.driverText}>
                {assigned ? `Chofer: ${assigned.name} · ${assigned.plate}` : 'Chofer: sin asignar'}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showBranchPicker} transparent animationType="fade" onRequestClose={() => setShowBranchPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elegir sede</Text>
            {branches.map((b) => (
              <TouchableOpacity key={b.id} style={styles.branchOption} onPress={() => selectOrderId && updateOrderBranch(selectOrderId, b.id)}>
                <Ionicons name="business-outline" size={16} color={BRAND_COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.branchOptionName}>{b.name}</Text>
                  <Text style={styles.branchOptionAddr} numberOfLines={1}>{b.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBranchPicker(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCreateBranch} animationType="slide" onRequestClose={() => setShowCreateBranch(false)}>
        <View style={styles.createContainer}>
          <AppHeader title="Crear sede" onBack={() => setShowCreateBranch(false)} />
          <View style={styles.createBody}>
            <TextInput
              style={styles.branchInput}
              placeholder="Nombre de sede"
              value={branchName}
              onChangeText={setBranchName}
            />
            <Text style={styles.createHint}>Ubica la sede en el mapa (centro del pin).</Text>
          </View>
          <WebView
            ref={webRef}
            source={{ html: mapHtml(MAPBOX_ACCESS_TOKEN) }}
            style={{ flex: 1 }}
            onMessage={onMapMessage}
            javaScriptEnabled
            domStorageEnabled
          />
          <View style={styles.createFooter}>
            <Text style={styles.addrPreview} numberOfLines={2}>{pickedAddress || 'Sin ubicación seleccionada'}</Text>
            <TouchableOpacity
              style={[styles.saveBranchBtn, (!branchName.trim() || !pickedCoords) && { opacity: 0.5 }]}
              disabled={!branchName.trim() || !pickedCoords}
              onPress={saveBranch}
            >
              <Text style={styles.saveBranchText}>Guardar sede</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { padding: 16, paddingBottom: 30 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  kpiValue: { fontSize: 24, fontWeight: '700' },
  kpiLabel: { fontSize: 12, color: '#6B7280' },
  mapCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  map: { height: 220, borderRadius: 12, overflow: 'hidden' },
  branchHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newBranchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND_COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  newBranchText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  orderMeta: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  orderAddress: { fontSize: 13, color: '#374151', marginBottom: 4 },
  auditNote: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  branchPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  branchLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  branchSelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.2, borderColor: BRAND_COLORS.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  branchSelectText: { color: BRAND_COLORS.primary, fontWeight: '700', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  secondaryBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 8, padding: 10 },
  secondaryBtnText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_COLORS.primary, borderRadius: 8, padding: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  driverText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  branchOption: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 8 },
  branchOptionName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  branchOptionAddr: { fontSize: 11, color: '#6B7280' },
  modalCloseBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 10 },
  modalCloseText: { color: BRAND_COLORS.primary, fontWeight: '700' },
  createContainer: { flex: 1, backgroundColor: '#fff' },
  createBody: { padding: 16, gap: 8 },
  branchInput: { borderWidth: 1.2, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827' },
  createHint: { fontSize: 12, color: '#6B7280' },
  createFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8 },
  addrPreview: { fontSize: 12, color: '#374151' },
  saveBranchBtn: { backgroundColor: BRAND_COLORS.primary, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  saveBranchText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
