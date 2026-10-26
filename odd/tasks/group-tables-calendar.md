# Grupos: tablas y calendario local

## Objetivo y alcance autorizado

Convertir el workspace de un grupo a tablas para alumnos, asistencia y calificaciones; quitar Conducta solo de ese workspace. Añadir calendario semanal editable, cancelaciones/reagendas por fecha y ventana de registro de salida calculada al final de la jornada.

Usuario confirmó: un cuadrito por día escolar; solo el cambio de última clase ajusta el fin de jornada; todas las evaluaciones y promedio simple. Autorizó completar UI y lógica dentro de la demo local, sin backend ni sincronización con terminales.

## Límites

- Mantener expediente y evidencia originales, motivos de corrección y publicación.
- No convertir ausencia de lecturas en falta confirmada; distinguir sin clase/futuro/pendiente.
- No calcular promedio entre escalas incompatibles ni usar cero para notas faltantes.
- Las excepciones no mutan la serie semanal; validar conflictos y fechas.
- Sin clases o día inhábil: sin ventana automática. Una ventana no autoriza entrega de menores.
- Persistencia local compatible con registros previos. No tocar datos reales ni reiniciar almacenamiento existente.

## Unidades verificables y responsables

1. Tablas: worker de tablas, únicamente workspace y nuevos group-*; pruebas `scripts/group-tables.test.ts`, contexto/experiencia si requieren actualizar aserciones obsoletas.
2. Calendario: worker de horario, únicamente workflows, schedule-* y pruebas `scripts/group-schedule.test.ts`; mock-data solo si necesario.
3. Integración: sesión principal, checks globales, navegador escritorio/móvil y evaluación de riesgo/verificación independiente si corresponde.

Los dos primeros bloques trabajan sobre superficies disjuntas. El workspace importa `ScheduleCalendar({s,groupId,open})`. No se harán commits ni PR sin solicitud. Cambio previsto superior a 400 líneas, autorizado como dos bloques funcionales locales; no comprimir código para reducir conteo.

## Riesgo

La propuesta afecta cálculos de horarios y ventanas en una demo, no autorización real de acceso ni control físico. Verificar especialmente conflictos de excepciones y preservación de registros previos; no afirmar integración con terminal.

## Evidencia

- Baseline: `bun test scripts/school-workflows.test.ts scripts/school-mock.test.ts scripts/school-ui.test.ts` → exit 0, 19 pass, 0 fail.
- Tablas: RED helper inexistente exit 1; GREEN focal 4 tests exit 0. Corrección semántica: RED aserción exit 1; GREEN 15 tests exit 0.
- Calendario: RED helper inexistente y después fecha imposible exit 1; GREEN 6 tests / 44 assertions exit 0.
- Integración final: `bun test scripts/group-tables.test.ts scripts/group-schedule.test.ts scripts/school-*.test.ts` → exit 0, 50 pass / 813 assertions.
- `bun run --filter aulink-web typecheck` → exit 0.
- Biome lint focal de los siete archivos TS/TSX de implementación → exit 0, sin avisos. Formato desde apps/web con `--config-path=biome.json` aprobado; intentos iniciales desde raíz fallaron por configuración anidada.
- Detector Impeccable en los cuatro componentes modificados → exit 0, sin hallazgos.
- Navegador escritorio: tabla → expediente → regreso conserva foco; Conducta permanece solo en expediente; asistencia mensual 31 columnas diarias y detalle; total de notas con borradores identificado; calendario semanal visible.
- E2E en contexto de navegador aislado (sin modificar almacenamiento existente): margen 10/20 min → ventana 08:50–09:20; reagenda 2026-10-21 a 2026-10-22 de 10:00–11:00 → origen sin ventana y destino 10:50–11:20; cancelar elimina ventana; recargar conserva dos cambios e historial.
- Navegador móvil (viewport 390×844): las cuatro pestañas sin desbordamiento del documento; regiones de scroll enfocables. Capturas en `.playwright-mcp/group-*-mobile.png` y `group-*-desktop.png`.
- Intentos iniciales de navegador fallidos documentados: navegación durante hidratación y selector exacto de etiqueta implícita; se diagnosticaron antes de nuevas comprobaciones. Tras reconexión, navegador en about:blank produjo SecurityError; se navegó explícitamente al origen antes del E2E.

## Estado

Implementación y validaciones funcionales completadas. La revisión nativa adicional fue declinada para el candidato seleccionado; no se creó lineage ni se emitió aprobación de revisión. ASSESS devolvió autoverificación del writer, sin verificador independiente; nativeRisk no evaluable por falta de declaración de archivos sin seguimiento en ese comando. El repositorio carece de baseline Git (todo sin seguimiento); START contó 12 archivos / 2744 líneas completas seleccionadas, no un diff contra una implementación previamente confirmada. No se añadió ni se confirmó contenido en Git. Las ventanas son simulación local y no habilitan terminales.
