# Expediente del alumno: pestaña Resumen

Rediseño del detalle de alumno (`student-profile.tsx`): unificar Inscripciones, Tutores y Credenciales en Resumen,
dar a Asistencia, Calificaciones y Conducta un modo propio de alumno y homogeneizar encabezados, badges y textos.

## Specs

- S1. Pestañas: "Resumen" · "Asistencia" · "Calificaciones" · "Conducta"; Resumen abre por defecto.
- S2. Encabezado como el de Grupo: nombre como título, subtítulo con matrícula, grupo activo y ciclo actual; acciones del alumno ("Reinscribir en otro ciclo", "Cambiar de grupo") a la derecha.
- S3. Resumen › Inscripción: ciclo actual primero y marcado "Actual"; el grupo es un enlace al grupo; "Inscripción original" solo cuando difiere del activo; cambios de grupo con etiquetas (Motivo, Registró) y sin inventar fecha; ciclos anteriores en un desplegable.
- S4. Resumen › Tutores ("tutor es el padre de familia"): lista de padres o tutores con estado, "Vincular tutor", "Restringir o revocar" e historial en un desplegable.
- S5. Resumen › Credencial: revisión vigente con su motivo, acción para reemitir, revisiones anteriores en un desplegable; sin repetir nombre y matrícula.
- S6. Resumen › Pendientes: conteo de calificaciones en borrador y reportes de conducta sin publicar, cada uno lleva a su pestaña; si no hay, lo dice.
- S7. Asistencia en la ficha: sin filtro de alumno, sin botón de jornada de muestra, sin el nombre repetido en cada evento y sin el aviso de "expediente individual".
- S8. Calificaciones en la ficha: tabla por ciclo (actual primero) con Materia, Evaluación, Calificación, Estado y Acciones; correcciones y publicación se conservan.
- S9. Conducta en la ficha: título propio, botón para registrar con el alumno y su grupo actual ya fijados, sin repetir el nombre, estado vacío coherente. La vista de Grupos no cambia.
- S10. Textos de botones sin barras ("Emitir / reemitir", "Justificar / corregir") y un solo estilo de badge de estado en la ficha.

## Tasks

- T1 [S1–S6, S10] Encabezado + Resumen (inline) — commit: —
- T2 [S7, S9, S10] Asistencia y Conducta en modo alumno (inline) — commit: —
- T3 [S8] Calificaciones como tabla (inline) — commit: —
- T4 Verificación visual + detector + suite completa (inline) — commit: —

Risk: item 3 parcial: `ConductView` se comparte con Grupos › Seguimiento, así que hay que probar que esa vista no cambie.

## Log

- L1 (usuario): "Necesito que cheques el detalle de alumnos y sus pestanas, necesito que juzgues la UI, cheques si hay pestanas que se pueden unificar en una nueva llamada resumen, necesito que veas inconsistencias, cosas feas, areas donde pueda mejorar y proponme algo."
- L2 (usuario): "tutor es el padre de familia, si vas a implementar commitea los cambios actuales"
- L3: Cambios previos commiteados: 49e26d6 (directorio de alumnos), ea8e931 (directorio de personal + chip-tooltip).
- L4: Decisión: las acciones van como botones en el encabezado, igual que en Grupo, sin menú desplegable; la pestaña no va en la URL porque la app navega por estado y no por rutas. Los cambios de grupo no tienen fecha en el modelo, así que no se inventa.
