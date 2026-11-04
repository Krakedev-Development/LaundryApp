# Verificación UX del cliente

## Diseño y navegación

Se conserva el diseño actual: logos oficiales, header, navegación inferior, colores, tipografía, tarjetas y formularios. El login contiene acceso del cliente y registro. El perfil conserva nombre y correo de la cuenta activa.

Las pestañas mantienen sus filtros y estado. Los detalles reutilizan la instancia de la solicitud. El asistente conserva Entrada, Salida, Prendas, Extras y Confirmación, con validación de pasos y acciones al pie.

## Recorridos de validación

- Login, registro, documento, selfie, revisión/rechazo y reenvío.
- Solicitudes activas e historial, búsqueda, modalidades y estados vacíos.
- Domicilio completo y pick up con recogida a domicilio.
- Direcciones, calendario, cupos, cambios, cancelación y cargo tardío.
- Pago por prendas, peso certificado recibido y ajustes pendientes del cliente.
- Billetera, recargas, tarjetas y cuentas bancarias independientes.
- Perfil, puntos, membresía, promociones y recompensas.
- Seguimiento, códigos del cliente, chat, notificaciones y soporte.
- Persistencia y recuperación de datos anteriores sin estado operativo ajeno.

La app del cliente no presenta controles de disponibilidad, ruta, recogida, entrega, asignación, planta ni contraseña temporal. Los datos externos se muestran como información de su solicitud.

## Accesibilidad

Se conservan nombres accesibles, objetivos táctiles, estados seleccionados, errores contextuales, paneles con cierre, safe areas y preferencia de movimiento reducido. Las comprobaciones web usan tamaños 320×640, 412×915 y 768×1024.

TypeScript, pruebas de dominio, exportaciones Expo y Playwright cubren la verificación automatizada. Cámara, permisos, teclado y accesibilidad nativa requieren revisión en dispositivo.
