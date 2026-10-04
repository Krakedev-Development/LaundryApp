# Mapbox, Expo y escenarios locales

## Configurar

Copiar .env.example a .env. EXPO_PUBLIC_GEO_MODE=demo permite recorrer la demo sin credenciales; las distancias y llegadas se identifican como simuladas. Para Maps/Directions/Geocoding reales, configurar EXPO_PUBLIC_MAPBOX_TOKEN y EXPO_PUBLIC_GEO_MODE=mapbox.

El token móvil debe ser público, dedicado y sin restricciones de URL. Nunca usar tokens secretos. Las variables EXPO_PUBLIC quedan visibles en el cliente. Habilitar geocodificación permanente en la cuenta antes de activar EXPO_PUBLIC_MAPBOX_PERMANENT_GEOCODING=true; los resultados destinados a guardarse se solicitan con permanent=true. La entrada manual y los pines de demostración siguen disponibles sin esa modalidad.

## Android e iOS

@rnmapbox/maps requiere código nativo. Expo Go no proporciona el mapa principal. La app muestra un mensaje de desarrollo si se abre allí; el flujo soportado utiliza una compilación propia.

- npm run android: compilar y ejecutar con Android SDK, JDK y dispositivo/emulador configurados.
- npm run ios: compilar y ejecutar en macOS con Xcode.
- npm run start:dev: iniciar Metro para la compilación de desarrollo.
- EAS: configurar la cuenta/proyecto Expo y ejecutar eas build --profile development --platform android o ios. eas.json incluye perfiles development y preview. Estas compilaciones remotas no se lanzan automáticamente.
- npm run web conserva una vista textual para pruebas de los flujos; el mapa nativo principal es Android/iOS y no utiliza WebView.

La exportación Expo de bundles Android/iOS verifica Metro/Hermes; no reemplaza la compilación de Gradle/Xcode ni las pruebas de dispositivo.

Referencias:

- https://rnmapbox.github.io/docs/install
- https://docs.expo.dev/develop/development-builds/introduction/
- https://docs.mapbox.com/api/search/geocoding/

## Recorrido

Conservar las cuentas de demostración del README. Crear un pedido como Sofía, con dos direcciones cubiertas y pin confirmado. El repositorio local selecciona la sede por zona de recogida. Cambiar a la cuenta del chofer correspondiente en la misma instalación para operar el pedido.

El despacho y la planta se simulan localmente cada doce segundos para completar el escenario independiente de Web. El chofer consulta ruta y destino contextual, habilita ubicación, marca llegada, confirma prendas, llega a planta y realiza la entrega asignada. El ciclo de planta también cierra pedidos entregados.

El movimiento se simula desde un proveedor central de la instancia App, cada tres segundos, y se detiene por etapa/desconexión. Tracking de Cliente muestra chofer, vehículo, placa, ruta vial disponible y llegada simulada. EXPO_PUBLIC_TRACKING_MODE=mock es el modo implementado de esta entrega; device y backend quedan para una fase posterior. No existe tracking de fondo.

Navegación externa se delega a Google Maps, Apple Maps o Waze. Las confirmaciones siguen las reglas existentes; las rutas no confirman automáticamente una llegada ni una entrega.

## Cobertura y datos

Samborondón utiliza tres polígonos de demostración. Los bordes pertenecen al primer polígono activo que coincide. Se validan recogida y entrega antes de crear pedido o cobrar; la sede corresponde al pin de recogida. Se permite que las direcciones sean distintas.

Los datos antiguos se migran sin borrar balances, pedidos ni sesiones. Las coordenadas elegidas se conservan; no se geocodifica de nuevo el texto al operar un pedido.

Las aplicaciones no se sincronizan. node scripts/sync-demo-seed.cjs prepara datos iniciales equivalentes desde LaundryWeb, conservando IDs y precios; no modifica datos de instalaciones abiertas.

## Validar

- npm run typecheck
- npm test
- npm run test:ui
- npx expo config --type prebuild
- npx expo export --platform all --output-dir dist-geo

En Windows con Edge instalado y sin Chromium de Playwright, definir PLAYWRIGHT_CHANNEL=msedge para UI. Los tests cubren el ciclo local, autorización, pagos, cobertura, conservación de pines y los contratos geoespaciales.

Aún se deben validar permisos y mapas reales en Android e iOS con un token autorizado. Las credenciales Mapbox/Expo/Apple y los dispositivos no se incluyen en el repositorio.

Para comprobar UI sobre una exportación estable, ejecutar primero el export anterior y definir EXPO_UI_STATIC=true antes de npm run test:ui. Ese modo sirve dist-geo en localhost:8084 y evita recargas de Metro durante el recorrido.

Validación realizada: revisión de tipos, 26 pruebas de dominio/geo, exportaciones Web/Android/iOS y los cuatro recorridos UI en Edge. No se generaron APK/IPA; faltan Android SDK y entorno macOS/Xcode en este equipo para verificar el enlace nativo y los mapas en dispositivos.
