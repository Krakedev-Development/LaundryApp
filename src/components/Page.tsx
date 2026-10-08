import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useIsFocused,
  useNavigationState,
  useRoute,
} from "@react-navigation/native";
import { useApp } from "../store/AppProvider";
import { currentCustomer } from "../domain/repository";
import { titles, type Routes } from "../navigation/routes";
import { Body, Button, colors, Icon, IconButton, ui } from "./ui";
import { Accordion, ListItem } from "./presentation";
import { Drawer, ConfirmDialog } from "./overlay/OverlayPortal";
import { NavigationBar } from "./NavigationBar";
import {
  clientTabs,
  driverTabs,
  primaryTabTarget,
  type Tab,
} from "../navigation/primaryTabs";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import { theme } from "../design-system/tokens";
import { ComponentCatalog } from "./ComponentCatalog";
import { friendlyError } from "../design-system/interaction";
const fullScreen = [
  "ClientSchedule",
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
      style={{ width: theme.layout.logoWidth, height: theme.layout.logoHeight }}
    />
  );
}
export function Page({
  children,
  scroll = true,
  footer,
  scrollResetKey,
  onBack,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  scrollResetKey?: string | number;
  onBack?(): void;
}) {
  const { state, execute, reset, error, retry } = useApp();
  const navigation = useLaundryNavigation(),
    focused = useIsFocused(),
    route = useRoute();
  const name = route.name as keyof Routes;
  const [drawer, setDrawer] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false),
    [catalog, setCatalog] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isClient = state.session?.role === "CLIENT",
    user = isClient ? currentCustomer(state) : state.driver;
  const tabs = isClient ? clientTabs : driverTabs,
    primary = primaryTabTarget(name);
  const activeTab = useNavigationState((s) => {
    if (s.type === "tab") return s.routes[s.index].name;
    const nested = s.routes.find(
      (r) => r.name === (isClient ? "ClientTabs" : "DriverTabs"),
    )?.state;
    return (
      nested?.routes[nested.index ?? 0]?.name ??
      (isClient ? "ClientHome" : "DriverRoute")
    );
  });
  useEffect(() => {
    if (!focused) {
      setDrawer(false);
      setResetConfirm(false);
      setCatalog(false);
    }
  }, [focused]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  useFocusEffect(
    React.useCallback(() => {
      if (!onBack) return;
      const listener = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => listener.remove();
    }, [onBack]),
  );
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
  const back = () =>
    onBack
      ? onBack()
      : navigation.canGoBack()
        ? navigation.goBack()
        : navigate(isClient ? "ClientHome" : "DriverRoute");
  const showTabs = authenticated && !primary && !fullScreen.includes(name);
  const notification = state.notifications.some(
    (n) => n.customerId === user.id && !n.isRead,
  );
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
            borderBottomColor: colors.divider,
            borderBottomWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <View
            style={[
              ui.row,
              { justifyContent: "space-between", flexWrap: "nowrap" },
            ]}
          >
            {primary || !navigation.canGoBack() ? (
              authenticated ? (
                <IconButton
                  label="Abrir menú lateral"
                  icon="menu-outline"
                  onPress={() => setDrawer(true)}
                />
              ) : (
                <View style={{ width: 48 }} />
              )
            ) : (
              <IconButton label="Atrás" icon="arrow-back" onPress={back} />
            )}
            {primary || !authenticated ? (
              <Logo />
            ) : (
              <Text
                accessibilityRole="header"
                numberOfLines={2}
                style={[ui.subtitle, { flex: 1, marginHorizontal: 8 }]}
              >
                {titles[name]}
              </Text>
            )}
            {authenticated && !primary ? (
              <IconButton
                label="Abrir menú lateral"
                icon="menu-outline"
                onPress={() => setDrawer(true)}
              />
            ) : authenticated && isClient ? (
              <View>
                <IconButton
                  label="Ver notificaciones"
                  icon="notifications-outline"
                  onPress={() => navigate("ClientNotifications")}
                />
                {notification && (
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: colors.danger,
                    }}
                  />
                )}
              </View>
            ) : (
              <View style={{ width: 48 }} />
            )}
          </View>
        </View>
        {error && (
          <View style={{ padding: 12 }}>
            <Text accessibilityRole="alert" style={ui.error}>
              {friendlyError(error)}
            </Text>
            <Button label="Reintentar guardado" secondary onPress={retry} />
          </View>
        )}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: theme.spacing.screen,
              gap: 20,
              paddingBottom: 28,
              width: "100%",
              maxWidth: theme.layout.maxWidth,
              alignSelf: "center",
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              padding: theme.spacing.screen,
              gap: 16,
              width: "100%",
              maxWidth: theme.layout.maxWidth,
              alignSelf: "center",
            }}
          >
            {children}
          </View>
        )}
        {footer && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              padding: 12,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: theme.layout.maxWidth,
                alignSelf: "center",
                gap: 6,
              }}
            >
              {footer}
            </View>
          </View>
        )}
        {showTabs && (
          <NavigationBar
            tabs={tabs}
            activeRoute={activeTab}
            onSelect={navigate}
          />
        )}
        <Drawer
          title="Menú Laundry"
          visible={focused && drawer}
          onClose={() => setDrawer(false)}
        >
          <Logo />
          <View
            style={{
              backgroundColor: colors.soft,
              padding: 16,
              borderRadius: 16,
              gap: 4,
            }}
          >
            <Icon name="person-circle-outline" size={36} />
            <Text style={ui.subtitle}>{user.name}</Text>
            <Body>{isClient ? "Cliente" : "Chofer"}</Body>
            <Body muted>{user.email}</Body>
          </View>
          {tabs.map((tab) => (
            <ListItem
              key={tab.route}
              title={tab.label}
              icon={tab.icon}
              onPress={() => navigate(tab.route)}
            />
          ))}
          {isClient && (
            <>
              <ListItem
                title="Billetera Laundry"
                icon="wallet-outline"
                onPress={() => navigate("ClientWallet")}
              />
              <ListItem
                title="Direcciones guardadas"
                icon="location-outline"
                onPress={() => navigate("ClientAddresses")}
              />
              <ListItem
                title="Ayuda y soporte"
                icon="help-circle-outline"
                onPress={() => navigate("ClientSupport")}
              />
            </>
          )}
          <Accordion title="Herramientas de demostración">
            <Body muted>Opciones exclusivas del MVP local.</Body>
            <Button
              label={
                isClient ? "Cambiar a chofer demo" : "Cambiar a cliente demo"
              }
              secondary
              onPress={() => {
                setDrawer(false);
                execute((r) => r.demoLogin(isClient ? "DRIVER" : "CLIENT"));
              }}
            />
            <Button
              label="Restablecer datos demo"
              secondary
              onPress={() => {
                setDrawer(false);
                setResetConfirm(true);
              }}
            />
            {__DEV__ && (
              <Button
                label="Catálogo de componentes"
                secondary
                onPress={() => {
                  setDrawer(false);
                  setCatalog(true);
                }}
              />
            )}
          </Accordion>
          <Button
            label="Cerrar sesión"
            icon="log-out-outline"
            variant="ghost"
            onPress={() => {
              setDrawer(false);
              execute((r) => r.logout());
            }}
          />
        </Drawer>
        {__DEV__ && (
          <ComponentCatalog
            visible={focused && catalog}
            onClose={() => setCatalog(false)}
          />
        )}
        <ConfirmDialog
          title="Restablecer demo"
          visible={focused && resetConfirm}
          onClose={() => setResetConfirm(false)}
          footer={
            <>
              <Button
                label="Restablecer demo"
                variant="danger"
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
            </>
          }
        >
          <Body>
            Se reemplazarán los pedidos, cuentas, saldo y mensajes locales por
            los ejemplos iniciales.
          </Body>
        </ConfirmDialog>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
