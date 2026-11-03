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
- S7: "Mhmmmm, ahora me gustaria que hicieras algo asi" (referencia: columna lateral con mini mes, categorías y panel extra; cabecera "‹ › rango · Week N · + Create"; días con abreviatura y número grande; bloques aireados con hora abajo; clases pasadas atenuadas; línea de hora actual).
- S8: Columna lateral = "Mini mes + Materias + Cambios (Recomendado)": mini mes con puntos en días con cancelaciones, reagendas o suplencias; Materias con casillas para filtrar y horas por semana; "Cambios de la semana" lista excepciones y lleva a su clase.
- S9: "Todo junto (Recomendado)": el layout nuevo incorpora la crítica: confirmar en el panel con Deshacer (cambios de una fecha), color fijo por materia sin chocar con estados, teclado (flechas, foco retenido en el panel, anuncio al guardar, aviso de choque al arrastrar), jerarquía (aviso compacto, textos ≥12 px de apoyo), panel sin "Programada" redundante y que no se cierra con scroll, clases de 30 min legibles, zona horaria legible, estado vacío, nombres claros.
- S10: Fin de jornada = "Línea en la grilla (Recomendado)": línea punteada a la hora de fin de jornada en cada día con etiqueta pequeña.

## Tasks
- T1 [S4,S6] Modelo: docente/suplente por fecha, editar materia/titular de una recurrencia, eliminar recurrencia; pruebas en scripts/group-schedule.test.ts. Route: inline. Risk: item 1 (formato guardado, aditivo). Commit: b789d4f ✅
- T2 [S1,S2,S3,S4] Grilla compartida con drag and drop + menú de clase; vista por fechas sin bloques inferiores. Route: inline. Commit: (este commit) ✅
- T3 [S5,S6] Vista Estructura semanal con selector de vista, arrastre, editar/eliminar y alta en hueco. Route: inline. Commit: (mismo commit que T2; comparten la grilla) ✅
- T4 [S1-S6] Verificación: pruebas, typecheck, biome, navegador. Route: inline. Commit: sin código ✅
- T5 [S9] `run` directo desde el calendario + Deshacer auditable (reaplica el estado previo, nunca borra registros). Route: inline. Commit: —
- T6 [S7,S8,S9,S10] Layout con columna lateral, cabecera nueva, grilla nueva (colores por materia, hora actual, fin de jornada, pasado atenuado, choque al arrastrar), panel con formularios en sitio, teclado. Route: inline. Commit: —
- T7 [S7-S10] Verificación: pruebas, typecheck, biome, navegador escritorio/móvil, detector impeccable. Route: inline. Commit: —

## Log
- L1 (solicitud original): "Quiero redisenar el calendario de horario de grupos, para pronto solo quiero conservar del calendario para arriba, asignando cosas como reagenda de clases a un drag and drop y cancelacion al hacer click sobre una clase se muestra la opcion de cancelar clase y editar, al dar click a editar se pueden hacer cosas como asignar otro maestro a esta, asignar un suplente etc. Ademas ahora tenemos una vista calendarizada semanal, eso esta bien, pero quiero otra vista practicamente igual solo para editar la estructura semanal de sus clases, es decir una muestra el horario por fechas miestra que otro solo lo estructura." (captura: pestaña Horario de 1° A)
- L2 decisiones: editar docente = "Solo esa fecha (Recomendado)"; drag and drop = "Confirmar con motivo (Recomendado)"; bloques inferiores = "Quitar los tres"; estructura = "Arrastrar para cambiar día u hora", "Clic para editar o eliminar", "Crear clase en un hueco".
- L3 accesibilidad: el menú de clase incluye "Reagendar…" como alternativa de teclado/táctil al arrastre.
- L4 evidencia T1: RED 5 fallas (acción desconocida / regla de asignación); GREEN 11/11 en scripts/group-schedule.test.ts. Suite completa: 7 fallas + 1 error idénticos en la base (preexistentes, ajenos).
- L5 evidencia T2/T3: 6 pruebas de componente (escritas después del código: sin RED). typecheck y Biome limpios. E2E en :3101 (origen aislado; el dev server :3000 del usuario estaba caído por OOM y no se tocó): menú de clase; suplente Karina Ortega Lara solo el 2 nov; arrastre Lunes→Martes abre "Reagendar Matemáticas al 3 nov 10:30" con 10:30–11:30; estructura: Historia Jueves→Viernes 08:00, hueco Sábado 09:00 precargado, Eliminar quita la serie, arrastrar serie con historial muestra el error y no cambia nada. Móvil 390px sin desbordamiento. Defecto visto y corregido: título de bloque colapsado por flex-shrink.
- L6 limitación: el drag and drop HTML5 no funciona con touch; en móvil se usa "Reagendar" desde el menú.
- L7 (usuario): "Mhmmmm, ahora me gustaria que hicieras algo asi" + captura de referencia (calendario semanal con columna lateral).
- L8 decisiones: lateral "Mini mes + Materias + Cambios (Recomendado)"; crítica "Todo junto (Recomendado)"; fin de jornada "Línea en la grilla (Recomendado)". Crítica previa: prioridad "Flujo de edición (P1)", alcance "Todo", confirmación "En el panel + Deshacer". Deshacer agrega un registro (no borra), según PRODUCT.md; anunciado al usuario sin objeción.
