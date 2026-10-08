import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Body, colors, Icon, IconButton, Title, ui, type IconName } from "./ui";
import { MotionSection } from "../design-system/MotionProvider";
import { theme } from "../design-system/tokens";
import { statusLabels, type OrderStatus, type Order } from "../domain/models";
export function Accordion({
  title,
  children,
  initialOpen = false,
  subtitle,
}: {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <View style={ui.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={[ui.row, { minHeight: 48, flexWrap: "nowrap" }]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Title>{title}</Title>
          {subtitle && <Body muted>{subtitle}</Body>}
        </View>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={20} />
      </Pressable>
      {open && (
        <MotionSection>
          <View style={{ gap: 12 }}>{children}</View>
        </MotionSection>
      )}
    </View>
  );
}
export function ListItem({
  title,
  subtitle,
  icon,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?(): void;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: colors.soft,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon && <Icon name={icon} size={21} />}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[ui.text, { fontWeight: "600" }]}>{title}</Text>
        {subtitle && <Body muted>{subtitle}</Body>}
      </View>
      {trailing || (onPress && <Icon name="chevron-forward" size={18} />)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        ui.row,
        {
          minHeight: 64,
          flexWrap: "nowrap",
          paddingVertical: 8,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      style={[
        ui.row,
        { minHeight: 64, flexWrap: "nowrap", paddingVertical: 8 },
      ]}
    >
      {content}
    </View>
  );
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        borderRadius: 16,
        backgroundColor: colors.soft,
      }}
    >
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityLabel={o.label}
          accessibilityState={{ checked: value === o.value }}
          aria-checked={value === o.value}
          onPress={() => onChange(o.value)}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            backgroundColor:
              value === o.value ? colors.surface : colors.transparent,
          }}
        >
          <Text
            style={[
              ui.muted,
              {
                color: value === o.value ? colors.primary : colors.muted,
                fontWeight: value === o.value ? "700" : "500",
                textAlign: "center",
              },
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Buscar",
}: {
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}) {
  return (
    <View
      style={[ui.input, ui.row, { paddingVertical: 0, flexWrap: "nowrap" }]}
    >
      <Icon name="search" size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, minHeight: 50, color: colors.text, fontSize: 16 }}
        returnKeyType="search"
      />
      {value !== "" && (
        <IconButton
          label="Limpiar búsqueda"
          icon="close"
          onPress={() => onChange("")}
        />
      )}
    </View>
  );
}
export function useSearch(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(
      () => setDebounced(value.trim().toLocaleLowerCase()),
      theme.motion.search,
    );
    return () => clearTimeout(id);
  }, [value]);
  return debounced;
}
export function Stepper({
  step,
  labels,
}: {
  step: number;
  labels: readonly string[];
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Title>{labels[step - 1]}</Title>
        <Body muted>
          {step} de {labels.length}
        </Body>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso de solicitud"
        accessibilityValue={{ min: 1, max: labels.length, now: step }}
        style={{ flexDirection: "row", gap: 6 }}
      >
        {labels.map((label, i) => (
          <View
            key={label}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              backgroundColor: i < step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
export function StatusChip({ status }: { status: OrderStatus }) {
  const done = ["DELIVERED", "COMPLETED", "CLOSED"].includes(status),
    problem = ["INCIDENT", "CANCELLED"].includes(status);
  const attention = [
    "PAYMENT_PENDING",
    "PRICING_PENDING",
    "CUSTOMER_APPROVAL_PENDING",
    "WEIGHING",
  ].includes(status);
  const foreground = problem
    ? colors.danger
    : done
      ? colors.success
      : attention
        ? colors.warning
        : colors.info;
  const backgroundColor = problem
    ? colors.dangerSoft
    : done
      ? colors.successSoft
      : attention
        ? colors.warningSoft
        : colors.infoSoft;
  return (
    <MotionSection key={status}>
      <View
        style={[
          ui.row,
          {
            alignSelf: "flex-start",
            backgroundColor,
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 5,
            gap: 6,
          },
        ]}
      >
        <Icon
          name={
            problem
              ? "alert-circle-outline"
              : done
                ? "checkmark-circle-outline"
                : attention
                  ? "time-outline"
                  : "ellipse-outline"
          }
          color={foreground}
          size={15}
        />
        <Text
          style={[
            theme.typography.caption,
            { color: foreground, fontWeight: "600" },
          ]}
        >
          {statusLabels[status]}
        </Text>
      </View>
    </MotionSection>
  );
}
export function Timeline({ events }: { events: Order["timeline"] }) {
  return (
    <View style={{ gap: 16 }}>
      {events.map((event, i) => (
        <View
          key={event.status + "-" + i}
          style={[ui.row, { alignItems: "flex-start", flexWrap: "nowrap" }]}
        >
          <View style={{ alignItems: "center", alignSelf: "stretch", gap: 6 }}>
            <Icon
              name={
                event.completed ? "checkmark-circle-outline" : "ellipse-outline"
              }
              color={event.completed ? colors.success : colors.muted}
              size={20}
            />
            {i < events.length - 1 && (
              <View
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 18,
                  backgroundColor: colors.border,
                }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Body>{event.title}</Body>
            {event.description && <Body muted>{event.description}</Body>}
            <Body muted>{event.timestamp}</Body>
          </View>
        </View>
      ))}
    </View>
  );
}
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View
      accessibilityLabel="Cargando contenido"
      accessibilityState={{ busy: true }}
      style={{ gap: 12, width: "100%" }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          style={{
            height: i === 0 ? 28 : 16,
            width: i === lines - 1 ? "65%" : "100%",
            borderRadius: 8,
            backgroundColor: colors.skeleton,
          }}
        />
      ))}
    </View>
  );
}
