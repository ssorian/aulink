# PRD web — Operación escolar de Aulink

Estado: propuesta funcional para validación · v0.1.

**La web debe permitir que el personal escolar mantenga un padrón confiable, revise accesos al plantel y publique información a las familias correctas.** Su éxito no consiste en mostrar un dashboard completo, sino en completar esas tareas con permisos reales, datos persistentes y evidencia de lo ocurrido.

Este documento especifica comportamiento objetivo, no funcionalidades ya implementadas. Complementa el [PRD general](PRD.md); las decisiones técnicas pertenecen al [ARD](ARD.md). No diseña las pantallas móviles ni sustituye su especificación.

## 1. Decisiones y alcance

### Confirmado con el usuario

- Solo aplicación web; la móvil aparece únicamente como dependencia de captura y consulta familiar.
- Definir lo que el producto debería hacer, utilizando la UI actual como referencia, no como contrato.
- Conservar las fases: P1 asistencia y avisos; P2 conducta; P3 calificaciones.
- P1 gestiona entradas y salidas del plantel. No incluye pase de lista diario ni por materia.
- En P1 publican comunicados administración escolar y control escolar, no docentes.
- Las faltas requieren revisión humana antes de confirmarse. No tener un escaneo no basta para declarar una falta.

### Contexto heredado del PRD general

Piloto en México, secundaria/preparatoria, una escuela, aproximadamente 300 alumnos, un turno y una terminal Android. La conectividad de la terminal puede ser intermitente. El sistema conserva aislamiento entre instituciones y admite crecimiento posterior.

### Propuestas pendientes de validar

La navegación, matriz detallada de permisos y reglas operativas que siguen son propuestas, salvo las decisiones confirmadas anteriores. No son compromisos contractuales ni autorizan inventar reglas académicas.

No se incluyen pagos, LMS, chat, biometría, custodia de menores, control físico de puertas, boletas oficiales ni portal familiar web. La consola de administración de la plataforma queda fuera de este PRD.

## 2. Usuarios y resultados esperados

| Usuario | Resultado que necesita |
| --- | --- |
| Administración escolar | Preparar la escuela, asignar responsabilidades, supervisar operación y resolver bloqueos. |
| Control escolar | Mantener alumnos, inscripciones y tutores; revisar asistencia y publicar comunicados. |
| Docente | En fases posteriores, trabajar únicamente con los grupos y materias asignados. No necesita acceso administrativo general. |
| Operador de terminal | Registrar accesos desde la terminal. Tener ese rol no concede acceso a la web administrativa. |

Familias reciben información mediante la experiencia familiar; no son usuarias de esta web en el alcance acordado.

### Matriz de permisos propuesta

| Capacidad | Administración escolar | Control escolar | Docente |
| --- | --- | --- | --- |
| Configuración institucional y permisos de personal | Gestionar | Consultar configuración operativa necesaria | Sin acceso administrativo |
| Padrón, inscripciones y vínculos familiares | Gestionar | Gestionar | Solo alumnos de asignaciones autorizadas, cuando aplique |
| Credenciales y asistencia | Gestionar y revisar | Gestionar y revisar | Sin gestión en P1 |
| Publicar comunicados P1 | Escuela, grupo o alumno | Escuela, grupo o alumno | No |
| Autorizar o revocar terminales | Gestionar | Consultar estado | No |
| Conducta P2 y calificaciones P3 | Supervisar según permiso | Según política académica | Captura en su ámbito; publicación por definir |

Ocultar un botón no aplica seguridad: cada consulta y cambio debe estar autorizado en el servidor. Las restricciones a datos sensibles prevalecen sobre un rol general. Una sesión con varios roles no puede mezclar escuelas ni ampliar arbitrariamente su ámbito.

## 3. Fases y condición de salida

| Fase | Alcance web | Condición de salida |
| --- | --- | --- |
| P1 — Operación del piloto | Acceso seguro, preparación escolar, alumnos, tutores, credenciales, asistencia, comunicados, supervisión de terminales y trazabilidad. | Personal autorizado completa el circuito con datos centrales: alta → credencial → acceso recibido → revisión → consulta familiar; también publica un comunicado a destinatarios verificados. |
| P2 — Conducta | Incidentes, reconocimientos, seguimiento, información interna y publicación familiar. | No se filtran notas internas; permisos y seguimiento se validan con la escuela. |
| P3 — Calificaciones | Materias, asignaciones, periodos, escalas, captura, publicación e historial. | La escuela aprueba reglas académicas y se comprueba que las familias no ven borradores. |

Conducta y calificaciones no deben aparentar estar habilitadas en el piloto. Ocultarlas o identificarlas claramente como no disponibles; nunca ofrecer acciones sin resultado real.

## 4. Arquitectura de información propuesta

La navegación se organiza por tareas; los nombres y agrupaciones pueden ajustarse sin alterar los requisitos.

| Área | Contenido y acción principal |
| --- | --- |
| Inicio | Pendientes accionables de la jornada, contexto y acceso a las tareas que necesitan atención. |
| Comunidad escolar | Alumnos y personal. Desde cada alumno se abre su expediente. |
| Gestión académica | Grupos, ciclos, horarios y calendario. |
| Vida escolar | Asistencia y comunicados; conducta a partir de P2. |
| Evaluación | Calificaciones y configuración académica a partir de P3. |
| Administración | Configuración institucional, terminales y permisos autorizados. |

El expediente reúne identidad, inscripción por ciclo, tutores, credenciales e historial permitido. No es una segunda fuente de datos: un cambio realizado desde un grupo debe reflejarse también en el expediente y en el directorio.

Las pantallas consultables deben tener una URL recuperable. Recargar o volver desde un expediente debe conservar, cuando corresponda, ciclo, grupo, fecha, filtros y posición del listado. Una URL nunca concede acceso por sí misma.

## 5. Flujos y requisitos de P1

### WEB-01 · Acceder y reconocer el contexto

1. El usuario inicia sesión y accede solo a instituciones con membresía vigente.
2. La web muestra escuela, ciclo consultado e identidad de la sesión; si hay varias escuelas autorizadas, exige contexto explícito.
3. Sesión vencida o permiso retirado bloquea nuevas operaciones y permite volver a autenticarse sin prometer que cambios no enviados fueron guardados.

**Aceptación:** una URL de otra escuela o una petición modificada no revela datos ni permite cambios. Una operación confirmada debe seguir disponible tras recargar y desde otra sesión autorizada.

### WEB-02 · Preparar la escuela para operar

Administración configura institución y zona horaria; control escolar prepara ciclo, niveles, grados, grupos, turno, horarios, tolerancias y calendario conforme a permisos. Se muestran dependencias faltantes antes de activar la operación: no se asume que un formulario vacío equivale a configuración válida.

Los días sin clase y excepciones indican ámbito y vigencia. Cambiar reglas no debe reescribir silenciosamente conclusiones históricas; antes de afectar jornadas existentes se informa el impacto y se registra la decisión.

**Aceptación:** un día inhábil no genera falta; las fechas se interpretan en la zona de la escuela. El cierre de ciclo conserva expedientes e inscripciones anteriores y no reinscribe automáticamente sin revisión.

### WEB-03 · Dar de alta e inscribir alumnos

- Alta individual con identidad mínima, matrícula única por escuela e inscripción al ciclo y grupo correspondientes.
- Importación con plantilla disponible, vista previa, validación por fila y detección de matrículas repetidas en el archivo y en la escuela.
- La confirmación informa qué se creará o cambiará. Propuesta para P1: no aplicar la importación mientras existan errores; permitir corregir y volver a validar sin duplicar registros.
- Búsqueda por nombre o matrícula y filtros de ciclo, grupo y estado de inscripción. Los resultados muestran suficiente contexto para distinguir homónimos.
- Cambio de grupo o baja con fecha efectiva, responsable y conservación del historial. No eliminar a un alumno para resolver un cambio de inscripción.

**Aceptación:** cancelar una vista previa no crea alumnos; reenviar una confirmación por fallo de red no duplica altas. Los cambios de ciclo no sobrescriben el grupo histórico de eventos anteriores.

### WEB-04 · Gestionar tutores y acceso familiar

Desde el expediente se pueden registrar contactos, iniciar vinculación y revisar su estado. Separar contacto capturado de usuario invitado y de vínculo verificado/activo. Permitir varios tutores y varios hijos según autorización escolar.

Antes de habilitar acceso, mostrar alumno, tutor, alcance y procedimiento de verificación. Restringir o revocar exige permiso, confirmación y trazabilidad. Conocer una matrícula o compartir apellido no acredita parentesco.

**Aceptación:** un vínculo no verificado no se cuenta como destinatario autorizado. Tras revocar, el tutor no obtiene nuevas consultas del alumno; la UI explica que no puede retirar capturas o información ya descargada.

### WEB-05 · Emitir y reemplazar credenciales

Emitir credencial para el alumno correcto, con matrícula visible y QR opaco sin datos personales. Permitir obtener una representación utilizable para entrega o impresión; el formato físico se valida con la escuela.

Reemplazar requiere revisar identidad, confirmar revocación del código anterior y registrar motivo. Mostrar fecha, estado y advertencia sobre terminales que aún no descargan la revocación. No exponer secretos en listados operativos.

**Aceptación:** reemplazar no crea otro alumno ni borra su historial. La web no afirma que un dispositivo desconectado ya recibió el cambio.

### WEB-06 · Revisar accesos y confirmar asistencia

1. Control escolar elige fecha y, opcionalmente, grupo o alumno.
2. Consulta entradas/salidas recibidas, hora del evento y de recepción, terminal de origen y problemas de sincronización conocidos.
3. Distingue evidencia de acceso del resumen de jornada. Mostrar entrada sin salida, sin registro, pendiente de revisión o información incompleta no equivale a falta confirmada.
4. Revisa calendario, horario, incidencias y actualidad de las terminales. Si una terminal está desconectada, sus pendientes actuales pueden ser desconocidos: no mostrar cero como hecho.
5. Para confirmar falta, registra revisión y motivo. No debe cerrarla como conclusión definitiva si existen pendientes o conflictos conocidos que puedan afectar al alumno; resuelve o justifica auditadamente una excepción autorizada.
6. Si llega evidencia tardía que contradice una conclusión, marcar revisión necesaria; conservar la decisión previa y no cambiar silenciosamente el historial.

**Aceptación:** un alumno sin lectura no recibe una falta automática. Un registro recibido tarde conserva la hora original y puede reabrir revisión. Una entrada duplicada no se convierte en salida.

### WEB-07 · Corregir o justificar sin borrar evidencia

Permitir al personal autorizado registrar un ajuste o justificación sobre alumno y jornada, con motivo obligatorio. Mostrar evidencia original, valor anterior y resultado propuesto antes de confirmar; conservar actor, fecha y relación con el ajuste previo.

No fabricar un escaneo de terminal al registrar una corrección manual. Las correcciones quedan identificadas como tales. Si otra persona cambió la jornada durante la edición, mostrar el conflicto y pedir revisión en lugar de sobrescribirla.

**Aceptación:** desde el resumen se reconstruye qué ocurrió y quién lo corrigió. Cancelar no modifica el registro; repetir una confirmación no duplica el ajuste.

### WEB-08 · Preparar y publicar comunicados

1. Administración o control escolar crea un borrador con título, contenido y audiencia: escuela, grupo o alumno.
2. Revisa vista previa, ámbito, alumnos afectados, número de destinatarios autorizados y exclusiones con causa. Mostrar tutores concretos solo dentro de sus permisos.
3. El servidor vuelve a validar audiencia y permisos al confirmar. Si cambiaron de forma relevante desde la revisión, informa el cambio y solicita nueva confirmación.
4. Publicar crea un comunicado durable y su conjunto de destinatarios; un doble clic o reintento no produce publicaciones duplicadas.
5. Se muestra publicación por separado de intentos de notificación, entrega conocida y lectura explícita. Un envío push exitoso no significa que la familia leyó.

Sin tutores autorizados, bloquear publicación y ofrecer resolver vínculos o cambiar audiencia. Si solo parte de los alumnos tiene destinatarios, advertir cobertura incompleta antes de confirmar. Los nuevos vínculos posteriores no reciben retroactivamente el comunicado por una suposición silenciosa.

**Aceptación:** familias no ven borradores ni mensajes fuera de su ámbito. La caída de push no elimina el comunicado publicado. Los intentos fallidos pueden diagnosticarse sin afirmar lectura.

**Propuesta pendiente:** publicaciones no se editan silenciosamente; una rectificación debe conservar versión y autor. Definir con la escuela el retiro y tratamiento de contenido ya consultado antes de habilitar esas acciones.

### WEB-09 · Supervisar terminales

Administración autoriza, identifica y revoca equipos; control escolar consulta su estado operativo. Mostrar última comunicación, antigüedad del catálogo/configuración conocida, último número de pendientes reportado y conflictos que requieren revisión.

Distinguir «estado reportado en la última conexión» de «estado actual». La web no puede conocer una cola offline en tiempo real ni sincronizar un teléfono apagado. Al revocar, advertir sobre pendientes y orientar recuperación supervisada; no ofrecer borrarlos para quitar una alerta.

**Aceptación:** un equipo sin contacto reciente aparece con información desactualizada/desconocida, no como sincronizado. La revocación y regularización conservan evidencia y responsable.

### WEB-10 · Incorporar personal y asignar responsabilidad

Separar ficha de personal, invitación de cuenta, activación de acceso y asignación de permisos. Revisar escuela y alcance antes de otorgarlos; retirar acceso sin eliminar autoría histórica. En P3, asignar docencia por ciclo, grupo y materia.

**Aceptación:** crear una ficha no muestra «invitación enviada» sin envío confirmado ni habilita automáticamente permisos. Un docente no puede publicar comunicados durante P1.

### WEB-11 · Mostrar un inicio útil

Priorizar incidencias de sincronización, asistencia por revisar, vínculos incompletos y borradores relevantes. Cada indicador especifica fecha, ámbito, fuente y momento de actualización, y lleva al listado filtrado que explica su cifra.

No mostrar porcentajes de asistencia definitivos con información incompleta ni confundir alumnos inscritos, accesos recibidos y personas presentes. La pertenencia a un grupo no demuestra presencia física actual.

**Aceptación:** los indicadores se pueden comprobar con sus registros de origen; un conjunto sin datos muestra estado vacío, no una métrica inventada.

## 6. Fases posteriores

### P2 · Conducta

El personal autorizado registra incidentes o reconocimientos vinculados a alumno, fecha, autor y contexto. El seguimiento es acumulativo, con responsable y estado. Las notas internas y evidencias restringidas se separan del contenido compartible desde la captura, revisión y consulta.

Antes de publicar se muestra exactamente qué verá la familia y quién podrá consultarlo. Retirar permisos impide nuevas consultas y descargas no autorizadas. La existencia de una URL de archivo no basta para acceder.

**Aceptación:** una nota interna nunca aparece en vista familiar, notificación o exportación dirigida a tutores. Cambiar un reporte deja historial. Permisos de creación, publicación y tratamiento de información sensible deben acordarse antes de implementar P2.

### P3 · Calificaciones

Configurar materias, asignaciones docentes, periodos, escala, reglas de captura y publicación por ciclo. Capturar únicamente alumnos de la inscripción y asignación correctas; validar rango, formato y estados especiales que apruebe la escuela. No convertir vacío en cero.

Separar borrador, publicación y corrección posterior. Mostrar vista previa y alcance antes de publicar. Una corrección exige motivo e historial; periodos cerrados requieren reapertura autorizada. No calcular promedios ni redondeos sin reglas aprobadas y versionadas.

**Aceptación:** familias no ven borradores; un docente no modifica otro grupo; cambiar una escala futura no altera evaluaciones históricas. Definir autoridad de publicación y estados como «sin evaluar» antes de implementar P3.

## 7. Contrato de interacción de toda la web

| Situación | Comportamiento requerido |
| --- | --- |
| Carga | Indicar qué se está cargando sin presentar datos anteriores como actuales. |
| Sin datos | Explicar qué falta y ofrecer el primer paso permitido. |
| Sin coincidencias | Conservar filtros y permitir limpiarlos; no confundir con ausencia de alumnos. |
| Validación | Error junto al campo y resumen accesible; conservar entradas corregibles. |
| Guardado en curso | Evitar confirmaciones duplicadas y señalar progreso. |
| Éxito | Confirmar solo tras persistencia central; mostrar el resultado, no solo cerrar el diálogo. |
| Red interrumpida o resultado incierto | No afirmar éxito ni repetir ciegamente; permitir comprobar resultado y reintentar sin duplicar. |
| Datos desactualizados | Mostrar antigüedad y permitir actualizar; revisar conflictos antes de cambios sensibles. |
| Sin permisos | No revelar datos; explicar restricción y vía para solicitar acceso. |
| Salir con cambios | Advertir antes de descartar; distinguir datos guardados de captura temporal. |

La web P1 requiere conexión para confirmar operaciones centrales; no hereda la garantía offline de la terminal. Puede conservar captura temporal, pero no debe llamarla «guardada en la escuela».

Interfaz en español, formatos locales y zona horaria escolar explícita donde pueda haber ambigüedad. Operación por teclado, foco visible, etiquetas accesibles, errores anunciables y estados que no dependan solo del color. Objetivo propuesto: WCAG 2.2 AA, sujeto a verificación, no declaración automática de conformidad.

Priorizar escritorio para tareas administrativas y consulta/revisión en tamaños menores; las tablas no deben ocultar identidad, estado ni acciones esenciales. Filtrar o reordenar no debe mover una edición a otro alumno.

## 8. Seguridad, trazabilidad y límites operativos

- Toda consulta y mutación verifica institución, sesión, permiso y relación con el alumno o grupo.
- Datos sensibles de menores no aparecen en logs operativos ni mensajes públicos de error.
- Cambios sensibles registran actor, instante, objeto, motivo cuando corresponde y resultado. No se borran historias para simplificar la UI.
- Publicaciones y operaciones simultáneas deben manejar reintentos y conflictos sin pérdida silenciosa.
- Antes de usar datos reales se validan privacidad, retención, respaldos, restauración, recuperación de terminal y responsables, conforme al PRD general.
- Las búsquedas y listados deben funcionar con el padrón del piloto sin exigir descargar información que el usuario no está autorizado a consultar. Rendimiento web se medirá con volumen y red representativos; no se fija un SLA sin ensayo.

## 9. Brecha entre UI actual y producto requerido

Observación del código al redactar; no es una auditoría completa de seguridad ni una prueba de ejecución.

| Evidencia actual | Consecuencia para el producto |
| --- | --- |
| `apps/web/src/modules/school/school-app.tsx` inicia datos simulados y guarda el estado escolar en `localStorage`. | La demo no satisface persistencia central, colaboración ni recuperación entre sesiones/dispositivos. Un estado local no prueba una operación real. |
| `apps/web/src/modules/school/staff-view.tsx` distingue responsabilidades de autorización e invitaciones reales. | Mostrar un rol no demuestra acceso protegido ni alta de cuenta. |
| `apps/web/src/modules/school/communications-view.tsx` presenta revisión de audiencia dentro del flujo de demo. | La publicación visual no demuestra entrega o disponibilidad familiar real. |
| `apps/web/src/routes/index.tsx` monta `SchoolApp`; las secciones se eligen mediante estado interno en `school-app.tsx`. | Se necesita navegación recuperable para los contextos de consulta definidos. |

Las pantallas existentes ayudan a descubrir tareas, pero no justifican mantener funciones ambiguas, métricas sin fuente ni módulos futuros como si estuvieran listos.

## 10. Verificación de aceptación P1

Estos escenarios deben probarse sobre la operación integrada, no solo con mocks o capturas de pantalla.

| ID | Escenario | Resultado observable |
| --- | --- | --- |
| A-01 | Usuario sin permiso intenta URL y operación directa de otra escuela. | Sin datos filtrados ni cambios aplicados. |
| A-02 | Alta/importación con matrícula duplicada; corrección y reintento. | Error identificable y una sola identidad/inscripción válida. |
| A-03 | Guardar desde una sesión y consultar desde otra autorizada. | Mismo estado central confirmado; no depende del navegador original. |
| A-04 | Tutor no verificado o revocado intenta nueva consulta. | No accede al expediente ni se cuenta como destinatario habilitado. |
| A-05 | Reemitir credencial con una terminal desconectada. | Código anterior revocado centralmente, historia conservada y advertencia de propagación pendiente. |
| A-06 | Día inhábil o alumno sin lectura con terminal desactualizada. | No aparece falta automática; se identifica insuficiencia de información. |
| A-07 | Confirmar falta tras revisión; llega luego un acceso contradictorio. | Nueva revisión visible y conservación de evidencia y decisión anterior. |
| A-08 | Dos personas corrigen la misma jornada. | Conflicto visible; no se pierde silenciosamente el primer cambio. |
| A-09 | Comunicado sin destinatarios, con cobertura parcial y con audiencia cambiada. | Bloqueo, advertencia o nueva revisión según caso; no envío silencioso al conjunto equivocado. |
| A-10 | Publicar con doble clic o respuesta perdida; falla push. | Un comunicado durable, sin duplicación lógica; fallo de notificación separado de publicación y lectura. |
| A-11 | Revocar equipo con pendientes conocidos y dejarlo sin conexión. | Advertencia y procedimiento supervisado; no borrar evidencia ni afirmar sincronización actual. |
| A-12 | Docente intenta publicar un comunicado en P1. | Rechazo de la operación, también fuera de la UI. |
| A-13 | Recargar expediente filtrado y regresar al directorio; operar por teclado. | Contexto recuperable y controles accesibles sin perder selección ni datos confirmados. |

La salida del piloto exige además los ensayos de terminal y consulta familiar definidos en el [PRD general](PRD.md#8-aceptación-del-piloto); aprobar la web por separado no prueba el circuito completo.

## 11. Métricas y decisiones restantes

Medir con escuela, fecha y fuente: tiempo para preparar padrón válido; errores de importación; jornadas pendientes de revisión y antigüedad; conflictos sin resolver; cobertura familiar verificada; publicaciones persistidas y fallos de notificación. Separar tiempo de trabajo humano de espera por sincronización. Los objetivos numéricos se acuerdan durante el ensayo; lectura no equivale a comprensión ni acceso registrado a custodia.

| Decisión pendiente | Cuándo resolverla | Responsable propuesto |
| --- | --- | --- |
| Aprobar matriz detallada de permisos y sustituciones de personal. | Antes de implementar autorización P1. | Dirección + control escolar. |
| Horarios, tolerancias, reingresos, salidas anticipadas y excepciones al cierre de revisión. | Antes del ensayo de asistencia P1. | Control escolar + dirección. |
| Evidencia para verificar tutores, restricciones y revocaciones. | Antes de habilitar vínculos reales. | Escuela + asesoría legal. |
| Datos mínimos, formato de importación y plantilla física de credencial. | Antes de cargar padrón real. | Control escolar + operación de terminal. |
| Vigencia offline y procedimiento de recuperación/revocación de terminal. | Antes de autorizar terminal real. | Escuela + seguridad/operación técnica. |
| Rectificar o retirar comunicados publicados y avisar sobre su corrección. | Antes de habilitar esas acciones. | Dirección + producto. |
| Retención, privacidad, respaldo y recuperación. | Antes de usar datos reales. | Institución + legal + operación técnica. |
| Responsables de conducta y publicación académica; escalas y periodos. | Antes de P2/P3 respectivamente. | Dirección académica. |

Estas decisiones no bloquean la lectura del PRD, pero sí las funciones indicadas. No deben convertirse en valores predeterminados silenciosos durante la implementación.
