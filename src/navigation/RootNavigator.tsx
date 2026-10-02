import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { KycScreen } from '../screens/auth/KycScreen';
import { ClientHomeScreen } from '../screens/client/ClientHomeScreen';
import { NewOrderWizardScreen } from '../screens/client/NewOrderWizardScreen';
import { ClientOrdersScreen } from '../screens/client/ClientOrdersScreen';
import { ClientTrackingScreen } from '../screens/client/ClientTrackingScreen';
import { ClientChatScreen } from '../screens/client/ClientChatScreen';
import { ClientWalletScreen } from '../screens/client/ClientWalletScreen';
import { ClientProfileScreen } from '../screens/client/ClientProfileScreen';

import { DriverRouteScreen } from '../screens/driver/DriverRouteScreen';
import { DriverConfirmationsScreen } from '../screens/driver/DriverConfirmationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- CLIENT TABS ---
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '800', color: Colors.text },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Orders') iconName = 'receipt';
          else if (route.name === 'Benefits') iconName = 'wallet';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ClientHomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Orders"
        component={ClientOrdersScreen}
        options={{ title: 'Mis Pedidos' }}
      />
      <Tab.Screen
        name="Benefits"
        component={ClientWalletScreen}
        options={{ title: 'Billetera & Beneficios' }}
      />
      <Tab.Screen
        name="Profile"
        component={ClientProfileScreen}
        options={{ title: 'Mi Cuenta' }}
      />
    </Tab.Navigator>
  );
}

// --- DRIVER TABS ---
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '800', color: Colors.text },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'map';
          if (route.name === 'DriverRoute') iconName = 'navigate';
          else if (route.name === 'DriverOrders') iconName = 'list';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverRoute"
        component={DriverRouteScreen}
        options={{ title: 'Ruta Chofer' }}
      />
      <Tab.Screen
        name="DriverOrders"
        component={ClientOrdersScreen}
        options={{ title: 'Historial Servicios' }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const [currentUserRole, setCurrentUserRole] = useState<'CLIENT' | 'DRIVER' | null>('CLIENT');

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTitleStyle: { fontWeight: '800', color: Colors.text },
          headerTintColor: Colors.primary,
        }}
      >
        {!currentUserRole ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => <LoginScreen {...props} onLogin={(r) => setCurrentUserRole(r)} />}
          </Stack.Screen>
        ) : currentUserRole === 'CLIENT' ? (
          <>
            <Stack.Screen
              name="ClientMain"
              component={ClientTabs}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="NewOrderWizard"
              component={NewOrderWizardScreen}
              options={{ title: 'Nueva Solicitud' }}
            />
            <Stack.Screen
              name="Tracking"
              component={ClientTrackingScreen}
              options={{ title: 'Seguimiento en Vivo' }}
            />
            <Stack.Screen
              name="Chat"
              component={ClientChatScreen}
              options={{ title: 'Chat con Chofer' }}
            />
            <Stack.Screen
              name="KycUpload"
              component={KycScreen}
              options={{ title: 'Validación KYC' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="DriverMain"
              component={DriverTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverConfirm"
              component={DriverConfirmationsScreen}
              options={{ title: 'Confirmación Operativa' }}
            />
            <Stack.Screen
              name="Chat"
              component={ClientChatScreen}
              options={{ title: 'Chat con Cliente' }}
            />
          </>
        )}
      </Stack.Navigator>

      {/* Floating Role Switcher for Demo / Dev Testing */}
      <View style={styles.floatingRoleBar}>
        <TouchableOpacity
          style={[styles.floatingBtn, currentUserRole === 'CLIENT' && styles.floatingBtnActive]}
          onPress={() => setCurrentUserRole('CLIENT')}
        >
          <Text style={[styles.floatingText, currentUserRole === 'CLIENT' && styles.floatingTextActive]}>
            👤 Modo Cliente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingBtn, currentUserRole === 'DRIVER' && styles.floatingBtnActive]}
          onPress={() => setCurrentUserRole('DRIVER')}
        >
          <Text style={[styles.floatingText, currentUserRole === 'DRIVER' && styles.floatingTextActive]}>
            🚚 Modo Chofer
          </Text>
        </TouchableOpacity>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  floatingRoleBar: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    gap: 4,
  },
  floatingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  floatingBtnActive: {
    backgroundColor: Colors.primary,
  },
  floatingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingTextActive: {
    color: '#FFF',
  },
});
