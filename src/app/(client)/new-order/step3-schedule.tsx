import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../../../store/useOrderStore';
import { TIME_SLOTS } from '../../../data/mockData';
import AppHeader from '../../../components/layout/AppHeader';

// Genera los próximos 42 días para el calendario
function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_HEADER = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];

export default function Step3Schedule() {
  const router = useRouter();
  const { setSchedule } = useOrderStore();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [pickupSlot, setPickupSlot] = useState<string | null>(null);
  const [deliverySlot, setDeliverySlot] = useState<string | null>(null);

  const cells = buildCalendar(calYear, calMonth);
  const canContinue = selectedDay && pickupSlot && deliverySlot;

  const selectedDateStr = selectedDay
    ? `${String(selectedDay).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}/${calYear}`
    : null;

  const handleNext = () => {
    if (!canContinue) return;
    setSchedule(pickupSlot!, deliverySlot!, selectedDateStr!);
    router.push('/(client)/new-order/step4-address');
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const isPast = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Horarios" rightText="3 / 5" onBack={() => router.back()} />
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '60%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Selector de fecha */}
        <Text style={styles.sectionLabel}>Fecha de recogida</Text>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCal(true)}>
          <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
          <Text style={[styles.datePickerText, !selectedDateStr && styles.datePlaceholder]}>
            {selectedDateStr ?? 'Seleccionar fecha'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Horario recogida */}
        <Text style={styles.sectionLabel}>Horario de recogida</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, pickupSlot === slot && styles.slotChipSelected]}
              onPress={() => setPickupSlot(slot)}
            >
              <Ionicons name="time-outline" size={13} color={pickupSlot === slot ? '#fff' : '#6B7280'} />
              <Text style={[styles.slotText, pickupSlot === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horario entrega */}
        <Text style={styles.sectionLabel}>Horario de entrega (día siguiente)</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, deliverySlot === slot && styles.slotChipSelected]}
              onPress={() => setDeliverySlot(slot)}
            >
              <Ionicons name="time-outline" size={13} color={deliverySlot === slot ? '#fff' : '#6B7280'} />
              <Text style={[styles.slotText, deliverySlot === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
          <Text style={styles.infoText}>El proceso toma 24 horas. La entrega es al día siguiente.</Text>
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

      {/* Modal calendario — 50% de pantalla */}
      <Modal visible={showCal} transparent animationType="slide">
        <View style={styles.calOverlay}>
          <View style={styles.calSheet}>
            <View style={styles.calHandle} />

            {/* Nav mes */}
            <View style={styles.calNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Cabecera días */}
            <View style={styles.calDaysHeader}>
              {DAYS_HEADER.map(d => (
                <Text key={d} style={styles.calDayHeader}>{d}</Text>
              ))}
            </View>

            {/* Grid días */}
            <View style={styles.calGrid}>
              {cells.map((day, i) => {
                if (!day) return <View key={i} style={styles.calCell} />;
                const past = isPast(day);
                const selected = selectedDay === day && calMonth === calMonth;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calCell, selected && styles.calCellSelected, past && styles.calCellPast]}
                    onPress={() => !past && setSelectedDay(day)}
                    disabled={past}
                  >
                    <Text style={[styles.calDayText, selected && styles.calDayTextSelected, past && styles.calDayTextPast]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.calConfirmBtn, !selectedDay && styles.calConfirmBtnDisabled]}
              onPress={() => selectedDay && setShowCal(false)}
              disabled={!selectedDay}
            >
              <Text style={styles.calConfirmText}>
                {selectedDay ? `Confirmar ${selectedDay}/${calMonth+1}/${calYear}` : 'Selecciona un día'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  step: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 4 },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 14, marginBottom: 20,
  },
  datePickerText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  datePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  slotChipSelected: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  slotText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  slotTextSelected: { color: '#fff' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  infoText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 16 },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Calendario modal
  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  calSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  calHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  calNavBtn: { padding: 6 },
  calMonthTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  calDaysHeader: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  calCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: '#3B82F6', borderRadius: 100 },
  calCellPast: { opacity: 0.3 },
  calDayText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  calDayTextSelected: { color: '#fff', fontWeight: '700' },
  calDayTextPast: { color: '#9CA3AF' },
  calConfirmBtn: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#3B82F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  calConfirmBtnDisabled: { backgroundColor: '#D1D5DB' },
  calConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
