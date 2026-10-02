# 🧺 Laundry Clean & Fresh - Versión React Native (Expo)

Esta carpeta contiene la **migración completa de la aplicación móvil a React Native con TypeScript y Expo**, lista para ejecutarse tanto en **iOS** como en **Android**.

---

## 🚀 Cómo ejecutar esta app en tu computadora

### 1. Requisitos previos
* [Node.js](https://nodejs.org/) (versión 22.13.0 o superior; se recomienda Node 22 LTS).
* La app [Expo Go](https://expo.dev/go) instalada en tu teléfono físico (iPhone o Android), o un simulador (Xcode / Android Studio).

### 2. Instalación y arranque
Abre una terminal en esta carpeta:
```bash
cd LaundryApp
npm install
npx expo start --clear
```

### Compatibilidad y diagnóstico

Este proyecto usa **Expo SDK 57**, React 19.2, React Native 0.86 y React Navigation 7. Usa una versión de Expo Go compatible con SDK 57: https://expo.dev/go. La versión instalada en el teléfono debe coincidir con el SDK del proyecto.

Después de actualizar, detén cualquier servidor Expo anterior y reinicia con caché limpia:
```bash
npm install
npm run start:lan -- --clear
```

Para comprobar las dependencias y los tipos:
```bash
npx expo install --check
npx expo-doctor
npm run typecheck
```

El teléfono y la computadora deben estar en la misma red. El QR debe anunciar la IP Wi-Fi de la computadora, nunca `127.0.0.1` ni `localhost`. Si Expo selecciona una interfaz virtual, fuerza la IP Wi-Fi en PowerShell (reemplaza la IP por la actual de tu computadora):
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.100.151"
npm run start:lan -- --clear
```

Desde el teléfono, abre `http://<IP-WIFI>:8081/status`: debe responder `packager-status:running`. Si no responde, revisa el permiso de Red local de Expo Go en iOS, el firewall de Windows y el aislamiento de clientes Wi-Fi. Para probar con un túnel, elimina primero cualquier IP forzada:
```powershell
Remove-Item Env:REACT_NATIVE_PACKAGER_HOSTNAME -ErrorAction SilentlyContinue
npm run start:tunnel -- --clear
```

Para abrir web con caché limpia:
```bash
npm run web -- --clear
```

Las dependencias nativas están alineadas con SDK 57. Actualízalas con `npx expo install` para conservar versiones compatibles. SDK 57 utiliza obligatoriamente la nueva arquitectura.

### 3. Visualización
* **En tu teléfono físico:** Escanea con tu cámara (iOS) o la app Expo Go (Android) el código QR que aparecerá en tu terminal.
* **En el navegador web:** Presiona la tecla `w`.
* **En Android Emulator local:** Presiona la tecla `a`.
* **En iOS Simulator (Mac):** Presiona la tecla `i`.

---

## 📂 Arquitectura del Proyecto

```
LaundryApp/
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
