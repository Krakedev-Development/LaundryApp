import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconButton, Title } from "./ui";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const weekdays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(year, index - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Controlled view of existing agenda dates; never generates bookable dates or slots. */
export function ScheduleCalendar({
  dates,
  value,
  onChange,
}: {
  dates: readonly string[];
  value: string | undefined;
  onChange(date: string): void;
}) {
  const firstMonth = dates[0]?.slice(0, 7);
  const [month, setMonth] = useState(value?.slice(0, 7) || firstMonth);
  if (!month || !firstMonth) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const offset = new Date(year, monthNumber - 1, 1).getDay();
  const count = new Date(year, monthNumber, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return (
    <View style={calendarStyles.card}>
      <View style={calendarStyles.navigation}>
        <IconButton
          label="Mes anterior"
          icon="chevron-back"
          onPress={() => setMonth(shiftMonth(month, -1))}
        />
        <Title style={calendarStyles.month}>
          {months[monthNumber - 1]} {year}
        </Title>
        <IconButton
          label="Mes siguiente"
          icon="chevron-forward"
          onPress={() => setMonth(shiftMonth(month, 1))}
        />
      </View>
      <View style={calendarStyles.weekdays}>
        {weekdays.map((day) => (
          <Text key={day} style={calendarStyles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Fecha del servicio"
        style={calendarStyles.grid}
      >
        {cells.map((day, index) => {
          if (day === null)
            return <View key={`blank-${index}`} style={calendarStyles.cell} />;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const enabled = dates.includes(date);
          const selected = value === date;
          return (
            <Pressable
              key={date}
              accessibilityRole="radio"
              accessibilityLabel={date}
              accessibilityState={{ checked: selected, disabled: !enabled }}
              aria-checked={selected}
              disabled={!enabled}
              onPress={() => onChange(date)}
              style={calendarStyles.cell}
            >
              <View
                style={[
                  calendarStyles.day,
                  selected && calendarStyles.selected,
                  !enabled && calendarStyles.unavailable,
                ]}
              >
                <Text
                  style={[
                    calendarStyles.dayText,
                    selected && calendarStyles.selectedText,
                    !enabled && calendarStyles.unavailableText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  month: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
    textAlign: "center",
  },
  weekdays: { flexDirection: "row", paddingHorizontal: 4, marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 32,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: "#3B82F6" },
  unavailable: { opacity: 0.3 },
  dayText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#111827",
    fontWeight: "500",
  },
  selectedText: { color: "#FFFFFF", fontWeight: "700" },
  unavailableText: { color: "#9CA3AF" },
});
