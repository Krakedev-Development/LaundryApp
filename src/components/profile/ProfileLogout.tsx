import { Pressable, StyleSheet, Text } from "react-native";
import { tactile } from "../../design-system/interaction";
import { Icon } from "../ui";

export function ProfileLogout({ onPress }: { onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={() => {
        tactile("warning");
        onPress();
      }}
      style={({ pressed }) => [
        styles.logout,
        pressed && styles.logoutPressed,
      ]}
    >
      <Icon name="log-out-outline" size={18} color="#B91C1C" />
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    minHeight: 52,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
  },
  logoutPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    color: "#B91C1C",
  },
});
