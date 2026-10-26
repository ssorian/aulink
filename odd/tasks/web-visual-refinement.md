# Refinamiento visual de la administración web

## Solicitud y límite
El usuario solicita SOLO mejorar la interfaz: percibe diseño sintético y poco contraste. Pide referencias Mobbin, correcciones con Impeccable y Judgment Day final. No cambiar datos, reglas, navegación funcional, formularios ni estados reales. No añadir métricas/gráficas ficticias ni backend. No commits.

## Dirección elegida por el usuario
Morado profundo + neutros cálidos: navegación oscura que ancla la composición, canvas cálido claro y superficies blancas, texto oscuro legible, morado para acción/selección; verde y ámbar únicamente en estados ya existentes y siempre con texto. Conservar identidad Aulink e iconos SVG accesibles.
Modo Impeccable: Operate. Refinamiento del mundo existente, no rebrand ni nuevo producto.

## Referencias observadas
- Asana: https://mobbin.com/screens/a28d698c-7c94-4911-b915-109f260f565b — contraste entre navegación oscura y trabajo claro; no copiar su composición ni sus ilustraciones.
- Stripe: https://mobbin.com/screens/673e89af-fe9e-4ab9-ac27-435dedf21888 — jerarquía de contenido y color para estados, sin inventar gráficas.
Se examinaron las imágenes devueltas por Mobbin. Aviso de uso mostrado al usuario.

## Calidad y criterios
- Desterrar la lavanda omnipresente, los bloques iguales y los avisos que desplazan los datos fuera del primer viewport.
- Sidebar oscura legible, actividad distinguible por forma/fondo/texto; móvil conserva navegación accesible y controles ≥44px.
- Inicio como resumen compacto y composición diferenciada: no cuatro tarjetas flotantes iguales ni decoración de hero-métricas.
- Contenido manda: tipografía de producto, sin kickers/eyebrows decorativos, sin halos, gradientes o ilustraciones impostadas. Conservar copy factual y límites de demo visibles.
- Directorio, comunicados, grupos/configuración y modal comparten tokens de fondo, texto, borde, acción y estados, sin cambiar flujos.
- Texto y placeholders ≥4.5:1; texto grande/controles/iconos/foco ≥3:1. Revisar pares computados, teclado y desbordamiento 320/390/768/1440.

## T1 — Refinar shell y superficies
Estado: terminado.
Diff de alcance visual: 267 líneas (246 añadidas, 21 eliminadas) frente al baseline propio de cuatro archivos. Sidebar morado profundo, canvas cálido, resumen de Inicio compacto y subdividido, avisos más compactos, estados publicados/borrador con color semántico y destinatarios en details accesible. Iconos conservados en el resumen sin chips decorativos. No handlers ni cálculos cambiados.
Superficies autorizadas: apps/web/src/styles.css; apps/web/src/modules/school/home-view.tsx; apps/web/src/modules/school/school-app.tsx; apps/web/src/modules/school/communications-view.tsx.
Cambio principalmente CSS con mínimos hooks semánticos/markup. No tocar handlers, helper de dominio, conteos ni texto factual. CSS actual es legado con overrides: preferir un bloque final cohesivo tokenizado sin reformat masivo ni más de una iteración acumulada. Mantener selectores existentes si lo necesitan pruebas/recorridos. Previsión: una unidad visual ~250–400 líneas honestas; la verificación y juicio se registran aparte, no comprimir para cuadrar presupuesto.

## T2 — Verificar con Impeccable y navegador
Estado: verificaciones manuales/funcionales terminadas; detector automático no disponible por timeout.
Evidencia previa al juicio: 50 pruebas/781 aserciones exit0; lint de tres TSX afectados, typecheck web y build exit0 (avisos use-client de dependencias preexistentes). Cinco vistas × cuatro anchos 320/390/768/1440 sin desbordamiento horizontal; navegación 44px; details de destinatarios abre por teclado; foco inicial/invalid/cancelar conservado. 346 muestras de texto computadas sin fallos (mínimo5.56:1); bordes de controles muestreados≥3:1; foco sidebar visible3px. Capturas de Inicio/directorio/comunicados/formulario/grupos/configuración inspeccionadas.
Detector intentado una sola vez sobre tres TSX y URL390px: exit1 por Navigation timeout30000ms. Su JSON[] NO se interpreta como limpio ni se reintentó.
Leer context una sola vez (ejecutado), colorize/Operate/polish y craft-floor antes de editar. Impeccable detect una sola vez sobre markup cambiado al finalizar cambios; registrar exit0 limpio o exit2 hallazgos y analizar evidencia. No confundir detección mecánica con calidad visual. Funcionalidad inalterada: no hay RED significativo para color/espaciado; mantener suite existente y validar browser/contrastes. Si surge cambio de comportamiento, aplicar test-first.

## T3 — Judgment Day independiente
Estado: cerrado con JUDGMENT: ESCALATED; dos puntos pendientes, no aprobación.
Snapshot inicial inmutable de20archivos (fuentes4, before4, diff y evidencia): .atl/visual-refinement/judgment-initial. initial_review_tree sha256:a3f4d1ea10686eb3f4b595e6f26564dff878e96d2bfcfb76cdc76389f338bc2b. Jueces A y B corrieron ciegos en paralelo, con idéntico target/criterios/skills y sin refuters. B devolvió rows vacías; A emitió JD-A-001 (destinatarios cerrados por defecto) y JD-A-002 (grupos aún en card-grid), ambos ERROR. Filas originales congeladas con SHA25614f08e6fe14de8cde6c7ca97202965a796d64aab5d07889920ea6d9b3bcff26c. El despacho fix fue rechazado antes de arrancar por contrato que admite solo BLOCKER/CRITICAL. No se infló severidad ni se usó otra ruta para saltar ese guard. Cero rondas aplicadas y cero rejuicios: ambos puntos siguen sin resolver.
Verificación final exactamente una vez: integridad del snapshot y coincidencia con fuentes actuales,50tests/781aserciones, lint de3TSX, tsc web y build exit0. Smoke final navegador: destinatarios accesibles por teclado, foco inicial modal y390px sin overflow. Dictamen y evidencia: .atl/visual-refinement/judgment-result.json. El veredicto escalado es del controlador sobre estos resultados, no autoridad emitida por los actores ni permiso de entrega.
Congelar snapshot completo de alcance final e imágenes/evidencia; guardar hash árbol SHA256 y hashes por archivo fuera de las superficies de edición. Lanzar exactamente dos jueces ciegos en paralelo con mismo target/skills/criterios. Candidatos en JSON canónico, no prosa autoritativa. Congelar filas severas antes de una corrección autorizada; máximo dos rondas y re-juicio acotado a IDs y diff, sin descubrimiento nuevo. Warnings/suggestions solo informativos. Final verification exactamente una después del juicio y veredicto APPROVED si no quedan severos y checks pasan; de lo contrario ESCALATED. No revisión nativa implícita ni permiso de entrega.

## Evidencia
Fuentes, before, source.diff y evidencia congelados en .atl/visual-refinement/judgment-initial y manifest.json; datos de contraste en contrast-evidence.json, responsive-evidence.json y check-evidence.json. Impeccable context se ejecutó una sola vez, guías colorize/Operate/polish/craft-floor leídas. Referencias Mobbin vistas y citadas; detector real intentado una sola vez y falló, sin afirmar aprobación mecánica.
El repo no tiene commits y figura todo untracked; el snapshot propio distingue el cambio visual actual de archivos completos preexistentes. Error de ref en móvil fuera de alcance conocido; no declarar typecheck monorepo limpio. Emulación Chromium, no dispositivo físico ni audio de lector de pantalla. El botón flotante TanStack es tooling de desarrollo preexistente, no parte del diseño nuevo.
