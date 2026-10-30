# Evaluación: espacio de control escolar

Rediseña la sección Evaluación como panorama institucional y coordinación del periodo para control escolar. Demo local sin backend; captura y corrección siguen en el grupo y las asignaciones en Horario.
Rama: `feat/evaluation-workspace`.

## Specs

- S1 — Rol: "El rol si es control escolar". La pantalla se diseña para control escolar.
- S2 — Riesgo configurable: "las materias reprobadas son configurables". El número de materias reprobadas que marca a un alumno en riesgo es configurable (junto con la calificación aprobatoria que define "reprobada").
- S3 — Alcance: "por ahora solo me gustaria la UI que cubriera los casos de uso". Casos de uso acordados en la delimitación previa:
  - Avance del periodo: matriz grupo × materia con estado (sin capturar, borrador, publicada) y docente; cada celda abre el grupo.
  - Pendientes por docente.
  - Publicación por lote de borradores.
  - Alumnos en riesgo: lista institucional que abre el expediente del alumno.
  - Resultados: promedio con aprobación/distribución, evolución entre periodos cuando existen varios.
  - Fuera: captura y corrección (se quedan en el grupo), asignaciones (Horario), ámbito docente.
- S4 — Calidad: "una ui mas pulida y limpia".

## Tasks

- T1 — S2, S3 · inline · Modelo demo: reglas de evaluación (aprobatoria, materias para riesgo) con valor por defecto, comandos `evaluation-rules` y `grade-publish-batch`; derivaciones de avance, pendientes por docente y riesgo con pruebas. Commit: 4e53129
- T2 — S3 · inline · Semilla demo natural con un segundo periodo parcialmente capturado y calificaciones reprobatorias, sin alterar la semilla legacy. Commit: 96ff5ee
- T3 — S1, S3, S4 · inline · UI: pestañas Avance / En riesgo / Resultados, filtros compartidos, publicación por lote con confirmación, accesos a grupo y expediente, estilos. Pruebas de render. Commit: 051d2ca, 98c68a4
- T4 — S1–S4 · inline · Verificación: typecheck, lint, pruebas, revisión visual en navegador escritorio/móvil, detector de diseño. Commit: sin cambios de código propios (correcciones en 98c68a4)

## Log

- L1 — Usuario (pedido original de la implementación): "El rol si es control escolar, las materias reprobadas son configurables, por ahora solo me gustaria la UI que cubriera los casos de uso, y una ui mas pulida y limpia"
- L2 — Contexto previo: el usuario pidió primero diseñar los casos de uso de la UI de evaluación ("antes de reformularla, realmente me interesa disenar que casos de uso de deberia cubrir en realidad") y luego explorar la app "para delimitar y definir mejor la idea". El explorer mostró que captura, corrección y publicación individual ya viven en Grupo → Calificaciones y las asignaciones en Horario.
- L3 — Decisiones del orquestador (no pedidas explícitamente, reversibles): valores por defecto aprobatoria 6 y riesgo con 2 o más materias reprobadas; Avance y riesgo trabajan por periodo; riesgo considera valores capturados (publicados y borradores, señalados); Resultados conserva solo publicadas porque es lo que ve la familia. No existe estado "lista" en el modelo, así que no se inventa.
- L4 — Evidencia T1: `bun test scripts/evaluation-operations.test.ts` RED (módulo inexistente) → 7 pass; suite 216 pass.
- L5 — Decisión T2: el segundo periodo y las reprobadas se generan en la semilla base ("Periodo 2 · Muestra" → "Segundo trimestre") porque la migración legacy exige correspondencia 1:1 con la semilla natural; las calificaciones con historial de corrección no cambian de valor.
- L6 — Evidencia T3/T4: suite `bun test scripts apps/web/src` 220 pass / 0 fail; `tsc --noEmit` limpio; biome limpio en archivos de evaluación; `impeccable detect` sin hallazgos. Navegador (Vite :3217, datos demo frescos, 1280px y 390px sin overflow horizontal): Avance 15/62 → "Publicar 21 borradores" → confirmación → 36/62; criterio de riesgo cambiado a 1 y guardado; filtro de periodo cambia la lista de riesgo; "Ver expediente" abre el perfil del alumno. Correcciones visuales tras la revisión: pestañas con estilo compartido, sin H2 redundante, celdas planas, etiquetas de la gráfica por materia sin quiebre, evolución por periodo legible, pluralización.
