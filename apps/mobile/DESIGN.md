---
name: Aulink · Familia
description: Interfaz nativa sencilla para consultar la situación escolar de un hijo.
colors:
  background: "#4C2D73"
  surface: "#5B3983"
  raised: "#684592"
  line: "#81619E"
  text: "#FFFFFF"
  muted: "#E0D4EE"
  green: "#C8EF9A"
  yellow: "#FFDA86"
  red: "#FFB4BB"
  ink: "#34204B"
  medallion-green: "#F7FBEF"
  medallion-green-ink: "#426625"
  medallion-yellow: "#FFFBEE"
  medallion-yellow-ink: "#775500"
  medallion-red: "#FFF4F5"
  medallion-red-ink: "#9C3349"
  medallion-neutral: "#FCF9FF"
  medallion-neutral-ink: "#5D4876"
  medallion-secondary: "#6D6079"
  glass: "rgba(255, 255, 255, 0.025)"
  glass-stroke: "rgba(255, 255, 255, 0.10)"
  glass-accent: "rgba(255, 255, 255, 0.085)"
  glass-nav: "rgba(255, 255, 255, 0.045)"
typography:
  title:
    fontSize: 32
    fontWeight: 600
    lineHeight: 40
    letterSpacing: -0.6
  body:
    fontSize: 17
    lineHeight: 25
  secondary:
    fontSize: 14
    lineHeight: 21
  demo:
    fontSize: 12
    lineHeight: 18
  section:
    fontSize: 22
    fontWeight: 600
    lineHeight: 30
  button:
    fontSize: 16
    fontWeight: 600
    lineHeight: 24
  status:
    fontSize: 44
    fontWeight: 600
    lineHeight: 50
    letterSpacing: -0.8
  status-compact:
    fontSize: 36
    fontWeight: 600
    lineHeight: 41
    letterSpacing: -0.8
rounded:
  avatar: 16
  button: 18
  badge: 20
  compact-avatar: 12
spacing:
  row-gap: 12
  list-gap: 8
  content-horizontal: 26
  content-top: 18
  content-bottom: 28
  button-padding: 16
  list-vertical: 22
components:
  button-history:
    backgroundColor: "{colors.glass-accent}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "{spacing.button-padding}"
  badge:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.badge}"
  avatar:
    textColor: "{colors.ink}"
    rounded: "{rounded.avatar}"
    width: 48
    height: 48
---

# Design System: Aulink · Familia

## Overview

Interfaz sencilla: fondo morado, texto blanco y acentos verdes, amarillos y rojos. El estado actual del hijo tiene prioridad; su identidad permanece visible. Aplicación de teléfono React Native, adaptativa a iOS y Android, con implementación nativa como fuente visual, no una composición web aprobada.

Alcance: UI actual de `src/modules/family`. Fuentes: `PRODUCT.md`, `theme.ts`, `components.tsx` y `home-screen.tsx` dentro de ese módulo. El tema del starter legado no gobierna las nuevas pantallas de familia. Los tokens del frontmatter son normativos para este alcance; los números dimensionales representan unidades de React Native, no píxeles físicos.

**Key Characteristics:**
- Estado actual protagonista y contexto del hijo visible.
- Superficies moradas, tipografía blanca y acentos funcionales.
- Navegación sencilla y datos de demostración identificados.

## Colors

### Primary
`background` sostiene la pantalla; `surface` ofrece una capa tonal. `raised` está declarado en la paleta, pero no tiene aplicación observada en los componentes leídos.

### Secondary
`green` identifica el CTA de historial y el punto de marca. El estado obtiene su acento de `status.tone`; no asignar significados nuevos a `green`, `yellow` o `red` sin consultar la lógica de asistencia.

### Neutral
`text` sirve al contenido principal; `muted`, al apoyo y la nota demo; `ink`, al texto sobre acentos claros; `line`, a los separadores. No depender solo del color: el estado incluye texto e icono.

## Typography

No se declara `fontFamily`: se utiliza la UI del sistema nativo, SF en iOS y Roboto en Android, sujeta a la configuración del sistema. No existe una fuente display añadida ni una familia web normativa.

`title`, `body`, `secondary`, `section`, `demo` y `button` recogen los estilos compartidos. `status` es el titular oscuro dentro del medallón; cambia a `status-compact` cuando el ancho es menor de 360. Los títulos de más de 18 caracteres usan 34 (o 28 en compacto), con interlineado de 1.13. El contenedor tiene altura mínima, no fija, para permitir crecimiento del texto nativo. No hay una escala proporcional tipográfica declarada.

## Layout

`Screen` pinta un fondo opaco propio con `FamilyAtmosphere` antes de `SafeAreaView` y `ScrollView`. Esto evita que las escenas retenidas de navegación se superpongan al usar cristal. La esfera conserva las coordenadas de ventana para alinear el fondo de cada escena con el target nativo compartido. Contenido centrado, ancho completo y máximo de 640; no hay layout específico de tablet.

Composición fijada por el usuario: elegir hijo → Inicio con estado aproximadamente en dos tercios de pantalla e historial debajo → pestañas Calificaciones / Inicio / Avisos. Es una decisión de esta superficie, no una plantilla universal. En el Inicio leído, la altura mínima del bloque de estado es `Math.max(420, height * 0.63)`, con padding vertical de 24; no equivale a una medición certificada de dos tercios. La descripción bajo el título se retiró por petición del usuario. Se conserva el evento de entrada/salida y se muestra «Salida aún no registrada» solo si existe entrada sin salida. El historial usa margen superior automático.

El selector de Inicio tiene objetivo mínimo de altura 48, avatar compacto de 36 y chevrón; el encabezado compartido muestra además nombre y grupo. La implementación de las pestañas y del listado inicial no se inspeccionó para este documento.

Referencias aportadas, no composiciones aprobadas ni verificadas aquí: [Meta Quest · selector de contexto](https://mobbin.com/screens/d2f52711-5793-472e-9ee0-0e21747aa467) y [Hims · prioridad del estado actual](https://mobbin.com/screens/1fda61b6-f5ae-4921-b07e-9ca9aaddb864).

## Elevation & Depth

El cristal se concentra en navegación e historial. Los controles usan un material más discreto, los encabezados de alumno y el indicador de salida no llevan paneles. El borde superior refleja más luz; laterales y borde inferior se atenúan, sin sombras añadidas.

`GlassBackdrop` define tres materiales: control (intensidad 22), acción (52) y navegación (68). El tinte es neutro, no un bloque morado o verde sólido. iOS compatible usa Liquid Glass con comprobaciones de API; Android 12+ usa `expo-blur` con `dimezisBlurViewSdk31Plus` y un solo `BlurTargetView` de fondo compartido. Android anterior conserva el fallback ligero; iOS anterior usa BlurView. En web, blur de 11/26/34 px y saturación 125 %. La reducción de transparencia de iOS y del navegador sustituye el cristal por una superficie opaca.

Detrás del estado hay una sola esfera desenfocada estática, tintada con el acento semántico. La nebulosa texturada fue rechazada por el usuario y no forma parte del sistema. La máscara alfa local `assets/images/status-orb.png` se reproduce mediante `scripts/generate-status-orb.py`, sin cómputo de ruido ni animación en runtime.

## Shapes

Avatares y botón comparten esquinas suaves; el avatar compacto y la insignia tienen sus propios radios del frontmatter. El indicador del evento es un círculo de 8 con radio 4. No se observa una biblioteca de tarjetas o campos de entrada.

## Components

- **Evaluación de calificaciones:** cuatro botones compactos en una fila («Total», «Eval. 1», «Eval. 2», «Eval. 3»), con etiquetas accesibles completas y estado seleccionado. Altura mínima 48 y altura adaptable al texto; solo la opción activa lleva cristal discreto y texto verde. Total usa cabecera «Promedio / 10» y marca «Parcial · n/3» cuando faltan evaluaciones publicadas. Los filtros siguen visibles en estados vacíos.

- **Historial:** cristal neutro de acción, texto blanco e iconos verdes, altura mínima 58 y padding del token. Etiqueta «Historial de asistencias». Abre `/attendance`.
- **Selector de hijo:** `Pressable` con etiqueta accesible que incluye el hijo actual; abre `/?change=1`. El encabezado compartido usa avatar, nombre, grupo y chevrón.
- **Volver:** acción con icono y texto, altura mínima 48; vuelve si hay historial de navegación y, en otro caso, reemplaza por `/home`.
- **Estado:** nombre pequeño blanco fuera de un medallón orgánico claro. Dentro: icono de 46, titular en tinta oscura, registro de entrada/salida y salida pendiente si corresponde. La superficie varía entre verde, amarillo, rojo o neutro muy pálidos; icono/evento usan los acentos oscuros del medallón para conservar contraste. Dos capas blancas giradas (+10°/−8°, opacidades 0.10/0.17) siguen la referencia aportada por el usuario. Las dos capas traseras giran lentamente en sentidos opuestos (28 s y 36 s por vuelta); la superficie frontal y todo el contenido quedan fijos. La animación se cancela al perder foco, pasar a segundo plano o activar reducción de movimiento. SVG propio `attendance-shape.svg`, curvas cúbicas sin filtros, cargado con expo-image; textos e iconos siguen siendo nativos. Solo se muestra evento secundario si existe entrada o salida; no repetir el estado como subtítulo. Titular con rol de encabezado y región viva `polite`.
- **Insignia y filas:** estilos compartidos disponibles; insignia con padding horizontal 12 y vertical 6, filas con divisor inferior. No se documentan variantes no observadas.
- **Iconos:** `SymbolView` con nombres por plataforma (SF Symbols en iOS y equivalentes Android); tamaño predeterminado 24. Los ejemplos del sidecar omiten iconos antes que inventar sus trazados.
- **Respuesta táctil:** tinte blanco translúcido durante la pulsación, sin reducir la opacidad del cristal. No se anima la opacidad de paneles de cristal. La única animación continua vive en las capas posteriores del medallón. Navegación inferior con borde y esquinas de 24.

Los snippets HTML/CSS del sidecar son muestras aisladas de estilos para el panel, no componentes ejecutables de React Native ni certificación de equivalencia nativa.

## Do's and Don'ts

### Do:
- **Do** conservar el contexto del hijo y la prioridad del estado actual.
- **Do** usar la paleta de familia y la tipografía nativa del sistema.
- **Do** identificar los datos ficticios con «Datos de ejemplo» y acompañar el color con texto.
- **Do** usar títulos operativos: «Tus hijos», «Cambiar hijo», «Asistencias», «Avisos»; retirar eslóganes y descripciones duplicadas.

### Don't:
- **Don't** aplicar el tema legado a las nuevas pantallas de familia.
- **Don't** inventar fuentes display, rampas tonales, animaciones o estados no observados.
- **Don't** presentar los snippets web como validación nativa: faltan capturas y pruebas visuales en dispositivos, escalado de texto, contraste y tecnologías de asistencia.
