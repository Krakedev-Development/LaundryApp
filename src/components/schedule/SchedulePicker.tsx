import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_H = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const CAL_CELL_SIZE = Math.floor((Dimensions.get('window').width - 24) / 7);

function buildCalendar(y: number, m: number) {
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface SchedulePickerProps {
  dateSectionLabel: string;
  dateHint: string;
  slotSectionLabel: string;
  slotSubtitle: string;
  selectedDate: Date | null;
  selectedSlot: string | null;
  minDate: Date;
  timeSlots: string[];
  onDateChange: (date: Date) => void;
  onSlotChange: (slot: string) => void;
}

function formatDate(date: Date | null) {
  if (!date) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export default function SchedulePicker({
  dateSectionLabel,
  dateHint,
  slotSectionLabel,
  slotSubtitle,
  selectedDate,
  selectedSlot,
  minDate,
  timeSlots,
  onDateChange,
  onSlotChange,
}: SchedulePickerProps) {
  const [showCal, setShowCal] = useState(false);
  const [calY, setCalY] = useState((selectedDate ?? minDate).getFullYear());
  const [calM, setCalM] = useState((selectedDate ?? minDate).getMonth());

  const cells = useMemo(() => buildCalendar(calY, calM), [calY, calM]);
  const selectedDateText = formatDate(selectedDate);
  const minDateDay = new Date(minDate);
  minDateDay.setHours(0, 0, 0, 0);

  const isBlockedDate = (day: number) => {
    const date = new Date(calY, calM, day);
    date.setHours(0, 0, 0, 0);
    return date < minDateDay;
  };

  const pickDay = (day: number) => {
    const pickedDate = new Date(calY, calM, day);
    pickedDate.setHours(0, 0, 0, 0);
    onDateChange(pickedDate);
  };

  return (
    <>
      <Text style={styles.sectionLabel}>{dateSectionLabel}</Text>
      <TouchableOpacity style={[styles.dateBtn, selectedDate && styles.dateBtnFilled]} onPress={() => setShowCal(true)}>
        <View style={styles.dateIconWrap}>
          <Ionicons name="calendar-outline" size={18} color={selectedDate ? '#2563EB' : '#9CA3AF'} />
        </View>
        <View style={styles.dateTextWrap}>
          <Text style={styles.dateHint}>{dateHint}</Text>
          <Text style={[styles.dateBtnText, !selectedDate && styles.datePlaceholder]}>
            {selectedDateText ?? 'Toca para elegir fecha'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>{slotSectionLabel}</Text>
      <View style={styles.slotGrid}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotChip, selectedSlot === slot && styles.slotChipSelected]}
            onPress={() => onSlotChange(slot)}
          >
            <View style={[styles.slotIconWrap, selectedSlot === slot && styles.slotIconWrapSelected]}>
              <Ionicons name="time-outline" size={13} color={selectedSlot === slot ? '#fff' : '#6B7280'} />
            </View>
            <View style={styles.slotTextWrap}>
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>{slot}</Text>
              <Text style={[styles.slotSubText, selectedSlot === slot && styles.slotSubTextSelected]}>
                {slotSubtitle}
              </Text>
            </View>
            {selectedSlot === slot && <Ionicons name="checkmark-circle" size={16} color="#2563EB" />}
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showCal} transparent animationType="slide">
        <View style={styles.calOverlay}>
          <View style={styles.calSheet}>
            <View style={styles.calHandle} />
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => calM === 0 ? (setCalM(11), setCalY((y) => y - 1)) : setCalM((m) => m - 1)} style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.calTitle}>{MONTHS[calM]} {calY}</Text>
              <TouchableOpacity onPress={() => calM === 11 ? (setCalM(0), setCalY((y) => y + 1)) : setCalM((m) => m + 1)} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.calDaysH}>
              {DAYS_H.map((d) => <Text key={d} style={styles.calDayH}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {cells.map((day, i) => {
                if (!day) return <View key={i} style={styles.calCell} />;
                const blocked = isBlockedDate(day);
                const selected = selectedDate
                  && selectedDate.getFullYear() === calY
                  && selectedDate.getMonth() === calM
                  && selectedDate.getDate() === day;
                return (
                  <TouchableOpacity key={i} style={styles.calCell} onPress={() => !blocked && pickDay(day)} disabled={blocked}>
                    <View style={[styles.dayPill, selected && styles.dayPillSelected, blocked && styles.dayPillPast]}>
                      <Text style={[styles.calDayTxt, selected && styles.calDayTxtSel, blocked && styles.calDayTxtPast]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[styles.calConfirm, !selectedDate && styles.nextBtnDisabled]} onPress={() => selectedDate && setShowCal(false)} disabled={!selectedDate}>
              <Text style={styles.calConfirmTxt}>{selectedDateText ? `Confirmar ${selectedDateText}` : 'Selecciona un día'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 4 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 20, backgroundColor: '#fff' },
  dateBtnFilled: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  dateIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  dateTextWrap: { flex: 1 },
  dateHint: { fontSize: 11, color: '#9CA3AF', marginBottom: 1 },
  dateBtnText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  datePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
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
  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  calSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  calHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  calNavBtn: { padding: 6 },
  calTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  calDaysH: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  calDayH: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  calCell: { width: CAL_CELL_SIZE, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayPill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayPillSelected: { backgroundColor: '#3B82F6' },
  dayPillPast: { opacity: 0.3 },
  calDayTxt: { fontSize: 15, color: '#111827', fontWeight: '500' },
  calDayTxtSel: { color: '#fff', fontWeight: '700' },
  calDayTxtPast: { color: '#9CA3AF' },
  calConfirm: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#3B82F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  calConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
