# Alcance exclusivo de LaundryApp

## Responsabilidades del cliente

Login, registro, verificación de identidad, inicio, solicitudes, agenda, pagos, seguimiento, chat, beneficios, perfil, seguridad, direcciones, facturación, notificaciones y soporte.

La cuenta y la sesión solo admiten CLIENT. El acceso demo no recibe un rol. El cambio de contraseña siempre valida la contraseña actual del cliente.

El componente compartido del login recibe contenido adicional por composición. El repositorio del cliente no incluye avisos, cuentas demo, contraseñas temporales ni pantallas operativas de otra aplicación.

## Consulta de la solicitud

El cliente necesita consultar quién recoge o entrega su ropa, contactarlo, ver su posición, leer estados y revisar las transferencias realizadas. `assignedDriver*`, los estados recibidos y los mensajes de otros participantes son datos de consulta de su solicitud. El contrato de transporte conserva sus valores para mantener compatibles pedidos, agenda y constancias guardadas.

La posición se almacena por solicitud en `trackingPosition`. No existe un perfil operativo global, disponibilidad, contador de entregas o modificación de credenciales de otro participante.

El MVP utiliza datos de seguimiento preconfigurados para representar una respuesta del servicio. No dispone de selección de personal, asignación de rutas, confirmación de recogida/entrega, navegación de reparto, pesaje de planta o consumo de custodia.

## Compatibilidad

La clave `laundry.native-migration.v1` y el identificador de la app se conservan. Al cargar datos anteriores se filtran cuentas CLIENT, se cierra una sesión de otro rol y se descarta el antiguo objeto operativo global después de preservar las coordenadas de seguimiento. Los saldos, puntos, pagos, solicitudes y documentos del cliente permanecen.

El proyecto mantiene npm, Expo y almacenamiento local. No incorpora backend ni sincronización entre aplicaciones.
