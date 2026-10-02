# 🧺 Laundry Clean & Fresh - Versión React Native (Expo)

Esta carpeta contiene la **migración completa de la aplicación móvil a React Native con TypeScript y Expo**, lista para ejecutarse tanto en **iOS** como en **Android**.

---

## 🚀 Cómo ejecutar esta app en tu computadora

### 1. Requisitos previos
* [Node.js](https://nodejs.org/) (versión 18 o 20+ recomendada).
* La app [Expo Go](https://expo.dev/go) instalada en tu teléfono físico (iPhone o Android), o un simulador (Xcode / Android Studio).

### 2. Instalación y arranque
Abre una terminal en esta carpeta:
```bash
cd react-native-app
npm install
npx expo start
```

### 3. Visualización
* **En tu teléfono físico:** Escanea con tu cámara (iOS) o la app Expo Go (Android) el código QR que aparecerá en tu terminal.
* **En el navegador web:** Presiona la tecla `w`.
* **En Android Emulator local:** Presiona la tecla `a`.
* **En iOS Simulator (Mac):** Presiona la tecla `i`.

---

## 📂 Arquitectura del Proyecto

```
react-native-app/
├── App.tsx                     # Punto de entrada con Providers y StatusBar
├── app.json                    # Configuración de Expo (nombre, íconos, bundle ID)
├── package.json                # Dependencias (React Navigation, Expo, Vector Icons)
├── tsconfig.json               # Configuración TypeScript
└── src/
    ├── types/                  # Modelos de datos TypeScript (Order, Customer, Driver, Status)
    ├── theme/                  # Paleta de colores M3 (Primary Sky, Teal, Status)
    ├── store/                  # Estado reactivo global (LaundryStore context)
    ├── components/             # StatusBadge, OrderTimeline, Cards reutilizables
    ├── navigation/             # RootNavigator (Stack) + ClientTabs + DriverTabs
    └── screens/
        ├── auth/               # Login con selector de rol y Validación KYC
        ├── client/             # Inicio, Asistente de Nueva Orden (4 pasos),
        │                       # Seguimiento en vivo, Chat en tiempo real,
        │                       # Billetera & Puntos, Perfil
        └── driver/             # Dashboard de ruta, Selector de disponibilidad,
                                # Confirmación de recogida (conteo prendas) y entrega
```

---

## 🔄 Equivalencias con la versión de Android Nativo (Kotlin)

| Módulo Kotlin / Compose | Implementación en este proyecto React Native |
| :--- | :--- |
| `LaundryRepository.kt` | `src/store/LaundryStore.tsx` (Context API + Hooks) |
| `OrderModels.kt` / `OrderStatus.kt` | `src/types/index.ts` (Tipos estrictos de TS) |
| `AppScreen.kt` | `src/navigation/RootNavigator.tsx` (@react-navigation) |
| `NewOrderWizardScreen.kt` | `src/screens/client/NewOrderWizardScreen.tsx` |
| `ClientTrackingAndChat.kt` | `ClientTrackingScreen.tsx` + `ClientChatScreen.tsx` |
| `DriverConfirmationsAndMap.kt` | `DriverConfirmationsScreen.tsx` + `DriverRouteScreen.tsx` |
| `ClientBenefitsAndWallet.kt` | `ClientWalletScreen.tsx` |

---

## 💡 Alternador de Roles Rápido
En la parte inferior de la pantalla encontrarás una barra flotante para alternar al instante entre **👤 Modo Cliente** y **🚚 Modo Chofer** para probar todos los flujos de recogida y entrega sin tener que cerrar sesión.
