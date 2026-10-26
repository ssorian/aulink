# Pulido visual frío y limpieza de mensajes

## Alcance autorizado
El usuario pide otra iteración de interfaz: quitar mensajes/referencias repetitivos de datos demo, pulir más la UI y eliminar el tono cálido. Aclara que no esperaba desplegar literalmente Judgment Day. Esta es una nueva iteración de UI, NO una continuación ni aprobación del juicio congelado anterior. No ejecutar nuevos jueces ni modificar sus artefactos/veredicto.

## Dirección
Mantener morado profundo como ancla, con neutros fríos (grises/azules discretos), superficie blanca y texto nítido. Sin crema, marfil, beige o marrón. Operate: menos bloques vacíos y texto de maqueta, mayor densidad útil, jerarquía clara; iconos y nombres de acciones accesibles.
No crear datos/estadísticas, cambiar backend, cálculos, workflows, identificadores, datos persistidos, enums de dominio o mocks. Texto visible puede simplificarse con autorización explícita de este turno; no presentar notificaciones, invitaciones, QR real o sincronización como disponibles.

## Criterios
- Sin banners/disclosures de demo en cada página, sin repetir «demo», «simulación» ni «datos sintéticos» en etiquetas/botones/mensajes de interfaz.
- Una nota sobria en Configuración informa almacenamiento en navegador y ausencia de conexión a servicios externos; errores reales de guardado siguen visibles/accionables.
- Acción de incorporar ejemplos, si se conserva, vive solo en Configuración, no como banner global. No borrar datos del usuario.
- Inicio compacto sin header redundante ni avisos repetidos. Grupos en lista comparativa responsiva, sin cuadrícula flotante de tarjetas iguales. Destinatarios visibles por defecto sin abrir cada comunicado.
- Formularios conservan foco, error asociado, captura al cancelar y confirmación; cambiar textos no cambia validación ni operaciones. Mantener diferencia borrador/publicado y no afirmar enviado/leído.
- Nuevos pares de color AA, controles >=44px, navegación y tablas usables 320/390/768/1440.

## T1 — Shell, Inicio y tema frío
Estado: terminado.
Tema frío #f3f5f9/#eaf0f6, banner global retirado, labels limpios, Inicio en filas compactas y grupos como lista comparativa; errores reales de persistencia permanecen como alert. Acción de incorporación de registros movida a Configuración con el mismo callback/merge. Nombre escolar solo normaliza sufijo de presentación «· Demo», no estado.
Superficies: apps/web/src/styles.css, school-app.tsx y home-view.tsx.
Eliminar aviso global y textos de maqueta repetidos, mover acción de carga a callback para Configuración y mantener errores de almacenamiento. Contrato de integración con T2: SetupView acepta props opcionales storageStatus?: string y onLoadExamples?: () => void. El padre verificará ambos lados; no mover ni cambiar la lógica de localStorage ni la incorporación de ejemplos. UI mínima de error derivada del estado actual, no ocultar fallos.
Editar el bloque de tokens/refinamiento existente en vez de sumar otra capa de overrides. Neutros fríos y lista de grupos con CSS scoped a .task-grid:has(> button.task-card), sin alterar otros task-grid.

## T2 — Copy de vistas, formularios y Configuración
Estado: terminado.
Copy y acciones naturales sin disclaimers de demo repetidos; destinatarios visibles por defecto. Nota factual y acción de ejemplos en disclosure al final de Configuración, sin desplazar contenido principal. Cierre modal alineado a la derecha; foco/cache/validación se conservan. Datos originales, enums y nombres/autores de registros permanecen sin mutar.
Superficies disjuntas: communications-view.tsx, flow-dialog.tsx, setup-view.tsx, attendance-view.tsx, staff-view.tsx, credentials-view.tsx, student-profile.tsx, grades-view.tsx, conduct-view.tsx, group-workspace.tsx, view-helpers.tsx. Todas bajo apps/web/src/modules/school/.
Quitar ruido de demo/simulación de la interfaz y simplificar acciones. No cambiar valores enviados a apply ni datos/enums. Mantener autores/nombres de registros como datos: no normalizar todos los strings ni mutar estado. Destinatarios por defecto visibles (details open o lista), publicación semántica. Si una capacidad aún no existe, no presentar botón falso ni promesa; concentrar limitaciones en configuración y conservar avisos contextuales imprescindibles.
Nota Configuración con props opcionales storageStatus y onLoadExamples de T1; no interceptar persistencia. Sin CSS (T1 es dueño).

## T3 — Verificación y cierre
Estado: terminado.
50 pruebas, 781 aserciones, lint13TSX, typecheck web y build final exit0. Navegador:20recorridos (5vistas×320/390/768/1440), sin overflow ni banners de demo;262muestras de texto sin fallos (mínimo5.49:1) y controles muestreados≥3:1. Destinatarios abiertos, foco/errores/cancelación/cache, callback de ejemplos sin cambiar storage al cancelar y revisión Publicar con destinatarios comprobados. Fallo de Storage.setItem inyectado transitoriamente produce alert visible; API restaurada y página recargada, sin modificación persistida. Capturas desktop/móvil inspeccionadas. No nuevos jueces, detector ni context.
Revisar diff y copy; pruebas y typecheck web/lint/build; browser de cinco vistas en cuatro anchos, errores/foco/cancelación/publicación, contraste y ausencia de avisos repetidos. No repetir Impeccable context ni detector: ya ejecutados una vez en esta sesión (detector anterior falló timeout y no fue aprobado). Impeccable polish/craft-floor guían este cambio; no se atribuye detector limpio. Sin reportes de Judgment Day en la respuesta final.

## Tamaño y coordinación
Dos unidades de edición paralelas con superficies disjuntas para reducir cambios cruzados. Previsión ~350–550 líneas con muchas eliminaciones de copy, sin comprimir ni reformatear archivos completos. Snapshot propio antes de cambio para revisar delta, dado que el repositorio sigue sin commits y todo untracked. No commits ni PR.
