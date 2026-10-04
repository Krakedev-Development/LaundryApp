# Laundry Clean & Fresh · Prototipo móvil

Aplicación Expo SDK 57 con TypeScript y Expo Router para cliente y conductor. Los dos roles trabajan sobre los mismos pedidos en una demo persistente. El rol se obtiene de la cuenta, sin selector de rol ni cambios de identidad durante la sesión.

## Ejecutar

Requiere Node.js 22.13 o superior y una compilación de desarrollo Expo SDK 57. Mapbox nativo requiere Android SDK/JDK para Android o macOS/Xcode para iOS. Consulta [configuración geoespacial](GEO-MVP.md).

```bash
cd LaundryApp
npm ci
npm run android
# En macOS: npm run ios
# Después de instalar la compilación: npm run start:lan -- --clear
```

Abre la compilación de desarrollo instalada. Expo Go muestra un aviso cuando se intenta abrir el mapa; no incluye las dependencias nativas de Mapbox. El teléfono y el equipo deben estar en la misma red. Para navegador: `npm run web`. El servidor debe anunciar la IP Wi-Fi, no localhost. Si Expo elige una interfaz virtual, configura `REACT_NATIVE_PACKAGER_HOSTNAME` con la IP Wi-Fi actual. Para túnel: `npm run start:tunnel -- --clear`.

## Cuentas de demostración

La contraseña inicial es **Laundry2026!**, salvo la cuenta con contraseña temporal. El botón «Cuentas de demostración» del login permite rellenar credenciales.

- **nuevo@laundryfresh.com**: Sofía Fresh, cliente verificado sin pedidos, billetera de $30.
- **maria.torres@gmail.com**: María Torres, cliente con pedidos, plan Premium, billetera, promociones y puntos.
- **diego.valdivia@laundryweb.com**: Diego Valdivia, conductor disponible de FAC-02. El despacho simulado elige un conductor elegible de la sede.
- **mateo.quispe@laundryweb.com**: Mateo Quispe, conductor con servicio de recogida activo.
- **javier.arriola@laundryweb.com**: Javier Arriola, conductor con entrega activa.
- **carlos.ruiz@laundryweb.com**: Carlos Ruiz, contraseña **Temporal2026!**. Debe cambiarla antes de operar.

También hay cuentas pendientes y rechazadas en el panel de demostración. Los datos de catálogo, clientes, plantas, conductores, promociones y pedidos iniciales provienen de `LaundryWeb/src/services/mockData.ts`, conservando sus IDs y precios en `src/services/laundryWebSeed.json`.

## Recorrer el prototipo

1. Registra una cuenta, adjunta documento y selfie, envía KYC y consulta «Ver estado» para simular la revisión. Una cuenta pendiente o rechazada no puede crear pedidos ni acceder a las rutas operativas del cliente.
2. Para un pedido inmediato de prueba, entra como Sofía. Agrega tres camisas, un extra y programa recogida/entrega con dirección, pin y franjas disponibles. El asistente tiene cinco pasos. Confirma el pago con billetera o tarjeta de prueba.
3. Abre el pedido creado: mantiene ID, prendas, importes, direcciones, pago y timeline. Cerrar y abrir la app conserva los cambios. Consulta el conductor asignado en el seguimiento, cierra sesión y entra con su cuenta de demo para operar ese mismo pedido.
4. El despacho simulado se ejecuta cada 12 segundos y asigna tareas a conductores disponibles de la planta. Habilita ubicación al iniciar navegación, marca llegada, verifica cantidad y confirma recogida. «Ir a planta» avanza el estado; confirma la llegada a planta.
5. La simulación de LaundryWeb avanza procesamiento, calidad, preparación y programación de entrega en cuatro ciclos de 12 segundos. El conductor recibe una nueva asignación de entrega sobre el mismo pedido. Registra llegada, destinatario, relación y confirmación para entregarlo.
6. Regresa como cliente para ver entrega, destinatario, timeline y puntos. El conductor puede consultar su etapa completada en Historial.

Si otro conductor disponible recibe la entrega, consulta su cuenta de demo: las asignaciones pertenecen a su conductor y no se exponen a los demás.

## Funciones incluidas

- Registro, login, recuperación simulada, KYC y cambio obligatorio de contraseña temporal.
- Inicio, pedidos activos/históricos, detalle y asistente de solicitud con edición, catálogo, extras, horarios y validaciones.
- Pago atómico e idempotente, billetera con movimientos, recargas y tarjetas de prueba. 4242 aprueba; 0002 simula rechazo. No se almacena PAN ni CVV.
- Promociones con vigencia, compra mínima, alcance por servicio y límites; membresías con descuentos y recogidas semanales.
- Ledger de puntos, reserva de puntos para canjes pendientes y aplicación única de beneficios aprobados.
- Direcciones guardadas con selección de pin, datos personales/fiscales, seguridad, preferencias, notificaciones y soporte simulado.
- Ruta y servicios del conductor, acciones según estado, recogida con discrepancias/incidencias y foto opcional, entrega con destinatario obligatorio e historial.
- Seguimiento y chat contextual entre cliente y conductor de la etapa actual; ETA y ruta simuladas.
- Estado sin conexión, operaciones logísticas/mensajes pendientes y sincronización idempotente. Desde Soporte se puede simular desconexión. Crear pedidos, recargar y canjear requieren conexión.

## Datos y arquitectura

- `src/app`: rutas y layouts de Expo Router con barreras por rol, KYC y contraseña.
- `src/features`: pantallas agrupadas por función.
- `src/domain`: modelos comunes, precios/validaciones y motor transaccional de pedidos, logística, pagos y puntos.
- `src/services`: datos compartidos de demo, fachadas de repositorios y almacenamiento seguro.
- `src/store/AppStore.tsx`: hidratación, estado reactivo, persistencia y simulaciones de red/despacho/planta.
- `src/components` y `src/theme`: componentes accesibles y sistema visual centralizado.

AsyncStorage conserva datos y eventos de la demo. En iOS/Android, SecureStore conserva sesión, hashes de credenciales y referencias locales de evidencia KYC. En web, la sesión/referencias duran la pestaña y los hashes de credenciales se guardan localmente. La autenticación local es exclusiva del prototipo; una implementación real debe usar el backend y tokens.

Los mapas nativos utilizan @rnmapbox/maps, con pines, cobertura y rutas de Directions. Copia .env.example y configura un token público Mapbox para habilitar mapas y consultas reales. Sin credenciales se conservan direcciones y pines preparados, y un recorrido local identificado como simulación. La búsqueda usa Geocoding v6, con persistencia permanente habilitada por la cuenta para guardar resultados. La ubicación y cámara se solicitan cuando la función las necesita.

Esta demo no sincroniza instalaciones diferentes ni escribe en LaundryWeb. Comparte su dominio y una instantánea inicial; backend, pasarela bancaria, notificaciones push, revisión administrativa remota y tracking remoto en vivo quedan para una siguiente fase. La geocodificación, Directions y Matrix ya están integradas detrás de GeoProvider. El chat y soporte son locales, la navegación externa abre Google Maps, Apple Maps o Waze.

## Verificación

```bash
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform all
```

Las pruebas de dominio cubren precios, KYC, pagos sin duplicados, permisos, privacidad de asignaciones, recogida/planta/entrega, puntos y sincronización. Las pruebas de interfaz usan Playwright; en Windows con Chrome instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:ui
```

En CI, instala el navegador con `npx playwright install chromium`. Capturas, trazas, reportes, exportaciones, dependencias, cachés, archivos nativos generados y variables locales están en `.gitignore`. Solo se incluyen código, lockfile, configuración pública, datos ficticios y logos pequeños necesarios para la app.
