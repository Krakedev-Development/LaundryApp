# LaundryApp

App exclusiva para clientes, con React Native 0.86.3, TypeScript y Expo SDK 57. Se conservan el diseño, el header con logo, la navegación inferior y las reglas vigentes del cliente.

## Ejecutar

Requiere Node.js 22.13 o superior y pnpm. En PowerShell usa `pnpm.cmd` si la política del equipo bloquea scripts `.ps1`.

```powershell
cd C:\LaundryCleanFresh\LaundryApp
pnpm install --frozen-lockfile
pnpm start
```

`pnpm start` ejecuta Expo en su puerto habitual, 8081. `pnpm run android`, `pnpm run ios` y `pnpm run web` abren la plataforma correspondiente.

La compatibilidad con Expo Go depende del SDK instalado. El proyecto mantiene su identidad nativa `com.aistudio.applet.mpsvkf`, sus plugins y el flujo administrado de Expo. `.env.example` documenta la clave opcional de Google Maps para una compilación Android propia. Los proyectos nativos generados y las credenciales quedan en `.gitignore`.

## Acceso y registro

La instalación nueva abre el cliente demo, como antes. Desde Perfil puedes cerrar sesión. El login mantiene el acceso rápido «Cliente demo» y el registro de clientes. La cuenta demo es `maria.torres@gmail.com`, contraseña `123456`.

El registro conserva documento, selfie, revisión pendiente, rechazo y reenvío.

El contrato local `@laundry/mobile-auth` y los componentes del login son compartidos y genéricos. La sesión y las cuentas de LaundryApp admiten exclusivamente `CLIENT`. El acceso demo del cliente no recibe roles y el registro mantiene su verificación. `pnpm run check:shared-login` comprueba el contrato y los componentes compartidos cuando están presentes ambos repositorios.

## Flujo conservado

Se mantienen inicio, solicitudes activas/historial, nueva solicitud, agenda, prendas/extras, confirmación, detalle, seguimiento y chat. Perfil conserva direcciones, facturación, seguridad, ayuda, notificaciones, métodos de pago, billetera, promociones, recompensas y membresía.

Las dos modalidades son domicilio completo (`HOME_HOME`: recogida y entrega en domicilio) y pick up (`HOME_STORE`: recogida en domicilio y retiro en sede). Se conservan los cupos, el cobro por prendas o peso, los ajustes, el corte de 60 minutos para cambios/cancelaciones y el cargo de cancelación tardía de $5.

Los datos se guardan en AsyncStorage en este dispositivo: sesión, cuentas de cliente, identidad, solicitudes, agenda, transferencias, cargos, direcciones, facturación, saldo, puntos, canjes, membresía, notificaciones y chat. La clave `laundry.native-migration.v1` permanece igual. Las fotos seleccionadas o capturadas conservan su almacenamiento en documentos de la app.

Al cargar una instalación anterior, se retiran las cuentas ajenas al cliente y el antiguo estado operativo global y se cierra cualquier sesión ajena al cliente. Se conservan los datos, saldos, mensajes y constancias del cliente, además del contacto del chofer que necesita el seguimiento.

El MVP sigue siendo local. Los pagos y la revisión KYC son simulaciones. Los escenarios locales contienen estados operativos recibidos para consultar el seguimiento y las decisiones pendientes del cliente. No existe sincronización entre LaundryApp, LaundryDriver y LaundryWeb ni se agregó backend en esta separación.

El [alcance de la aplicación cliente](docs/ROLE_SPLIT.md) describe sus responsabilidades y compatibilidad de datos. La [matriz funcional](docs/MVP_NUEVO_FLUJO.md), la [verificación UX](docs/UX_AUDIT.md) y el [Design System](docs/DESIGN_SYSTEM.md) documentan el flujo y el diseño actuales.

## Verificar

```powershell
pnpm run typecheck
pnpm test
pnpm run check:shared-login
pnpm run export:android
pnpm run export:web
pnpm run test:ui
```

Las pruebas de interfaz usan el export web y Microsoft Edge. `pnpm run preview:mvp` sirve el export en `http://127.0.0.1:8097`. Los builds, dependencias, archivos privados, capturas y cachés quedan excluidos por `.gitignore`.

`eas.json` conserva los perfiles existentes para compilaciones de prueba y producción.
