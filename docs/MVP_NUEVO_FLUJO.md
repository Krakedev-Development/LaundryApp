# Flujo ampliado de LaundryApp

La app amplía la lógica base actual, sin restaurar los commits revertidos. Los pedidos originales, usuarios, saldo y puntos se conservan. El nuevo dominio maneja cuatro modalidades, pesaje, ajustes, agenda, códigos de transferencia y rutas sobre el mismo pedido.

La [guía completa del MVP](../../LaundryWeb/docs/MVP_NUEVO_FLUJO.md) describe cuentas, recorrido de demostración, configuración, decisiones pendientes y validación.

```powershell
npx.cmd expo start --clear
```

No se requiere un script especial de LAN ni se agregó una dependencia de development build para mostrar mapas. La prueba física requiere un teléfono con Expo Go compatible con el SDK del proyecto y conexión al equipo que ejecuta Metro.

Las cuentas del login tienen contraseña `123456`. Cliente demo: `cliente@demo.laundry`; chofer demo: `chofer@demo.laundry`; administrador: `admin@test.com`; supervisor: `supervisor@demo.laundry`. Las cuentas anteriores `cliente@test.com` y `chofer@test.com` siguen disponibles.

Para demostrar un ciclo completo, cambiar entre cuentas en el mismo dispositivo. La app persiste datos locales; no sincroniza con LaundryWeb, otros teléfonos ni un backend. Pagos, posición simulada y mensajes son demostraciones locales.

Ejecutar `npm.cmd run typecheck` para revisar tipos. Los tests del dominio y de persistencia se ejecutan desde LaundryWeb con `npm.cmd test`; también comprueban que las copias compartidas coincidan. `npm.cmd run domain:sync` en LaundryWeb mantiene el dominio de esta app actualizado sin tocar datos de usuarios.
