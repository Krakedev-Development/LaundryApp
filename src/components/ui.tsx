import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
export const colors = {
  primary: "#143F73",
  dark: "#0F315A",
  soft: "#E8EEF5",
  lime: "#A5CD39",
  aqua: "#61BFC7",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  danger: "#B42335",
  success: "#087F5B",
};
export const ui = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: { color: colors.dark, fontWeight: "800", fontSize: 24 },
  subtitle: { color: colors.dark, fontWeight: "700", fontSize: 17 },
  text: { color: colors.text, fontSize: 14, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    minHeight: 46,
    fontSize: 14,
  },
  action: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 46,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    backgroundColor: colors.soft,
    paddingVertical: 5,
    paddingHorizontal: 9,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    backgroundColor: "#FFF1F2",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
});
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={ui.card}>{children}</View>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={ui.subtitle}>
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? ui.muted : ui.text}>{children}</Text>;
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <Text style={ui.badge}>{children}</Text>;
}
export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  busy = false,
  testID,
}: {
  label: string;
  onPress(): void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy }}
      testID={testID}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        ui.action,
        secondary && ui.outline,
        { opacity: disabled || busy ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.primary : "#FFF"} />
      ) : (
        icon && (
          <Icon
            name={icon}
            color={secondary ? colors.primary : "#FFF"}
            size={19}
          />
        )
      )}
      <Text
        style={{
          color: secondary ? colors.primary : "#FFF",
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[ui.input, props.style]}
      />
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      disabled={disabled}
      onPress={onPress}
      style={[
        ui.action,
        ui.outline,
        selected && {
          backgroundColor: colors.soft,
          borderColor: colors.primary,
        },
        { opacity: disabled ? 0.45 : 1 },
      ]}
    >
      <Icon
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={18}
      />
      <Text style={[ui.text, { flexShrink: 1 }]}>{label}</Text>
    </Pressable>
  );
}
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={() => onChange(!checked)}
      style={ui.row}
    >
      <Icon name={checked ? "checkbox" : "square-outline"} />
      <Text style={[ui.text, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <Card>
      <Icon name="file-tray-outline" size={32} />
      <Body>{text}</Body>
    </Card>
  );
}
export function useAction() {
  const [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const run = (action: () => unknown, success?: string): boolean => {
    try {
      setError(null);
      action();
      if (success) setMessage(success);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la acción.",
      );
      return false;
    }
  };
  const asyncRun = async (
    action: () => Promise<unknown>,
    success?: string,
  ): Promise<boolean> => {
    setBusy(true);
    try {
      setError(null);
      await action();
      if (success) setMessage(success);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la acción.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const feedback = (
    <>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {message && (
        <Text
          accessibilityLiveRegion="polite"
          style={[ui.badge, { color: colors.success }]}
        >
          {message}
        </Text>
      )}
    </>
  );
  return { run, asyncRun, feedback, busy };
}
