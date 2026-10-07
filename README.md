# LaundryApp

Aplicación en React Native 0.86.3, TypeScript y Expo SDK 57. Conserva las 30 rutas, los dos roles móviles, el catálogo, los estados y los escenarios migrados del prototipo. La [matriz de migración y guía del MVP](docs/MVP_NUEVO_FLUJO.md) documenta cada pantalla, acción y recorrido.

## Ejecutar

Requiere Node.js 22.13 o superior y npm. En PowerShell usa los ejecutables `.cmd` si la política del equipo bloquea los scripts `.ps1`.

```powershell
cd C:\LaundryCleanFresh\LaundryApp
npm.cmd ci
npx.cmd expo start
```

`npm.cmd start` ejecuta el mismo comando. Abre el QR con Expo Go compatible con SDK 57 o pulsa `a` para un emulador Android configurado. `npm.cmd run android` abre Expo en Android; `npm.cmd run web` abre la variante de navegador. Puedes obtener la versión de Expo Go correspondiente desde [Expo Go](https://expo.dev/go); consulta la [guía oficial de compatibilidad](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).

En una instalación nueva, el inicio usa el cliente demo igual que el prototipo. El menú lateral permite cambiar de rol demo y cerrar sesión. El inicio de sesión valida estas cuentas con contraseña `123456`:

| Rol     | Correo                          |
| ------- | ------------------------------- |
| Cliente | maria.torres@gmail.com          |
| Chofer  | carlos.mendoza@laundryfresh.com |

Desde el login también puedes registrar un cliente y recorrer documento, selfie, revisión pendiente, rechazo y reenvío. El acceso «Chofer con contraseña temporal» permite probar el cambio obligatorio de contraseña.

## Alcance del MVP

Los datos se guardan en AsyncStorage en este dispositivo: sesión, cuentas, identidad, solicitudes, agenda, transferencias, cargos, direcciones, facturación, saldo, puntos, canjes, membresía, notificaciones y chat. Las fotos seleccionadas o capturadas se copian a los documentos de la app para sobrevivir a su cierre. La demo permite probar la verificación con archivos simulados identificados explícitamente, representados con íconos.

Los pagos, la revisión KYC y las operaciones de planta son simulaciones locales, como en el prototipo. No hay sincronización con LaundryWeb, otros dispositivos o un servidor. El mapa muestra posiciones y recorrido simulados; Google Maps y Waze calculan la navegación al abrir sus enlaces. Para un APK propio con Google Maps, define `GOOGLE_MAPS_ANDROID_API_KEY` en tu `.env` o en el entorno de EAS: `app.config.ts` incorpora esa clave a la configuración nativa. `.env.example` documenta la variable; restringe la clave a Maps SDK for Android y a la firma de tu aplicación. En Expo Go se utiliza su configuración de mapas.

La agenda conserva los cupos y agrega fechas de la siguiente semana al abrir la app o volver al primer plano. Las reglas de cambio y cancelación usan un corte de 60 minutos; la cancelación tardía genera un cargo de $5 que impide crear solicitudes hasta pagarlo. El saldo insuficiente y los códigos incorrectos muestran errores sin aplicar cambios parciales.

El perfil con nombre, rol y correo se muestra únicamente en el menú lateral. La interfaz conserva los logos oficiales y usa íconos para personas, documentos y evidencias. El botón de restablecer demo del header y los controles de simulación son exclusivos del MVP.

## Verificar

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run doctor
npm.cmd run export:android
npm.cmd run export:web
npm.cmd run test:ui
```

Las pruebas de interfaz usan el export web y Microsoft Edge. Establece `PLAYWRIGHT_CHANNEL=chrome` para Chrome, o configura un navegador de Playwright instalado. `npm.cmd run preview:mvp` sirve el export en `http://127.0.0.1:8097`.

`eas.json` incluye perfiles de APK de prueba y AAB de producción. Para generar un APK con una cuenta Expo configurada:

```powershell
npx.cmd eas-cli build --platform android --profile preview
```

El identificador Android se conserva: `com.aistudio.applet.mpsvkf`. La firma y las credenciales de publicación se configuran en EAS y permanecen fuera de Git. La exportación de Metro verifica el bundle Android; no sustituye la prueba en un dispositivo ni la compilación del APK.

## Repositorio

El punto de entrada es `index.js` → `App.tsx`. `src/domain` contiene el dominio migrado, `src/store` la persistencia, `src/screens` las pantallas y `src/components` los controles reutilizables. El registro de navegación vive en `src/navigation/routes.ts`, `src/navigation/MainTabs.tsx` y `App.tsx`.

Las secciones principales usan pestañas persistentes: cambiar de sección conserva sus filtros y posición sin agregar pantallas al historial. Solicitar, detalles, mapas y confirmaciones usan una pila separada con transiciones de fundido. Los accesos del menú vuelven a la pestaña existente; regresar desde seguimiento reutiliza el detalle del mismo pedido. En Android, «Atrás» desde una pestaña secundaria vuelve a Inicio o Mi ruta.

Esta estructura usa el [navegador oficial de pestañas](https://reactnavigation.org/docs/bottom-tab-navigator/) y la [navegación anidada de React Navigation](https://reactnavigation.org/docs/nesting-navigators/).

La estructura contiene únicamente el proyecto React Native con Expo. Se eliminaron el código Kotlin original, `app/`, `gradle/`, `.gradle/` y los archivos raíz del proyecto Android Studio. La configuración Android de Expo en `app.json`, `app.config.ts` y `eas.json` permite ejecutar y compilar la aplicación para esa plataforma.

`.gitignore` excluye `.env`, credenciales, cachés, dependencias, carpetas nativas generadas por Expo, artefactos de Gradle, exportaciones, APK/AAB y resultados de pruebas. `package-lock.json`, logos, configuración Expo, documentación y pruebas forman parte del proyecto. Los cambios de lógica se realizan en `src/domain`.
