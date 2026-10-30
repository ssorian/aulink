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
- S5 — Rediseño visual con referencias: "Ok la ui ya cubre los casos de uso, pero honestamente la ui es muy fea, usa mobbin para investigar pantallas de referencia"; dirección aprobada ("si avanza"): Avance con tarjetas de estado (Fresha), filtros en chips en una línea (Whop/Browserbase), matriz compacta con pill de estado + "5/6" + barra en una línea (ClickUp/Circle) y panel lateral de pendientes por docente; Riesgo con resumen de distribución (15Five) y fila por alumno con un pill por materia (SchoolAI); Resultados con KPIs dentro de paneles junto a sus gráficas (Fresha) y evolución como mini gráfico de línea. Mantener identidad Aulink (tipografía, violeta, sidebar). Referencias en `.impeccable/refs/eval/`.

- S6 — Datos realistas: "Quiero todavia enriquecer mas la UI de evaluaciones con estos datos, para caso de uso real, los grupos de secundaria y media superior varian muchi entre materias". La semilla demo modela grupos de secundaria y media superior con su plan de materias y docentes, y promedios que difieren claramente entre materias.
- S7 — Rediseño con referencias: "tambien me gustaria que mejoraras la UI mas, busca pantallas en mobbin para inspirarte, principalmente la de resultados, implementa otro layout, ve sacando screenshots y usa impeccable para ver que es posible mejorar y mobbin para inspirarte de otras pantallas, tiene total permiso para rehacerlas sin conservar original". Resultados con un layout nuevo; Avance y Riesgo mejorados; capturas e Impeccable como evidencia.

## Tasks

- T1 — S2, S3 · inline · Modelo demo: reglas de evaluación (aprobatoria, materias para riesgo) con valor por defecto, comandos `evaluation-rules` y `grade-publish-batch`; derivaciones de avance, pendientes por docente y riesgo con pruebas. Commit: 4e53129
- T2 — S3 · inline · Semilla demo natural con un segundo periodo parcialmente capturado y calificaciones reprobatorias, sin alterar la semilla legacy. Commit: 96ff5ee
- T3 — S1, S3, S4 · inline · UI: pestañas Avance / En riesgo / Resultados, filtros compartidos, publicación por lote con confirmación, accesos a grupo y expediente, estilos. Pruebas de render. Commit: 051d2ca, 98c68a4
- T4 — S1–S4 · inline · Verificación: typecheck, lint, pruebas, revisión visual en navegador escritorio/móvil, detector de diseño. Commit: sin cambios de código propios (correcciones en 98c68a4)

- T5 — S5 · worker · Rediseño visual de las tres pestañas según referencias Mobbin, sin cambiar comportamiento. Commit: 2dc1960
- T6 — S6 · inline · Semilla: secundaria y media superior con plan de materias, docentes por materia y promedios por materia diferenciados en ambos periodos; pruebas ajustadas. Commit: 46a1db4
- T7 — S7 · worker · Resultados: nuevo layout inspirado en Mobbin, criticado con Impeccable y capturas desktop/móvil. Commit: 3daca1e
- T8 — S7 · worker · Avance y Riesgo: mejoras derivadas de la crítica y referencias, con datos ricos. Commit: 24d715c

## Log

- L1 — Usuario (pedido original de la implementación): "El rol si es control escolar, las materias reprobadas son configurables, por ahora solo me gustaria la UI que cubriera los casos de uso, y una ui mas pulida y limpia"
- L2 — Contexto previo: el usuario pidió primero diseñar los casos de uso de la UI de evaluación ("antes de reformularla, realmente me interesa disenar que casos de uso de deberia cubrir en realidad") y luego explorar la app "para delimitar y definir mejor la idea". El explorer mostró que captura, corrección y publicación individual ya viven en Grupo → Calificaciones y las asignaciones en Horario.
- L3 — Decisiones del orquestador (no pedidas explícitamente, reversibles): valores por defecto aprobatoria 6 y riesgo con 2 o más materias reprobadas; Avance y riesgo trabajan por periodo; riesgo considera valores capturados (publicados y borradores, señalados); Resultados conserva solo publicadas porque es lo que ve la familia. No existe estado "lista" en el modelo, así que no se inventa.
- L4 — Evidencia T1: `bun test scripts/evaluation-operations.test.ts` RED (módulo inexistente) → 7 pass; suite 216 pass.
- L5 — Decisión T2: el segundo periodo y las reprobadas se generan en la semilla base ("Periodo 2 · Muestra" → "Segundo trimestre") porque la migración legacy exige correspondencia 1:1 con la semilla natural; las calificaciones con historial de corrección no cambian de valor.
- L6 — Evidencia T3/T4: suite `bun test scripts apps/web/src` 220 pass / 0 fail; `tsc --noEmit` limpio; biome limpio en archivos de evaluación; `impeccable detect` sin hallazgos. Navegador (Vite :3217, datos demo frescos, 1280px y 390px sin overflow horizontal): Avance 15/62 → "Publicar 21 borradores" → confirmación → 36/62; criterio de riesgo cambiado a 1 y guardado; filtro de periodo cambia la lista de riesgo; "Ver expediente" abre el perfil del alumno. Correcciones visuales tras la revisión: pestañas con estilo compartido, sin H2 redundante, celdas planas, etiquetas de la gráfica por materia sin quiebre, evolución por periodo legible, pluralización.
- L7 — Usuario: "Ok la ui ya cubre los casos de uso, pero honestamente la ui es muy fea, usa mobbin para investigar pantallas de referencia"
- L8 — Usuario tras la propuesta de dirección (tres pestañas o solo Avance primero): "si avanza"
- L9 — Evidencia T5: rediseño hecho por gentle-ai-worker con referencias Mobbin; correcciones del orquestador tras revisión visual (chips de filtro y selects en una línea, escala del gráfico de evolución). Suite 220 pass / 0 fail, tsc y biome limpios; navegador 1440px y 390px sin overflow horizontal. Commit 2dc1960.
- L10 — Usuario: "Quiero todavia enriquecer mas la UI de evaluaciones con estos datos, para caso de uso real, los grupos de secundaria y media superior varian muchi entre materias, tambien me gustaria que mejoraras la UI mas, busca pantallas en mobbin para inspirarte, principalmente la de resultados, implementa otro layout, ve sacando screenshots y usa impeccable para ver que es posible mejorar y mobbin para inspirarte de otras pantallas, tiene total permiso para rehacerlas sin conservar original"
- L11 — Evidencia T6: semilla con 5 grupos de secundaria (plan de 8 materias, ciencia según grado), 2 de bachillerato semestral (7 materias c/u), 16 docentes en Personal, horarios sin choques de grupo ni docente; promedios por materia de ~6.2 (Física I) a ~9.3 (Educación Física); segundo periodo con cobertura variable por materia. Suite 221 pass / 0 fail, tsc y biome limpios. Prueba nueva escrita tras la implementación (sin RED observado). Los datos guardados en el navegador no se reemplazan: hay que borrar localStorage o usar "Agregar datos de ejemplo" para verlos.
- L12 — Crítica de capturas (`.impeccable/refs/eval2/before-*`): Avance desborda a 4871 px porque la matriz usa las 23 materias como columnas; Resultados: barras por grupo casi iguales sobre eje 0–10, lista alfabética de 23 materias que mezcla niveles, sin umbral aprobatorio ni reprobación, evolución desperdicia espacio. Referencias Mobbin (`.impeccable/refs/eval2/mobbin1/`): Steep (desglose por segmento con delta frente al promedio), Searchable/Gorgias/Front/Mixpanel (mapas de calor), Gumloop (histograma de distribución), AirOps (franja de KPIs + lista con barras).
- L13 — Decisión del orquestador (reversible): el nivel educativo se deriva del grado del grupo ("semestre" → Media superior, otro → Secundaria) y solo se muestra cuando hay más de un nivel; no se agrega campo nuevo al esquema.
- L14 — Evidencia T7: Resultados rehecho (selector de nivel, franja de 4 KPIs, ranking de materias con gráfica de puntos 5–10, rango entre grupos, línea aprobatoria, Δ y % reprobación; histograma; evolución; mapa de calor por nivel con leyenda). Tres rondas de revisión visual del orquestador; desborde horizontal causado por texto sr-only absoluto fuera del recorte del mapa (corregido con `position: relative`). Ancho de documento 1425/375 px a 1440/390. Suite 223 pass / 0 fail, tsc y biome limpios, detector `[]`. Capturas `.impeccable/refs/eval2/after-resultados-*`. Commit 3daca1e. Límite de corte: el corte de ~400 líneas quedó superado por la unidad de rediseño completa; se aceptan commits por tarea.
- L15 — Evidencia T8: Avance sin matriz materia-columna (fila por grupo con barra apilada y fichas por materia con leyenda; docentes ordenados por pendientes con detalle plegado; KPI "Grupos completos"); Riesgo con distribución 0·1·2·3+ materias reprobadas, nivel y enlace al grupo. `evaluation-charts.*` eliminado por no tener uso. Decisiones del worker: un grupo sin calificaciones esperadas no cuenta como completo; el filtro de nivel acota la publicación por lote y su confirmación. Ajustes del orquestador tras capturas: leyenda de estados y estilo del enlace de grupo en Riesgo. Ancho de documento 1425/375 px; suite 224 pass / 0 fail, tsc y biome limpios, detector `[]`. Capturas `.impeccable/refs/eval2/after-*`. Commit 24d715c.
