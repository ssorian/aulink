# Lector de asistencia

Modo: Operate. Ruta: `/reader`. Acceso desde el selector de hijos, independiente de la sesión familiar. Extensión ordinaria de demostración, no registro real ni nueva identidad visual. `DESIGN.md` y `PRODUCT.md` conservan su alcance y no se modifican; no se añaden tokens.

## Dirección y relación con el tema

Lector de un vistazo, sin tarjetas ni datos del alumno: «Por favor escanea tu credencial» centrado, icono debajo y acciones en el borde inferior seguro. Tipografía del sistema e iconos `SymbolView`; contenido desplazable con ancho máximo 640 y botones de altura mínima 48.

Comparado con `DESIGN.md` de familia, comparte morado #4C2D73, blanco, verde #C8EF9A y título 32/40, peso 600. Las diferencias locales ya presentes en el lector no son nuevos tokens globales: error #B42339 con blanco (familia: rojo #FFB4BB), tinta de éxito #263D16 (familia: #34204B), fondo de cámara #18121F, radio de botón 16 frente a 18 y padding horizontal de página 28 frente a 26. No usa el cristal ni el medallón de familia; estas diferencias se documentan, no se corrigen aquí.

## Flujo implementado

- Espera: «Escanear QR con cámara» abre la cámara de desarrollo; el botón está visible, no condicionado a una compilación de desarrollo. «Salir del lector» vuelve o reemplaza por `/` si no hay historial.
- Cámara trasera, solo QR. Solicita permiso mediante «Permitir cámara»; si no puede volver a pedirlo ofrece «Abrir ajustes» (en web muestra instrucciones). Los errores permiten reintentar o cancelar. «Cancelar» y el cierre solicitado del modal regresan a espera.
- Solo el texto exacto `aulink:asistencia:demo` produce éxito; cualquier otro QR produce error, sin normalización. «Probar éxito» y «Probar error» simulan ambos resultados incluso sin permiso de cámara. Nunca usar esta regla para validar credenciales reales.
- Éxito: fondo verde, palomita y «Asistencia registrada». «Siguiente» regresa a espera, no abre automáticamente la cámara.
- Error: fondo rojo, X y «Reintenta de nuevo». «Reintentar» vuelve a la cámara; «Omitir» regresa a espera sin registrar.
- Ambos resultados muestran «Demostración · No se guardan asistencias». No hay backend, persistencia ni apertura del contenido del QR.

## Movimiento, accesibilidad y ciclo de vida

El círculo crece desde el centro hasta cubrir las esquinas en 650 ms; el contenido aparece en 220 ms tras 350 ms de espera. Con reducción de movimiento, expansión y aparición del resultado son inmediatas y el modal no utiliza transición. Resultado con texto, icono y anuncio accesible; la espera queda fuera de interacción y accesibilidad mientras se muestra el resultado.

Se consume una sola lectura por intento. El resultado permanece hasta una acción, incluso al pasar a segundo plano. Al perder foco de navegación, el lector vuelve a espera y oculta el modal. En segundo plano se desmonta solo la cámara: el modal y el intento se conservan para no interrumpir los diálogos de permiso. Al regresar se consulta de nuevo el permiso (sin solicitarlo automáticamente), incluyendo cambios desde Ajustes, y puede reanudarse la cámara. La suscripción de ciclo de vida se retira al desmontar y la respuesta asíncrona del permiso evita actualizar estado tras desmontaje.

## Cámara nativa y evidencia

`app.json` configura el plugin `expo-camera`, lectura de códigos y `recordAudioAndroid: false`, con mensaje de permiso de cámara. El APK previo sin este módulo requiere reconstrucción nativa; una actualización JavaScript no basta.

Verificación comunicada por el padre: `bun test scripts`, 79 pruebas aprobadas; typecheck y lint móvil aprobados. No se ejecutaron de nuevo en esta pasada documental. Sin dispositivo físico ni emulador conectado: cámara nativa, permisos y lectura real pendientes. Smoke Playwright aprobado tras corregir controles SSR con `useHydrated`: espera, éxito, siguiente, error, reintento, cancelar, omitir, acceso desde selector, ancho 320 y reducción de movimiento, sin errores JavaScript. Capturas web de éxito/error revisadas; no equivalen a aprobación visual nativa.

Fuentes de esta pasada: `src/modules/reader/reader-screen.tsx`, `src/modules/reader/state.ts`, `app.json`, `DESIGN.md` y `PRODUCT.md`. La comparación es de código y documentación, no una certificación visual nativa.
