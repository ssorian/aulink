# PRD — Aulink

Especificación de requisitos del producto · v0.1 · Propuesta para validación.

Aulink conecta la operación escolar con las familias: registra accesos aun sin internet y reúne asistencia, avisos, calificaciones y conducta en un expediente por alumno. Este documento define el producto objetivo; no afirma que sus funciones ya estén implementadas.

## 1. Decisiones confirmadas

| Tema | Alcance acordado |
| --- | --- |
| Mercado inicial | México; secundaria y preparatoria. |
| Piloto | Una escuela, aproximadamente 300 alumnos, un turno y una terminal. |
| Administración | Aplicación web y backend juntos en TanStack Start. |
| Móvil | Aplicación Expo con experiencias protegidas de familia y terminal institucional. |
| Terminal | Teléfono o tableta Android; lector compatible y cámara QR como alternativa. |
| Conectividad | Poco confiable: registro local primero, sincronización posterior. |
| Identificación | Matrícula visible en credencial; QR opaco, reemplazable y revocable. |
| Crecimiento | Separación entre instituciones y posibilidad de varias terminales. |

**Ruta de lectura:** alcance y roles → requisitos → aceptación del piloto. El diseño técnico está en el [ARD](ARD.md).

## 2. Problema, objetivos y límites

La escuela necesita registrar accesos sin depender de internet, consultar información académica y comunicar novedades a los tutores correctos. Las familias necesitan consultar varios hijos sin depender exclusivamente de recibir una notificación.

Objetivos:
- Registrar una entrada o salida confirmada localmente sin perderla por interrupción de red o reinicio normal de la app.
- Distinguir registro local, aceptación del servidor y aviso a la familia.
- Centralizar la información por alumno, conservando el historial de ciclos anteriores.
- Reducir captura duplicada y ofrecer trazabilidad de correcciones y publicaciones.

No objetivos iniciales: biometría, reconocimiento facial, control físico de puertas, GPS, pagos, LMS, chat, integración oficial con sistemas educativos ni boletas con validez oficial. Un escaneo no prueba por sí solo la identidad del portador ni autoriza la entrega de un menor.

## 3. Personas y permisos

| Actor | Responsabilidad y límite |
| --- | --- |
| Administrador de plataforma | Alta y operación de instituciones; acceso a datos escolares solo mediante soporte autorizado y auditado. |
| Administrador escolar | Configuración, personal, permisos y supervisión de su escuela. |
| Control escolar | Alumnos, grupos, tutores, calendario, revisión y corrección de asistencia. |
| Docente | Grupos y materias asignados; captura y publicación según permisos. |
| Operador de terminal | Escaneo y estado operativo; sin acceso a calificaciones o reportes familiares. |
| Padre o tutor | Consulta únicamente de alumnos con vínculo vigente y contenido publicado para su acceso. |

Una persona puede tener varios roles o hijos; cada permiso se evalúa en el contexto de la escuela y del alumno. Conocer una matrícula no concede acceso. La vinculación familiar requiere invitación o verificación escolar, contempla más de un tutor y permite restricciones o revocaciones autorizadas.

## 4. Entregas del producto

| Fase | Incluye | Condición de salida |
| --- | --- | --- |
| P1 — Piloto | Escuela, ciclo, grupos, alumnos, tutores, calendario, credenciales, terminal offline, expediente de asistencia y avisos básicos. | Circuito escaneo → sincronización → consulta familiar validado en escuela. |
| P2 — Conducta | Incidentes y reconocimientos, seguimiento, contenido interno o compartido, evidencias con acceso restringido. | Publicación y permisos verificados con personal escolar. |
| P3 — Calificaciones | Materias, asignaciones docentes, periodos, escalas, captura, publicación y consulta histórica. | Reglas académicas de la institución aprobadas y probadas. |

El orden es una propuesta de entrega, no una reducción del alcance total. La primera terminal usa el dispositivo y lector que se validen físicamente; RFID/NFC no se presume compatible por soportar QR.

## 5. Requisitos funcionales

### Institución y expediente

| ID | Requisito y resultado observable |
| --- | --- |
| PRD-01 | Permitir el registro de una institución y la verificación de su administrador antes de habilitar operación real. Limitar usuarios, alumnos, terminales y consultas a su ámbito autorizado; manipular un identificador no permite cruzar escuelas. |
| PRD-02 | Configurar ciclos, niveles, grados, grupos y turno; inscribir alumnos por ciclo sin sobrescribir su historial. |
| PRD-03 | Crear o importar listas con validación previa y errores por fila. Matrícula única por escuela; duplicados no generan alumnos silenciosamente. |
| PRD-04 | Gestionar vínculos de tutores mediante verificación escolar. Una familia puede consultar varios hijos, inicialmente de la misma escuela. |
| PRD-05 | Configurar zona horaria, horarios, tolerancia, días sin clase y excepciones. Un día inhábil no produce falta automática. |
| PRD-06 | Mostrar expediente por alumno y ciclo con asistencia, y posteriormente conducta y calificaciones, respetando permisos y publicación. |

### Credencial y asistencia

| ID | Requisito y resultado observable |
| --- | --- |
| PRD-07 | Emitir credenciales con matrícula visible y QR sin datos personales. Reemitir revoca el código anterior sin cambiar identidad ni historial. |
| PRD-08 | Autorizar cada terminal para una escuela, nombrarla y desactivarla. El modo terminal no se habilita con un interruptor disponible a familias. |
| PRD-09 | Capturar con cámara o lector validado; mostrar alumno y grupo para verificación del operador. Rechazar formatos inválidos y credenciales desconocidas localmente. |
| PRD-10 | Seleccionar explícitamente entrada o salida con permiso de operador; mostrar el modo de forma persistente. No alternarlo por cada lectura. |
| PRD-11 | Controlar lecturas repetidas con ventana configurable. Un posible reingreso legítimo no se elimina silenciosamente por parecer duplicado. |
| PRD-12 | Guardar evento y pendiente de envío antes de confirmar éxito. Sin red o tras reiniciar, los pendientes siguen disponibles. Si no se puede guardar, informar fallo, nunca éxito. |
| PRD-13 | Sincronizar automáticamente al poder contactar al servidor y permitir reintento manual. Repetir un envío no duplica el evento central ni el aviso lógico. |
| PRD-14 | Mostrar conexión, pendientes, última sincronización y problemas que requieran revisión. Diferenciar guardado local de sincronizado, rechazado o en conflicto. |
| PRD-15 | Registrar hora de lectura y recepción. Desfase de reloj, credencial revocada o información local antigua pueden requerir revisión; no se ocultan. |
| PRD-16 | Separar eventos de acceso del resumen diario. No concluir falta o salida definitiva con eventos incompletos o terminales pendientes de sincronizar. |
| PRD-17 | Permitir justificar o corregir con permiso, motivo y auditoría. Conservar evidencia original y autor; no sobrescribirla silenciosamente. |
| PRD-18 | Soportar varias terminales con identidad propia. Resolver posibles duplicados entre dispositivos al sincronizar, sin prometer coordinación en tiempo real mientras estén desconectados. |

### Familias, avisos y módulos posteriores

| ID | Requisito y resultado observable |
| --- | --- |
| PRD-19 | Ofrecer selector de hijos y asistencia histórica con horas y estado de recepción. Una sesión o vínculo revocado no obtiene nuevas consultas del servidor. |
| PRD-20 | Crear aviso durable tras aceptar un evento publicable y notificar a los tutores autorizados. Sincronización tardía conserva la hora original; push puede retrasarse, faltar o repetirse. |
| PRD-21 | Publicar avisos a escuela, grupo o alumno, con borrador y destinatarios verificables. Separar envío técnico, entrega conocida y lectura explícita; ninguno implica comprensión. |
| PRD-22 | P2: registrar conducta positiva o incidentes, seguimiento y evidencias; distinguir notas internas del contenido visible a tutores. |
| PRD-23 | P3: definir materias, docentes, periodos y escala de evaluación; distinguir captura, publicación y corrección auditada. Familias no ven borradores. |
| PRD-24 | P3: conservar calificaciones y reglas aplicadas por ciclo. Cálculo de promedios y redondeos necesita validación de la escuela; no asumir una fórmula nacional única. |

## 6. Operación offline y expectativas

- La autorización inicial y descarga de alumnos requieren conexión. La terminal conserva solo la información necesaria para operar.
- Una lectura siempre se guarda primero localmente, haya o no internet. El envío se intenta después.
- Una revocación o cambio remoto no llega inmediatamente a una terminal desconectada. Se muestra antigüedad de la información y se define una vigencia operativa antes del piloto.
- No borrar pendientes al cambiar de sesión, actualizar la app o desactivar un equipo. Cualquier baja o recuperación necesita un procedimiento supervisado.
- La persistencia local no protege contra robo, daño o desinstalación antes de sincronizar. La interfaz advierte este riesgo y la escuela supervisa pendientes.
- El sistema no promete ejecutar sincronización continua con Android suspendido. Reintenta mientras la terminal está activa y al volver al primer plano.

## 7. Requisitos de calidad y protección

| ID | Requisito |
| --- | --- |
| NFR-01 | Minimizar información de menores, cifrar transporte, proteger credenciales de acceso y excluir datos personales de logs operativos. |
| NFR-02 | Revisar aviso de privacidad, base jurídica, derechos aplicables, retención y responsables según tipo de institución en México antes de usar datos reales. No se declara cumplimiento automático. |
| NFR-03 | Probar restauración central y recuperación operativa de terminal. Acordar retención, respaldo, RPO y RTO antes del piloto. |
| NFR-04 | Interfaz en español, errores accionables, texto legible, controles accesibles y confirmación visual más sonora opcional. No depender solo del color. |
| NFR-05 | Medir en hardware objetivo: propuesta inicial de confirmación local p95 ≤ 1 segundo después de decodificar y drenar 600 eventos en ≤ 5 minutos con conexión estable. Son metas por validar, no SLA contratado. |
| NFR-06 | Alertar sobre acumulación de pendientes, fallos de almacenamiento, sincronización y notificación. Soporte debe poder diagnosticar sin consultar contenido sensible innecesario. |

## 8. Aceptación del piloto

| Escenario | Evidencia requerida |
| --- | --- |
| Jornada desconectada | Registrar 300 entradas y 300 salidas de prueba sin red, reiniciar la app y conservar los 600 eventos confirmados. |
| Respuesta perdida | Cortar conexión después del commit del servidor; reenviar y obtener un solo evento central y un solo aviso lógico. |
| Doble lectura y modos | Probar lecturas consecutivas, cambio autorizado de modo y reingreso; nunca convertir un duplicado de entrada en salida. |
| Almacenamiento lleno | Simular fallo de escritura; no confirmar registro y mostrar acción al operador. |
| Revocación y reloj | Probar credencial revocada, catálogo antiguo y reloj desfasado; conservar evidencia y aplicar la política de revisión acordada. |
| Privacidad | Intentar acceder a otro alumno/escuela por API, retirar vínculo familiar y comprobar que no hay nuevas lecturas autorizadas. |
| Calendario | Suspensión, día hábil sin lectura y sincronización tardía no generan conclusiones contradictorias de asistencia. |
| Avisos | Probar destinatarios por escuela/grupo/alumno, ausencia de push, bandeja persistente y diferencia entre recibido y leído. |
| Hardware | Validar escaneo, cable/OTG o Bluetooth, reconexión, carga y cámara en Android real durante un ensayo de entrada. |
| Crecimiento | Simular dos terminales desconectadas y reconciliar lecturas superpuestas sin perder evidencia. |

## 9. Métricas propuestas

Medir tiempo local de confirmación, pendientes y antigüedad máxima, conflictos por jornada, duplicados lógicos, éxito de sincronización y disponibilidad de consulta familiar. La meta de integridad del ensayo es cero eventos confirmados perdidos bajo reinicio y cortes de red; no extrapola a destrucción del dispositivo.

La escuela debe acordar objetivos de adopción familiar y tiempos de atención. Ninguna métrica de push se presentará como prueba de asistencia, custodia o lectura humana.

## 10. Decisiones pendientes antes de producción

| Decisión | Responsable propuesto |
| --- | --- |
| Modelo Android, lector, tecnología de tarjeta y conectividad física | Escuela + equipo técnico. |
| Horarios, tolerancia, ventana de duplicados y reingresos/salidas anticipadas | Dirección/control escolar. |
| Vigencia de autorización offline, catálogo antiguo y regularización de conflictos | Escuela + seguridad técnica. |
| Procedimiento para tutores, restricciones de acceso y evidencia de vinculación | Dirección/control escolar + asesoría legal. |
| Retención, privacidad, respaldo, RPO/RTO y respuesta a incidentes | Institución + asesoría legal + operación técnica. |
| Hosting, soporte y distribución de la app familiar, incluidos dispositivos iOS | Producto + equipo técnico. |
| Escalas, periodos, publicación y fórmulas académicas | Dirección académica. |

## 11. Documentos relacionados

- [PRD web — flujos, permisos y aceptación de la operación escolar](PRD-WEB.md). Detalla P1 con accesos al plantel, publicación por administración/control escolar y faltas sujetas a revisión humana; conserva conducta y calificaciones como P2/P3.
- [ARD — arquitectura y requisitos técnicos detallados](ARD.md).
- [Guía del repositorio](../README.md).
