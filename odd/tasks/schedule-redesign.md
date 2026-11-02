# Rediseño del horario de grupos
Rediseña la pestaña Horario del grupo: solo calendario y cabecera, interacciones directas (drag and drop, clic) y una segunda vista de estructura semanal sin fechas.
Branch: feat/schedule-redesign. Demo local; sin backend ni terminales.

## Specs
- S1: "para pronto solo quiero conservar del calendario para arriba" — se quitan los tres bloques inferiores: detalle del día, ventana de fin de jornada y "Materias y recurrencias" (decisión: "Quitar los tres").
- S2: "asignando cosas como reagenda de clases a un drag and drop" — en la vista por fechas, arrastrar una clase a otro día u hora abre "Confirmar con motivo": diálogo con el nuevo horario precargado y campo de motivo.
- S3: "cancelacion al hacer click sobre una clase se muestra la opcion de cancelar clase y editar" — clic en una clase muestra las opciones Cancelar clase y Editar.
- S4: "al dar click a editar se pueden hacer cosas como asignar otro maestro a esta, asignar un suplente etc." — alcance: "Solo esa fecha (Recomendado)"; el titular se cambia en la vista de estructura.
- S5: "ahora tenemos una vista calendarizada semanal, eso esta bien, pero quiero otra vista practicamente igual solo para editar la estructura semanal de sus clases, es decir una muestra el horario por fechas miestra que otro solo lo estructura."
- S6: En la vista de estructura: "Arrastrar para cambiar día u hora", "Clic para editar o eliminar", "Crear clase en un hueco".

## Tasks
- T1 [S4,S6] Modelo: docente/suplente por fecha, editar materia/titular de una recurrencia, eliminar recurrencia; pruebas en scripts/group-schedule.test.ts. Route: inline. Risk: item 1 (formato guardado, aditivo). Commit: b789d4f ✅
- T2 [S1,S2,S3,S4] Grilla compartida con drag and drop + menú de clase; vista por fechas sin bloques inferiores. Route: inline. Commit: (este commit) ✅
- T3 [S5,S6] Vista Estructura semanal con selector de vista, arrastre, editar/eliminar y alta en hueco. Route: inline. Commit: (mismo commit que T2; comparten la grilla) ✅
- T4 [S1-S6] Verificación: pruebas, typecheck, biome, navegador. Route: inline. Commit: sin código ✅

## Log
- L1 (solicitud original): "Quiero redisenar el calendario de horario de grupos, para pronto solo quiero conservar del calendario para arriba, asignando cosas como reagenda de clases a un drag and drop y cancelacion al hacer click sobre una clase se muestra la opcion de cancelar clase y editar, al dar click a editar se pueden hacer cosas como asignar otro maestro a esta, asignar un suplente etc. Ademas ahora tenemos una vista calendarizada semanal, eso esta bien, pero quiero otra vista practicamente igual solo para editar la estructura semanal de sus clases, es decir una muestra el horario por fechas miestra que otro solo lo estructura." (captura: pestaña Horario de 1° A)
- L2 decisiones: editar docente = "Solo esa fecha (Recomendado)"; drag and drop = "Confirmar con motivo (Recomendado)"; bloques inferiores = "Quitar los tres"; estructura = "Arrastrar para cambiar día u hora", "Clic para editar o eliminar", "Crear clase en un hueco".
- L3 accesibilidad: el menú de clase incluye "Reagendar…" como alternativa de teclado/táctil al arrastre.
- L4 evidencia T1: RED 5 fallas (acción desconocida / regla de asignación); GREEN 11/11 en scripts/group-schedule.test.ts. Suite completa: 7 fallas + 1 error idénticos en la base (preexistentes, ajenos).
- L5 evidencia T2/T3: 6 pruebas de componente (escritas después del código: sin RED). typecheck y Biome limpios. E2E en :3101 (origen aislado; el dev server :3000 del usuario estaba caído por OOM y no se tocó): menú de clase; suplente Karina Ortega Lara solo el 2 nov; arrastre Lunes→Martes abre "Reagendar Matemáticas al 3 nov 10:30" con 10:30–11:30; estructura: Historia Jueves→Viernes 08:00, hueco Sábado 09:00 precargado, Eliminar quita la serie, arrastrar serie con historial muestra el error y no cambia nada. Móvil 390px sin desbordamiento. Defecto visto y corregido: título de bloque colapsado por flex-shrink.
- L6 limitación: el drag and drop HTML5 no funciona con touch; en móvil se usa "Reagendar" desde el menú.
