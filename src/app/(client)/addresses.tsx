import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, FlatList, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';
import AppHeader from '../../components/layout/AppHeader';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'Casa', address: 'Av. Amazonas N23-45, Quito', latitude: -0.2310, longitude: -78.5200, isDefault: true },
  { id: '2', label: 'Trabajo', address: 'Av. 6 de Diciembre N33-12, Quito', latitude: -0.2280, longitude: -78.5150, isDefault: false },
];

const QUITO_CENTER = { lat: -0.2295, lng: -78.5243 };

function buildMapHtml(centerLat: number, centerLng: number, zoom: number) {
  return `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet'/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body,#map{width:100vw;height:100vh;overflow:hidden}
    #pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);font-size:36px;pointer-events:none;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))}
    #info{position:absolute;bottom:16px;left:16px;right:16px;background:#fff;border-radius:12px;padding:12px 14px;font-family:sans-serif;font-size:13px;color:#374151;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10}
    .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">📍</div>
  <div id="info">Mueve el mapa para seleccionar una ubicación</div>
<script>
  mapboxgl.accessToken='${MAPBOX_ACCESS_TOKEN}';
  const map=new mapboxgl.Map({
    container:'map',
    style:'mapbox://styles/mapbox/streets-v12',
    center:[${centerLng},${centerLat}],
    zoom:${zoom},
    attributionControl:false
  });
  map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');

  async function reverseGeocode(lng,lat){
    try{
      const r=await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/'+lng+','+lat+'.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=es&limit=1');
      const d=await r.json();
      return d.features&&d.features.length>0?d.features[0].place_name:'Ubicación seleccionada';
    }catch(e){return'Ubicación seleccionada';}
  }

  let debounce;
  map.on('moveend',async()=>{
    clearTimeout(debounce);
    debounce=setTimeout(async()=>{
      const c=map.getCenter();
      const addr=await reverseGeocode(c.lng,c.lat);
      document.getElementById('info').textContent=addr;
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'locationUpdate',lat:c.lat,lng:c.lng,address:addr}));
      }
    },400);
  });

  map.on('load',()=>{
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
  });
</script>
</body></html>`;
}

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES);
  const [showMap, setShowMap] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mapInitialCenter, setMapInitialCenter] = useState(QUITO_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickedAddress, setPickedAddress] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const mapHtml = useMemo(
    () => buildMapHtml(mapInitialCenter.lat, mapInitialCenter.lng, mapZoom),
    [mapInitialCenter.lat, mapInitialCenter.lng, mapZoom],
  );

  const webViewKey = `${editingId ?? 'new'}-${mapInitialCenter.lat}-${mapInitialCenter.lng}-${mapZoom}`;

  const closeMapModal = () => {
    setShowMap(false);
    setMapReady(false);
    setEditingId(null);
    setPickedCoords(null);
    setPickedAddress('');
    setLabelInput('');
    setMapInitialCenter(QUITO_CENTER);
    setMapZoom(14);
  };

  const openAddAddress = () => {
    setEditingId(null);
    setMapInitialCenter(QUITO_CENTER);
    setMapZoom(14);
    setPickedCoords(null);
    setPickedAddress('');
    setLabelInput('');
    setMapReady(false);
    setShowMap(true);
  };

  const openEditLocation = (item: SavedAddress) => {
    setEditingId(item.id);
    setMapInitialCenter({ lat: item.latitude, lng: item.longitude });
    setMapZoom(16);
    setPickedCoords({ lat: item.latitude, lng: item.longitude });
    setPickedAddress(item.address);
    setLabelInput(item.label);
    setMapReady(false);
    setShowMap(true);
  };

  const handleMapMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'mapReady') setMapReady(true);
      if (msg.type === 'locationUpdate') {
        setPickedCoords({ lat: msg.lat, lng: msg.lng });
        setPickedAddress(msg.address);
      }
    } catch (e) {}
  };

  const handleSaveAddress = () => {
    if (!pickedCoords || !labelInput.trim()) {
      Alert.alert('Completa los campos', 'Ingresa un nombre para esta dirección y selecciona un punto en el mapa.');
      return;
    }
    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                label: labelInput.trim(),
                address: pickedAddress || a.address,
                latitude: pickedCoords.lat,
                longitude: pickedCoords.lng,
              }
            : a,
        ),
      );
    } else {
      const newAddr: SavedAddress = {
        id: Date.now().toString(),
        label: labelInput.trim(),
        address: pickedAddress,
        latitude: pickedCoords.lat,
        longitude: pickedCoords.lng,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddr]);
    }
    closeMapModal();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar dirección', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setAddresses((a) => a.filter((x) => x.id !== id)) },
    ]);
  };

  const handleSetDefault = (id: string) => {
    setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Mis direcciones" onBack={() => router.back()} />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.addressCard, item.isDefault && styles.addressCardDefault]}>
            <View style={[styles.addrIcon, item.isDefault && styles.addrIconDefault]}>
              <Ionicons
                name={item.label.toLowerCase() === 'casa' ? 'home-outline' : 'business-outline'}
                size={20}
                color={item.isDefault ? '#fff' : '#3B82F6'}
              />
            </View>
            <View style={styles.addrInfo}>
              <View style={styles.addrLabelRow}>
                <Text style={styles.addrLabel}>{item.label}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Principal</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addrText} numberOfLines={2}>{item.address}</Text>
            </View>
            <View style={styles.addrActions}>
              <TouchableOpacity onPress={() => openEditLocation(item)} style={styles.addrBtn} accessibilityLabel="Editar ubicación">
                <Ionicons name="map-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
              {!item.isDefault && (
                <TouchableOpacity onPress={() => handleSetDefault(item.id)} style={styles.addrBtn}>
                  <Ionicons name="star-outline" size={18} color="#F59E0B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.addrBtn}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAddAddress}>
            <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.addBtnText}>Agregar dirección</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={showMap} animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.mapModal}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={closeMapModal} style={styles.backBtn}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.title}>{editingId ? 'Editar ubicación' : 'Seleccionar ubicación'}</Text>
              <View style={{ width: 32 }} />
            </View>

            <View style={styles.mapContainer}>
              <WebView
                key={webViewKey}
                source={{ html: mapHtml }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
                originWhitelist={['*']}
                onMessage={handleMapMessage}
              />
            </View>

            <View style={styles.mapPanel}>
              <View style={styles.pickedAddressRow}>
                <Ionicons name="location" size={18} color="#3B82F6" />
                <Text style={styles.pickedAddressText} numberOfLines={2}>
                  {pickedAddress || (mapReady ? 'Mueve el mapa para ajustar el pin' : 'Cargando mapa…')}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Nombre de esta dirección</Text>
              <View style={styles.labelInputBox}>
                <Ionicons name="bookmark-outline" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.labelInput}
                  placeholder="Ej: Casa, Trabajo, Gym..."
                  value={labelInput}
                  onChangeText={setLabelInput}
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveAddress}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, (!pickedCoords || !labelInput.trim()) && styles.saveBtnDisabled]}
                onPress={handleSaveAddress}
                disabled={!pickedCoords || !labelInput.trim()}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{editingId ? 'Guardar cambios' : 'Guardar dirección'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  addressCardDefault: { borderColor: '#3B82F6' },
  addrIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addrIconDefault: { backgroundColor: '#3B82F6' },
  addrInfo: { flex: 1 },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  addrLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  defaultBadge: { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { fontSize: 10, color: '#3B82F6', fontWeight: '700' },
  addrText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  addrActions: { flexDirection: 'row', gap: 4 },
  addrBtn: { padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 12, padding: 14, borderStyle: 'dashed' },
  addBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 15 },
  mapModal: { flex: 1, backgroundColor: '#fff' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  mapPanel: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  pickedAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10 },
  pickedAddressText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  labelInputBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 14 },
  labelInput: { flex: 1, fontSize: 15, color: '#111827' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 14 },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
