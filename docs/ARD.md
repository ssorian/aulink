# ARD — Aulink

Architecture Requirements Detailed · v0.1 · Arquitectura objetivo para validación.

**Decisión central:** conservar TanStack Start como web/backend y Expo como cliente móvil. La terminal registra primero en SQLite y sincroniza eventos mediante una API HTTP idempotente; PostgreSQL mantiene el estado central. Este diseño implementará los requisitos del [PRD](PRD.md), no describe un producto terminado.

## 1. Contexto y restricciones

Piloto en México para secundaria/preparatoria: 300 alumnos, un turno, una terminal Android y conexión inestable. Aislamiento por institución e identidad por dispositivo desde el inicio; coordinación entre terminales desconectadas es eventual, no inmediata.

```text
Web TanStack Start ───────────┐
Expo · experiencia familia ──┼── API + autorización ── Drizzle/PostgreSQL
Expo · terminal Android ─────┘             │                    │
   cámara/lector → SQLite + outbox         └── worker durable ← outbox central
              ↕ sincronización                         │
                                              push + bandeja familiar
```

No se requiere un backend separado, microservicios ni un proveedor externo de sincronización de bases completas. Las aplicaciones intercambian contratos; no comparten conexiones de base de datos ni código secreto del servidor.

## 2. Estado actual y stack objetivo

| Área | Existente en el repositorio | Objetivo |
| --- | --- | --- |
| Workspace | Bun, `apps/web`, `apps/mobile`, lockfile raíz, linker aislado | Mantener versiones independientes de React por aplicación. |
| Web/backend | TanStack Start/Router, Vite, Nitro | Rutas HTTP para móvil y servicios de dominio reutilizables por web. |
| Datos remotos/formularios | TanStack Query/Form y Zod en web | Incorporarlos en móvil cuando se implemente su uso. |
| Datos centrales | Drizzle, `pg`, configuración PostgreSQL | Migraciones versionadas, restricciones y transacciones tenant-scoped. |
| Autenticación | Better Auth con email/password y cookies Start configurados | Persistencia, permisos, vínculo familiar e integración oficial Expo; verificar cada flujo. |
| Móvil | Expo 58, React Native, Expo Router, Reanimated, `@expo/ui` | Conservar base; una app con experiencias protegidas familia/terminal. |
| Estilos móviles | NativeWind `5.0.0-rc.0`, engine `react-native-css 3.1.0-rc.0` | Tailwind `4.1.18`, configuración CSS-first y revisión antes de actualizar RC. |
| Offline/captura | Aún no implementados | `expo-sqlite`, `expo-camera`, `expo-network`; lector mediante adaptador probado. |
| Sesión/notificaciones | Aún no implementadas en móvil | `expo-secure-store`, Better Auth Expo y `expo-notifications`. |

NativeWind v4 es la línea estable y usa Tailwind 3; se elige v5 RC para cumplir Tailwind 4. Las versiones RC quedan exactas. La validación de bundle no sustituye ensayos en Android real, ni garantiza interop de `className` con todos los componentes de `@expo/ui`.

### Integración de estilos

`apps/mobile/metro.config.js` envuelve Expo con `withNativewind`; `postcss.config.mjs` usa `@tailwindcss/postcss`. `src/global.css` importa theme, preflight y utilities de Tailwind, más `nativewind/theme`; las utilities quedan sin capa conforme a la guía v5. El layout raíz importa CSS una sola vez. `nativewind-env.d.ts` referencia `react-native-css/types`.

La configuración CSS-first usa `@theme`; no crear un `tailwind.config.js` de v3 ni añadir el preset Babel de NativeWind v4. El override raíz limita `lightningcss 1.30.1` a la dependencia de `@expo/metro-config`: fijar solo la dependencia directa móvil no controla el compilador que resuelve el engine. No imponer ese pin globalmente al pipeline web.

## 3. Organización y límites de módulos

Conservar rutas de framework en `apps/web/src/routes/` y `apps/mobile/src/app/`. Mantener esas rutas ligeras; lógica de negocio en `src/modules/<modulo>/`. No crear directorios vacíos preventivamente.

| Módulo | Responsabilidad |
| --- | --- |
| institutions/access | Instituciones, membresías, roles, vínculos familiares y alcance de acceso. |
| school-calendar/enrollment | Ciclos, niveles, grupos, inscripciones, horarios y calendario. |
| credentials/devices | Emisión y revocación de credenciales; autorización y estado de terminales. |
| attendance/sync | Eventos inmutables, outbox local, reconciliación y resumen diario. |
| communications | Avisos, destinatarios, bandeja, lectura y despacho push. |
| conduct/grades | Fases posteriores: visibilidad, evidencias, periodos, escalas y publicaciones. |
| audit | Cambios sensibles, responsables, motivos e identificadores de correlación. |

Código transversal en `src/lib/`, `src/db/`, `src/config/`, `src/components/` o `src/shared/` según propiedad. Los adaptadores de cámara/lector producen una credencial normalizada; no escriben directamente al servidor. Query gestiona caché remota, no la durabilidad de la cola SQLite. Form y Zod gestionan formularios; el servidor vuelve a validar toda entrada.

No existe todavía un workspace `packages/*`. Si se extraen contratos compartidos, agregarlo explícitamente al manifiesto y probar resolución, sin acoplar cliente a Drizzle/`pg` ni a secretos.

## 4. Identidad, autorización y seguridad

- Sesiones familiares y de personal mediante Better Auth; añadir integración Expo con almacenamiento seguro y origen/esquema explícitamente permitido. Cookies web seguras y defensa CSRF donde corresponda.
- Aprovisionar terminal mediante autorización de personal con permiso: conexión inicial, identidad de dispositivo, secreto revocable en SecureStore y ámbito mínimo. No reutilizar una sesión de administrador como credencial permanente del kiosco.
- Cada endpoint deriva el ámbito de usuario/dispositivo autenticado. Un `schoolId` en URL o JSON no concede permisos; verificar membresía, rol, inscripción/vínculo y estado de publicación.
- Revocación se aplica a nuevas operaciones del servidor inmediatamente según validación vigente; no puede borrar datos de una terminal offline de forma instantánea.
- Definir vigencia de autorización offline y renovación online antes del piloto. Caducada esa vigencia, bloquear nuevas capturas y escalar a operación escolar, conservando pendientes. El plazo concreto no está acordado.
- Tras revocar una terminal, no aceptar pendientes como asistencia publicable sin revisión. La recuperación supervisada debe conservar evidencia y permitir regularización auditada por personal autorizado.
- QR aleatorio de alta entropía y formato versionado; no incluir nombre, matrícula ni identificadores secuenciales. Guardar hash del token y comparar contra catálogo local mínimo; evitar tokens crudos en logs.
- El QR estático puede copiarse. La confirmación visual por personal reduce errores, no equivale a verificación biométrica ni autorización de custodia.
- SQLite mínimo y sandbox Android no equivalen a cifrado de base. Proteger dispositivo con bloqueo y política operativa; evaluar cifrado en reposo y respaldo Android antes de almacenar datos reales. Secretos separados en SecureStore.
- Proteger evidencias/archivos mediante almacenamiento privado y acceso autorizado de duración limitada; validar tipo/tamaño y revocar nuevas descargas al retirar permisos.

## 5. Modelo de datos central

Cada entidad escolar usa ID interno estable y `school_id`. Las relaciones deben comprobar pertenencia a la misma escuela mediante claves/constraints compuestas cuando corresponda; no basta con filtrar en la UI.

| Entidad | Relaciones y restricciones principales |
| --- | --- |
| School / Membership | Escuela, zona IANA, estado; usuario ↔ escuela con roles y permisos. |
| AcademicCycle / Group / Schedule / CalendarException | Ciclo, nivel, grado, turno y excepciones por ámbito; historial no sobrescrito. |
| Student / Enrollment | `UNIQUE(school_id, matricula)`; inscripción por alumno/ciclo y pertenencia histórica a grupo. |
| GuardianLink | Usuario ↔ alumno, estado, alcance, verificador y vigencia; invitación de uso controlado. |
| Credential | Alumno, hash único de token, versión, emisión/revocación. La matrícula no cambia al reemplazarla. |
| Device | Escuela, credencial de dispositivo, estado, última conexión, versión de app y configuración. |
| AttendanceEvent | `event_id` global único, dispositivo, secuencia local, credencial, tipo, `occurred_at`, `received_at`, clasificación y versión de política. |
| AttendanceAdjustment / DailyAttendance | Ajustes append-only con motivo/autor; proyección diaria reconstruible con estado provisional o revisado. |
| Announcement / AudienceSnapshot | Borrador/publicación, ámbito y conjunto de destinatarios al publicar; comprobar autorización vigente al consultar. |
| InboxItem / NotificationOutbox / PushAttempt | Aviso lógico único por destinatario y fuente; canal/intentos separados de lectura explícita. |
| ConductReport / Attachment | Categoría, autor, seguimiento, publicación y separación entre información interna y compartida. |
| Subject / TeachingAssignment / EvaluationPeriod / Grade | Materia/grupo/docente/ciclo, escala y periodo; unicidad de calificación según inscripción/materia/periodo e historial de revisiones. |
| AuditEvent | Actor usuario/dispositivo, acción, entidad, motivo, fecha de servidor y correlación; sin tokens ni contenido sensible innecesario. |

Los eventos originales no se editan para corregir asistencia. El resumen diario usa calendario, horarios, ajustes y estado de reconciliación. Una regla provisional de duplicado no destruye evidencia ni debe convertir una entrada en salida.

## 6. Persistencia y sincronización local

### Escritura local

1. Autorizar operación offline con configuración vigente; validar formato y credencial en catálogo local.
2. Aplicar modo explícito y regla de repetición local; generar `eventId` aleatorio y secuencia creciente del dispositivo.
3. En una transacción SQLite insertar evento y fila outbox. Solo después del commit mostrar «Registro guardado».
4. Intentar envío sin bloquear el siguiente escaneo. Sin conexión, conservar pendiente y mostrar su contador.
5. Al recibir resultado, persistir ACK/estado local en transacción. Un cierre antes de guardar ACK causa reenvío seguro con el mismo ID.

Tablas locales objetivo: configuración, catálogo de alumnos/credenciales, eventos, outbox, resultados y cursor de descarga. Versionar el esquema y probar migraciones conservando pendientes. Nunca resetear SQLite para resolver una migración fallida.

### Estados y reintentos

| Estado | Tratamiento |
| --- | --- |
| pending / sending | Enviar con lease temporal; `sending` abandonado tras cierre vuelve a elegible. |
| acknowledged | Servidor confirmó registro y resultado durable; retener según política acordada. |
| rejected / needs_review | Conservar evento, motivo y resultado; revisión o regularización, no reintento infinito ciego. |
| Fallo de red, 429 o 5xx | Backoff exponencial con jitter, límite de lote y respeto de `Retry-After` cuando aplique. |
| 401/403 | Detener envío automático, informar y recuperar autorización sin destruir cola. |

La conectividad del sistema es una pista, no prueba de acceso al servidor. Sincronizar al iniciar, recuperar primer plano, solicitarlo el operador y durante actividad con conectividad. Android puede suspender procesos: no prometer background continuo. Detectar poco espacio/fallo de escritura y no confirmar capturas que no se guardaron.

### Descarga y conflictos

Descargar snapshots/deltas versionados con cursor opaco, paginación y tombstones para bajas/revocaciones. Fijar una versión consistente del snapshot; aplicar todas las páginas en staging y activar catálogo+cursor atómicamente, sin mezclar versiones. Si expira el cursor, descargar snapshot nuevo sin tocar eventos pendientes.

La hora cliente es evidencia no confiable: conservar UTC de lectura, hora UTC de recepción, secuencia local, configuración y diagnóstico de desfase frente a hora servidor. Derivar fecha escolar mediante zona IANA, no zona del teléfono ni offset fijo. Los casos con hora dudosa se revisan; no inventar una hora exacta mientras el equipo estuvo offline.

Entre terminales, distinguir mismo `eventId` (reintento) de eventos diferentes cercanos del mismo alumno (posible duplicado físico). Clasificar y revisar según regla escolar; no prometer exactly-once para escaneos independientes ni borrar entradas legítimas.

## 7. Contratos HTTP objetivo

Prefijo propuesto `/api/v1`; contratos versionados y validación Zod. Límites de lote, fechas, tipos y tamaño se validan antes del procesamiento. Las rutas son propuestas, no endpoints existentes.

| Operación | Contrato |
| --- | --- |
| `POST /devices/enroll` | Personal autorizado aprovisiona equipo; vincula una escuela y entrega credencial limitada mediante canal seguro. |
| `GET /terminal/bootstrap` | Configuración, política offline, versión de catálogo y hora servidor; solo datos necesarios para la terminal. |
| `GET /terminal/catalog?cursor=…` | Snapshot/deltas paginados consistentes, siguiente cursor y bajas. |
| `POST /terminal/attendance/batches` | Lista acotada; resultados por evento tras commit. Un elemento inválido no se oculta tras un ACK global. |
| `GET /family/students` | Hijos con vínculo vigente; sin aceptar selección arbitraria por matrícula. |
| `GET /family/students/:id/attendance` | Rango y cursor; verifica vínculo vigente y devuelve eventos/resúmenes autorizados. |
| `GET /family/inbox` / `POST /family/inbox/:id/read` | Consulta durable y lectura explícita idempotente; autorización vigente por elemento. |
| `POST /school/announcements` | Publicación autorizada con audiencia validada y salida transaccional hacia bandeja/outbox. |

Ejemplo de elemento enviado:

```json
{
  "schemaVersion": 1,
  "eventId": "uuid-aleatorio",
  "localSequence": 123,
  "credentialId": "id-opaco-del-catalogo",
  "kind": "entry",
  "occurredAt": "2026-01-15T13:02:00Z",
  "catalogVersion": "42",
  "policyVersion": "7"
}
```

El dispositivo se deriva de la autenticación, no del JSON. Verificar que la credencial pertenece a su escuela y que el ID de catálogo fue emitido para ese ámbito. Para demostrar presentación offline se define el formato de prueba del token/credencial al implementar; no tratar un ID público como secreto ni prometer autenticidad del portador.

Respuesta por evento: `{ eventId, result, receivedAt, reasonCode? }`, con `accepted`, `duplicate`, `needs_review` o `rejected`. Una restricción única sobre `eventId` y transacción impiden duplicar efectos. Si el mismo ID reaparece con payload distinto, devolver conflicto sin sobrescribir; solo devolver el resultado original al mismo ámbito autorizado, nunca revelar eventos ajenos. Guardar hash canónico de payload y resultado durable.

## 8. Asistencia y notificaciones transaccionales

En la misma transacción central: guardar evento, su resultado idempotente y, solo si es aceptado/publicable, trabajo de comunicación único. La creación de bandeja y destinatarios debe ser recuperable y deduplicada por fuente+destinatario; revisar permisos vigentes antes de entregar o consultar contenido.

Un worker reclama trabajos con lease, registra intentos y reintenta; tras agotar política los deja diagnosticables/reprocesables, no los descarta. Un timeout del proveedor puede dejar entrega incierta: se garantiza idempotencia del aviso lógico, no exactly-once del push. Usar identificador lógico para reducir duplicados visibles cuando el canal lo permita.

Push con contenido mínimo para no exponer información de menores en pantalla bloqueada; el detalle requiere consulta autenticada. Desactivar tokens inválidos. Distinguir creado, envío intentado, proveedor aceptó y usuario leyó. Publicar avisos tras sincronización tardía con hora original y contexto, sin afirmar comunicación en tiempo real durante cortes.

No depender de callbacks en memoria después de responder HTTP. Puede usarse outbox en PostgreSQL y un proceso/cron durable con reclamo transaccional; el proveedor de despliegue debe demostrar esa capacidad antes de producción.

## 9. Operación, recuperación y privacidad

- Separar entornos y secretos; nunca incluir credenciales PostgreSQL o claves push en el bundle móvil. HTTPS obligatorio en producción.
- Migraciones centrales versionadas y ensayadas con rollback operativo/forward-fix; respaldo previo a cambios destructivos. Migraciones móviles no eliminan colas.
- Respaldar PostgreSQL y archivos, restringir acceso y probar restauración. Acordar RPO/RTO, retención, cifrado y eliminación con institución/asesoría legal antes del piloto.
- Exportación supervisada y cifrada de pendientes como procedimiento de contingencia, no botón público ni limpieza automática. Desinstalación/daño del equipo puede perder eventos no enviados.
- Registrar métricas de pendientes/antigüedad por dispositivo, latencia, rechazos, desfases, conflictos y fallos del worker; logs sin QR crudos ni nombres de alumnos.
- La terminal reporta salud cuando conecta; el servidor solo conoce su último estado reportado. Alertar ausencia de heartbeat no demuestra que dejó de capturar offline.
- Preparar runbooks para equipo perdido/revocado, reloj incorrecto, almacenamiento lleno, restauración y notificaciones atrasadas. Acceso de soporte temporal, autorizado y auditado.
- Revisar tratamiento de datos de menores, aviso de privacidad y régimen aplicable a escuela pública/privada en México. No fijar plazos legales ni afirmar cumplimiento sin asesoría.

## 10. Verificación y trazabilidad

| PRD | Área técnica | Prueba requerida |
| --- | --- | --- |
| 01–06, 19 | Tenant/roles/vínculos, inscripciones y calendario | Integración negativa entre escuelas, cambio de ciclo y retiro de tutor. |
| 07–10 | Credenciales, dispositivos y adaptadores | Revocación, provisioning, modo persistente y ensayo lector/cámara Android. |
| 11–15, 18 | SQLite, outbox y API idempotente | 600 eventos offline, kill/reinicio, respuesta perdida, conflicto de payload, dos dispositivos y reloj dudoso. |
| 16–17 | Proyección diaria y ajustes | Eventos tardíos, día inhábil, reingreso y corrección con historial original. |
| 20–21 | Bandeja, audiencia y worker | Reintento, caída después de commit, vínculo revocado, push ausente y lectura explícita. |
| 22–24 | Conducta y calificaciones | Borradores invisibles, notas internas, escala/versiones y corrección auditada. |
| NFR-01–06 | Seguridad y operación | Filtrado de logs, espacio insuficiente, restauración, accesibilidad y medición en dispositivo objetivo. |

Usar tests unitarios de políticas; integración con PostgreSQL real para constraints/transacciones; SQLite real para persistencia y migraciones; pruebas E2E con fallos de red y reinicio. No sustituir estas pruebas por mocks de `fetch` únicamente. La configuración de NativeWind se verifica con PostCSS, compilador CSS nativo y export de Expo; comprobación visual y lector físico quedan como ensayos separados.

## 11. Decisiones abiertas y referencias

Pendientes: hardware exacto, vigencia offline, ventanas/horarios, política de duplicados y reingresos, escalas académicas, retención y cifrado local, RPO/RTO, hosting/worker, distribución familiar Android/iOS y soporte. No introducir Redis, un BaaS o sincronizador externo sin justificarlo frente al piloto.

Referencias de integración (consultar versión compatible antes de actualizar):
- [NativeWind v5: instalación y pareja RC](https://www.nativewind.dev/v5/getting-started/installation).
- [Bun: overrides por dependencia](https://bun.sh/docs/pm/overrides).
- [Expo: SDK 58](https://docs.expo.dev/versions/v58.0.0/).
- [Better Auth: integración Expo](https://www.better-auth.com/docs/integrations/expo).
- [PRD y aceptación del piloto](PRD.md).
