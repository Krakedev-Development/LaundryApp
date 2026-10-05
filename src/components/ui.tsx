import React, { createContext, useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors as C } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Typography as T } from "../theme/typography";
import { Spacing as S } from "../theme/spacing";
import { Shadows } from "../theme/shadows";
import { useApp } from "../store/AppStore";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  content: {
    padding: S.lg,
    gap: S.lg,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: 32,
  },
  row: { flexDirection: "row", alignItems: "center", gap: S.md },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: S.sm,
  },
  title: { fontSize: T.title, fontWeight: "800", color: C.text },
  hero: { fontSize: T.hero, fontWeight: "800", color: C.text },
  section: { fontSize: T.section, fontWeight: "700", color: C.text },
  body: { fontSize: T.body, lineHeight: 21, color: C.text },
  muted: { fontSize: T.body, lineHeight: 21, color: C.textMuted },
  meta: { fontSize: T.meta, color: C.textMuted },
  card: {
    backgroundColor: C.surface,
    borderRadius: Radius.card,
    padding: S.lg,
    gap: S.md,
    borderWidth: 1,
    borderColor: C.border,
    ...Shadows.card,
  },
  divider: { height: 1, backgroundColor: C.border },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  heroCard: {
    backgroundColor: C.primary,
    borderRadius: Radius.card,
    padding: S.xxl,
    gap: S.lg,
  },
});
export function Page({
  children,
  footer,
}: React.PropsWithChildren<{ footer?: React.ReactNode }>) {
  return (
    <KeyboardAvoidingView
      style={ui.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        {children}
      </ScrollView>
      {!!footer && (
        <View
          style={{
            padding: S.lg,
            borderTopWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
          }}
        >
          <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
            {footer}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
export function Card({
  children,
  style,
}: React.PropsWithChildren<{
  style?: React.ComponentProps<typeof View>["style"];
}>) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  busy,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "lime";
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
}) {
  const bg =
    variant === "secondary"
      ? C.surface
      : variant === "danger"
        ? C.danger
        : variant === "lime"
          ? C.lime
          : C.primary;
  const color =
    variant === "secondary" || variant === "lime" ? C.primary : C.surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || busy), busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: Radius.button,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: variant === "secondary" ? C.border : bg,
        opacity: disabled || busy ? 0.45 : pressed ? 0.8 : 1,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Ionicons name={icon} color={color} size={20} />
      ) : null}
      <Text
        style={{
          color,
          fontSize: T.body,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: C.primarySoft,
      }}
    >
      <Ionicons name={name} color={C.primary} size={22} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: C.text, fontSize: T.label, fontWeight: "600" }}>
        {label}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={C.textMuted}
        style={[
          {
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: Radius.input,
            minHeight: 48,
            padding: 12,
            color: C.text,
            fontSize: T.body,
          },
          props.multiline && { minHeight: 80, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function PasswordField(props: TextInputProps & { label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Field
        {...props}
        autoCapitalize="none"
        secureTextEntry={!visible}
        style={{ paddingRight: 50 }}
      />
      <View style={{ position: "absolute", bottom: 2, right: 4 }}>
        <IconButton
          name={visible ? "eye-off-outline" : "eye-outline"}
          label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onPress={() => setVisible(!visible)}
        />
      </View>
    </View>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  disabled,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: Radius.chip,
        borderWidth: 1,
        borderColor: selected ? C.primary : C.border,
        backgroundColor: selected ? C.primary : C.surface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontWeight: "600",
          color: selected ? C.surface : C.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Check({
  title,
  checked,
  onPress,
}: {
  title: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={onPress}
      style={[ui.row, { minHeight: 48 }]}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        color={C.primary}
        size={24}
      />
      <Text style={[ui.body, { flex: 1 }]}>{title}</Text>
    </Pressable>
  );
}
export function Badge({
  title,
  tone = "primary",
}: {
  title: string;
  tone?: "primary" | "success" | "warning" | "purple" | "danger";
}) {
  const colors = {
    primary: [C.primarySoft, C.primary],
    success: [C.successSoft, C.primaryDark],
    warning: [C.warningSoft, C.primaryDark],
    purple: [C.purpleSoft, C.purple],
    danger: [C.dangerSoft, C.danger],
  };
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: Radius.chip,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: colors[tone][0],
      }}
    >
      <Text
        style={{ color: colors[tone][1], fontWeight: "700", fontSize: T.meta }}
      >
        {title}
      </Text>
    </View>
  );
}
export function EmptyState({
  title,
  text,
  icon = "shirt-outline",
  action,
}: {
  title: string;
  text: string;
  icon?: IconName;
  action?: React.ReactNode;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 32 }}>
      <View
        style={{ backgroundColor: C.aquaSoft, padding: 20, borderRadius: 50 }}
      >
        <Ionicons name={icon} size={40} color={C.primary} />
      </View>
      <Text style={[ui.section, { textAlign: "center" }]}>{title}</Text>
      <Text style={[ui.muted, { textAlign: "center" }]}>{text}</Text>
      {action}
    </Card>
  );
}
export function ErrorState({
  text,
  retry,
}: {
  text: string;
  retry?: () => void;
}) {
  return (
    <Card>
      <Badge title="Necesitamos tu atención" tone="danger" />
      <Text accessibilityRole="alert" style={ui.body}>
        {text}
      </Text>
      {!!retry && <Button title="Reintentar" onPress={retry} />}
    </Card>
  );
}
export function LoadingSkeleton() {
  return (
    <View
      style={{ padding: 24, gap: 16, backgroundColor: C.background, flex: 1 }}
    >
      {[160, 100, 200].map((h, i) => (
        <View
          key={i}
          accessibilityLabel="Cargando contenido"
          style={{
            height: h,
            backgroundColor: C.primarySoft,
            borderRadius: 14,
          }}
        />
      ))}
    </View>
  );
}
export function AppHeader({
  title,
  subtitle,
  icon = "shirt-outline",
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: React.ReactNode;
}) {
  return (
    <View style={ui.between}>
      <View style={[ui.row, { flex: 1 }]}>
        <View
          style={{
            width: 44,
            height: 44,
            backgroundColor: C.limeSoft,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={25} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ui.title}>{title}</Text>
          {!!subtitle && <Text style={ui.meta}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}
export function BottomSheet({
  visible,
  title,
  children,
  onClose,
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15,49,90,0.4)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          accessibilityLabel="Cerrar panel"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            maxHeight: "90%",
            backgroundColor: C.surface,
            borderTopLeftRadius: Radius.sheet,
            borderTopRightRadius: Radius.sheet,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            padding: 20,
            paddingBottom: 32,
          }}
        >
          <View style={ui.between}>
            <Text style={ui.section}>{title}</Text>
            <IconButton name="close" label="Cerrar panel" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingTop: 16 }}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
export function ConfirmationSheet({
  visible,
  title,
  text,
  confirm,
  onClose,
  danger,
}: {
  visible: boolean;
  title: string;
  text: string;
  confirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <Text style={ui.body}>{text}</Text>
      <Button
        title={title}
        onPress={confirm}
        variant={danger ? "danger" : "primary"}
      />
      <Button title="Cancelar" onPress={onClose} variant="secondary" />
    </BottomSheet>
  );
}
const ToastContext = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: React.PropsWithChildren) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function show(text: string) {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 4000);
  }
  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <Pressable
          accessibilityRole="alert"
          onPress={() => setMessage("")}
          style={{
            position: "absolute",
            bottom: 90,
            left: 20,
            right: 20,
            maxWidth: 640,
            alignSelf: "center",
            backgroundColor: C.primaryDark,
            padding: 16,
            borderRadius: 14,
          }}
        >
          <Text
            style={{ color: C.surface, textAlign: "center", fontWeight: "600" }}
          >
            {message}
          </Text>
        </Pressable>
      ) : null}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function OfflineBanner() {
  const { online, data, storageError, store } = useApp();
  return (
    <View>
      {!online && (
        <View style={{ padding: 10, backgroundColor: C.warningSoft }}>
          <Text style={{ color: C.primaryDark, fontWeight: "700" }}>
            Sin conexión · Puedes consultar tu ruta cargada.
          </Text>
          <Text style={ui.meta}>
            {data.pendingOperations.length} cambios pendientes de
            sincronización.
          </Text>
        </View>
      )}
      {!!storageError && (
        <Pressable
          onPress={() => store.retrySave()}
          style={{ padding: 10, backgroundColor: C.dangerSoft }}
        >
          <Text style={ui.body}>{storageError} Toca para reintentar.</Text>
        </Pressable>
      )}
    </View>
  );
}
export function MenuRow({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[ui.row, { minHeight: 56, paddingVertical: 8 }]}
    >
      <Ionicons name={icon} color={C.primary} size={22} />
      <View style={{ flex: 1 }}>
        <Text style={[ui.body, { fontWeight: "600" }]}>{title}</Text>
        {!!subtitle && <Text style={ui.meta}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" color={C.textMuted} size={18} />
    </Pressable>
  );
}
