# Revisión de lógica de negocio de LaundryApp

La app contiene más lógica que un prototipo visual: calcula precios, valida cobertura, administra ledger y ejecuta transacciones locales de pedido y custodia. La persistencia es local; la revisión evalúa reglas de demo y decisiones que deben formalizarse antes de una operación real.

## 1. Precio, pago y pesaje

El checkout calcula el total antes de confirmar y registra el pago como `PAID` al crear el pedido. La tarifa por sede se declara provisional y por prenda; el modo domicilio aplica cargos/beneficios configurados. Después no hay báscula ni propuesta de ajuste para precios por peso: la planta pasa automáticamente de etapa.

**Definir:** catálogo definitivo por servicio, impuestos, recargos y cuándo se confirma el peso. Si el importe cambia después de recibir la ropa, especificar consentimiento, plazo de respuesta, captura/cobro adicional o devolución. No llamar “pago final” al valor mostrado si se trata de una autorización o estimación.

## 2. Rechazo, cancelación y reembolsos

No hay flujo de cambio de presupuesto porque no existe presupuesto posterior. Tampoco se encontró un recorrido operativo de cancelación y reembolso. Rechazo de tarjeta es solo una simulación previa a creación; recarga es un crédito local.

**Definir:** límites de cancelación por etapa, política de cargos, devolución de saldo y medios de pago, y qué hacer con prendas ya recogidas. Implementar idempotencia y conciliación en servidor antes de operar fondos reales.

## 3. Modalidad y agenda

Existen dos recorridos: domicilio a domicilio y sede a sede. El formulario de sede sustituye las direcciones por las coordenadas de la planta y permite ingreso/retiro al completarse. Cobertura domiciliaria valida ambos extremos y la sede se elige desde datos locales.

**Definir:** horarios reales por zona/sede, cupos por franja y capacidad de procesamiento. Hoy `availableSlots` deriva disponibilidad de la hora actual y una lista fija; no reserva capacidad ni impide competencia de pedidos. Aclarar si se ofrecerán modalidades híbridas más adelante.

## 4. Cobertura y asignación

Las áreas son polígonos de demostración (Samborondón). El punto fronterizo pertenece a la primera zona activa coincidente. La sede de un pedido domiciliario deriva de la cobertura del pin de recogida. La asignación automática filtra sede, zona, capacidad, estado y ubicación no obsoleta, pero no agrupa paradas en rutas ni calcula una carga real por volumen.

**Definir:** límites comerciales aprobados, solapes y excepciones; capacidad por vehículo/peso/volumen; zonas y prioridad de sede; promesa de hora y reasignación ante falta de chofer. Evitar que el dispatch de dispositivo sea autoridad final en producción.

## 5. Prendas, conteo y custodia

Las transferencias tienen código de un solo uso, control de generación, bloqueo, auditoría, sede/actor/etapa y recibo. En ingreso, un conteo distinto crea `intakeHold` y bloquea la simulación de planta; una resolución requiere rol administrador/supervisor local de sede y motivo. El flujo antiguo de recogida por pantalla del chofer puede registrar una discrepancia como incidencia sin usar el mismo `intakeHold`; la transferencia posterior vuelve a registrar conteo en planta.

**Definir:** cuál conteo es contractual, si cada prenda necesita identificación, tratamiento de bultos/lotes, evidencia fotográfica, receptor autorizado, diferencias parciales y procedimientos sin red. Unificar el efecto operacional de discrepancias antes de usar ambos puntos de captura.

## 6. Estado y recorrido

El modelo separa un estado de negocio persistido y hitos de entrada/salida; `operationalStage` deriva lo que muestran pantallas. Esta es una buena dirección para evitar dos máquinas paralelas, aunque la planta automática consume y cambia etapas cada 12 segundos, sin confirmaciones de operario, duración de tratamiento o control de calidad real.

**Definir:** estados terminales y reversibles, quién puede moverlos, qué evento los acredita, y cómo reparar eventos duplicados o fuera de orden. En producción, mover la automatización y transacciones al servidor con historial auditable.

## 7. Membresías, promociones, recompensas y puntos

Promociones validan fechas, mínimo, alcance y límites. Membresía aplica descuento sobre artículos y límite semanal de recogidas; beneficios de recompensa se reservan/consumen usando ledger y marcas idempotentes. Los planes, saldo y reglas son semillas editables/locales. La cuenta de puntos suma importes y usa puntos por dólar configurado.

**Definir:** cómo conviven descuentos y el orden de redondeo, vigencia del saldo y beneficios, cancelaciones/reembolsos, elegibilidad de pedidos parcialmente completados, cambios de plan, vencimiento de recompensas y tratamiento fiscal. Confirmar límites semanales por zona horaria y si las recogidas cuentan por fecha agendada o por servicio efectuado.

## 8. KYC, privacidad y cuentas

La app bloquea pedidos hasta aprobación, pero identidad y revisión son locales; referencias a documentos permanecen en almacenamiento seguro local. Hash local de contraseña y navegación por rol solo son adecuados para demo. Recuperación informa que no envía correo.

**Definir:** necesidad y base de KYC, retención/borrado, acceso, cifrado/transporte y procedimiento de revisión con responsable. En producción autenticar y autorizar en backend; nunca tomar el rol declarado por el cliente como autoridad.

## 9. Incidencias y compensación

Hay incidencias en recogida y retención por discrepancia; no hay un gestor de casos completo ni rutas específicas para prendas dañadas/perdidas, tratamiento fallido o entrega ausente. Chat/soporte no alertan a un agente.

**Definir:** severidad, dueño, SLA de atención, bloqueo generado, evidencia, resolución, compensación y comunicación a cliente. Diferenciar incidencia informativa de retención que impide avanzar.

## 10. Offline y operación distribuida

Se encolan cambios y mensajes de demo y se “sincronizan” localmente al volver la conexión. Pagos, altas de pedidos y canjes piden red, pero no hay servidor que acepte cambios ni resolución de conflicto entre dispositivos.

**Definir:** operaciones seguras offline, fuente autoritativa, claves de idempotencia, orden de eventos y conflictos. Hasta entonces, presentar la cola como simulación y no como entrega garantizada al servidor.

## Prioridad recomendada

1. Definir precio definitivo, pesaje, aprobación y devolución.
2. Formalizar custodia/discrepancias, incidencias y cancelación por etapa.
3. Acordar capacidad, franjas, SLA y despacho/rutas.
4. Aprobar modelo de KYC, pagos, privacidad y notificaciones reales.
5. Trasladar autorizaciones, ledger y estados operativos al backend antes de una operación multi-dispositivo.

La matriz de flujos y los límites técnicos están en [FLUJOS-APP-DEMO.md](FLUJOS-APP-DEMO.md); la propuesta de límites por módulo en [organización](PROPUESTA-ORGANIZACION-MODULOS.md).
