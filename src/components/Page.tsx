import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useIsFocused,
  useNavigationState,
  useRoute,
} from "@react-navigation/native";
import { useApp } from "../store/AppProvider";
import { currentCustomer } from "../domain/repository";
import { titles, type Routes } from "../navigation/routes";
import { Body, Button, colors, Icon, ui } from "./ui";
import { NavigationBar } from "./NavigationBar";
import {
  clientTabs,
  driverTabs,
  primaryTabTarget,
  type Tab,
} from "../navigation/primaryTabs";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
const fullScreen = [
  "ClientNewOrderWizard",
  "ClientTracking",
  "Chat",
  "DriverMap",
  "DriverPickupConfirm",
  "DriverDeliveryConfirm",
  "DriverChangePassword",
];
export function Logo() {
  return (
    <Image
      source={require("../../assets/logo-laundry-name.png")}
      accessibilityLabel="Laundry Clean & Fresh"
      resizeMode="contain"
      style={{ width: 166, height: 42 }}
    />
  );
}
export function Page({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const { state, execute, reset, error, retry } = useApp();
  const navigation = useLaundryNavigation();
  const focused = useIsFocused();
  const route = useRoute();
  const name = route.name as keyof Routes;
  const [drawer, setDrawer] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false);
  const isClient = state.session?.role === "CLIENT";
  const user = isClient ? currentCustomer(state) : state.driver;
  const tabs = isClient ? clientTabs : driverTabs;
  const primary = primaryTabTarget(name);
  const activeTab = useNavigationState((navigationState) => {
    if (navigationState.type === "tab")
      return navigationState.routes[navigationState.index].name;
    const tabState = navigationState.routes.find(
      (r) => r.name === (isClient ? "ClientTabs" : "DriverTabs"),
    )?.state;
    return (
      tabState?.routes[tabState.index ?? 0]?.name ??
      (isClient ? "ClientHome" : "DriverRoute")
    );
  });
  useEffect(() => {
    if (!focused) {
      setDrawer(false);
      setResetConfirm(false);
    }
  }, [focused]);
  const authenticated =
    !!state.session &&
    (isClient
      ? currentCustomer(state).kycStatus === "APPROVED"
      : !state.driver.mustChangePassword);
  const navigate = (
    target:
      | Tab["route"]
      | "ClientNotifications"
      | "ClientWallet"
      | "ClientAddresses"
      | "ClientSupport",
  ) => {
    setDrawer(false);
    navigation.navigate(target);
  };
  const showTabs = authenticated && !primary && !fullScreen.includes(name);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={primary ? ["top"] : ["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <View
            style={[
              ui.row,
              { justifyContent: "space-between", flexWrap: "nowrap" },
            ]}
          >
            {authenticated ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir menú lateral"
                onPress={() => setDrawer(true)}
                style={{ padding: 10 }}
              >
                <Icon name="menu-outline" />
              </Pressable>
            ) : navigation.canGoBack() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Atrás"
                onPress={() => navigation.goBack()}
                style={{ padding: 10 }}
              >
                <Icon name="arrow-back" />
              </Pressable>
            ) : (
              <View style={{ width: 30 }} />
            )}
            <Logo />
            {authenticated && isClient ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver notificaciones"
                onPress={() => navigate("ClientNotifications")}
                style={{ padding: 10 }}
              >
                <Icon name="notifications-outline" />
                {state.notifications.some(
                  (n) => n.customerId === user.id && !n.isRead,
                ) && (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 9,
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: colors.lime,
                    }}
                  />
                )}
              </Pressable>
            ) : (
              <View style={{ width: 30 }} />
            )}
          </View>
          <View style={[ui.row, { justifyContent: "space-between" }]}>
            <View style={[ui.row, { flex: 1, flexWrap: "nowrap" }]}>
              {authenticated && !primary && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Atrás"
                  onPress={() =>
                    navigation.canGoBack()
                      ? navigation.goBack()
                      : navigate(isClient ? "ClientHome" : "DriverRoute")
                  }
                >
                  <Icon name="arrow-back" />
                </Pressable>
              )}
              <Text
                accessibilityRole="header"
                style={[ui.subtitle, { flexShrink: 1 }]}
              >
                {titles[name]}
              </Text>
            </View>
            {authenticated && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restablecer datos demo"
                onPress={() => setResetConfirm(true)}
                style={{ padding: 6 }}
              >
                <Icon name="refresh-outline" size={19} />
              </Pressable>
            )}
          </View>
        </View>
        {error && (
          <View style={{ padding: 10 }}>
            <Text style={ui.error}>{error}</Text>
            <Button label="Reintentar guardado" secondary onPress={retry} />
          </View>
        )}
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 16,
              gap: 16,
              paddingBottom: 28,
              width: "100%",
              maxWidth: 780,
              alignSelf: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              padding: 16,
              gap: 12,
              width: "100%",
              maxWidth: 780,
              alignSelf: "center",
            }}
          >
            {children}
          </View>
        )}
        {showTabs && (
          <NavigationBar
            tabs={tabs}
            activeRoute={activeTab}
            onSelect={navigate}
          />
        )}
        <Modal
          visible={focused && drawer}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawer(false)}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              backgroundColor: "#0F172A66",
            }}
          >
            <SafeAreaView
              style={{
                width: "85%",
                maxWidth: 340,
                backgroundColor: colors.surface,
              }}
            >
              <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                <View style={[ui.row, { justifyContent: "space-between" }]}>
                  <Logo />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar menú"
                    onPress={() => setDrawer(false)}
                  >
                    <Icon name="close" />
                  </Pressable>
                </View>
                <View
                  style={{
                    backgroundColor: colors.soft,
                    padding: 16,
                    borderRadius: 12,
                    gap: 4,
                  }}
                >
                  <Icon name="person-circle-outline" size={36} />
                  <Text style={ui.subtitle}>{user.name}</Text>
                  <Body>{isClient ? "Cliente" : "Chofer"}</Body>
                  <Body muted>{user.email}</Body>
                </View>
                {tabs.map((tab) => (
                  <Button
                    key={tab.route}
                    label={tab.label}
                    icon={tab.icon}
                    secondary
                    onPress={() => navigate(tab.route)}
                  />
                ))}
                {isClient && (
                  <>
                    <Button
                      label="Billetera Laundry"
                      icon="wallet-outline"
                      secondary
                      onPress={() => navigate("ClientWallet")}
                    />
                    <Button
                      label="Direcciones guardadas"
                      icon="location-outline"
                      secondary
                      onPress={() => navigate("ClientAddresses")}
                    />
                    <Button
                      label="Ayuda y soporte"
                      icon="help-circle-outline"
                      secondary
                      onPress={() => navigate("ClientSupport")}
                    />
                  </>
                )}
                <Body muted>Acceso rápido del prototipo</Body>
                <Button
                  label={
                    isClient
                      ? "Cambiar a chofer demo"
                      : "Cambiar a cliente demo"
                  }
                  secondary
                  onPress={() => {
                    setDrawer(false);
                    execute((r) => r.demoLogin(isClient ? "DRIVER" : "CLIENT"));
                  }}
                />
                <Button
                  label="Cerrar sesión"
                  icon="log-out-outline"
                  secondary
                  onPress={() => {
                    setDrawer(false);
                    execute((r) => r.logout());
                  }}
                />
              </ScrollView>
            </SafeAreaView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú lateral"
              onPress={() => setDrawer(false)}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>
        <Modal
          visible={focused && resetConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setResetConfirm(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 24,
              backgroundColor: "#0F172A66",
            }}
          >
            <View style={ui.card}>
              <Text style={ui.subtitle}>Restablecer demo</Text>
              <Body>
                Se reemplazarán los pedidos, cuentas, saldo y mensajes locales
                por los ejemplos iniciales.
              </Body>
              <Button
                label="Restablecer demo"
                onPress={() => {
                  setResetConfirm(false);
                  reset();
                }}
              />
              <Button
                label="Conservar datos"
                secondary
                onPress={() => setResetConfirm(false)}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
