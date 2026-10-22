# Aulink

Monorepo con Bun workspaces para la aplicación web (TanStack Start) y móvil (Expo). Una sola instalación y un único `bun.lock` en la raíz.

## Documentación

- [PRD: requisitos y aceptación del piloto](docs/PRD.md).
- [ARD: arquitectura objetivo y decisiones técnicas](docs/ARD.md).

## Inicio rápido

Requiere Bun 1.4.2 (versión declarada en `package.json`). Desde este directorio:

```bash
bun install
bun run dev:web       # Web en http://localhost:3000
bun run dev:mobile    # Servidor de desarrollo Expo
```

Las variables de entorno de web permanecen en `apps/web/.env.local`. No subas archivos `.env` ni credenciales al repositorio.

## Estructura

```text
apps/
  web/       # TanStack Start, Vite, Drizzle y Better Auth
  mobile/    # Expo y React Native
scripts/
  monorepo.test.ts
package.json
bunfig.toml
bun.lock
```

Cada aplicación conserva su código, recursos y configuración. El instalador usa enlaces aislados para respetar las versiones de dependencias de cada app. No se han creado paquetes compartidos ni se han unificado las versiones de React.

## Comandos desde la raíz

| Comando | Acción |
| --- | --- |
| `bun run dev:web` | Iniciar web |
| `bun run dev:mobile` | Iniciar Expo |
| `bun run dev:android` | Abrir Expo en Android |
| `bun run dev:ios` | Abrir Expo en iOS (requiere un entorno compatible) |
| `bun run dev:mobile:web` | Iniciar la versión web de Expo |
| `bun run build:web` | Compilar web |
| `bun run build:android` | Generar APK Android local de prueba |
| `bun run typecheck` | Comprobar tipos de ambas aplicaciones |
| `bun run lint` | Ejecutar el lint de ambas aplicaciones |
| `bun run check:monorepo` | Verificar estructura y comandos del workspace |
| `bun run check:nativewind` | Verificar integración, resolución de Lightning CSS y compilación de estilos nativos |

Los comandos propios de cada aplicación siguen disponibles:

```bash
bun run --filter aulink-web db:studio
bun run --filter aulink-web db:generate
```

## APK Android local (preview)

Desde la raíz: `bun run build:android`. Requiere haber ejecutado `bun install`, Bash, un JDK y Android SDK/NDK/CMake compatibles con Expo, con `JAVA_HOME` y `ANDROID_HOME` configurados. No instala dependencias automáticamente ni usa EAS, subidas o emulador. Espera a que termine cualquier compilación Android en curso antes de ejecutarlo.

Ejecuta prebuild Android sin instalación y `assembleRelease` local (2 workers, heap 3072 MiB, metaspace 768 MiB; `CMAKE_BUILD_PARALLEL_LEVEL` por defecto 2). Solo tras el éxito copia el APK a `apps/mobile/artifacts/aulink-lector-preview.apk` e imprime su ruta absoluta. Si falla, no reemplaza el preview anterior.

Es un **preview con firma debug** de la configuración generada actual, no una entrega firmada para producción. Pruebas sin compilar Android: `bun test scripts/mobile-build.test.ts`.

## Dependencias

Ejecuta `bun install` en la raíz y conserva únicamente el lockfile raíz. Para añadir una dependencia web:

```bash
cd apps/web
bun add <paquete>
```

Para dependencias de Expo, usa su instalador para seleccionar versiones compatibles con el SDK:

```bash
cd apps/mobile
bunx expo install <paquete>
```

Consulta también las instrucciones de desarrollo móvil en [`apps/mobile/AGENTS.md`](apps/mobile/AGENTS.md).

## Estilos móviles: NativeWind 5 RC + Tailwind 4

Versiones fijadas: `nativewind 5.0.0-rc.0`, `react-native-css 3.1.0-rc.0`, `tailwindcss 4.1.18`, `@tailwindcss/postcss 4.1.18`, `postcss 8.5.6` y `lightningcss 1.30.1`. NativeWind v5 es RC; no confundir con v4 estable y Tailwind 3.

La configuración es **CSS-first**: tokens en `@theme` de `apps/mobile/src/global.css`, importado una vez por `src/app/_layout.tsx`. Metro usa `withNativewind(config)` y PostCSS usa `@tailwindcss/postcss`; no añadir el preset Babel de NativeWind v4 ni un `tailwind.config.js` de Tailwind 3. Los componentes React Native como `View` y `Text` admiten `className`; esto no garantiza interoperabilidad con `@expo/ui`.

El override raíz `@expo/metro-config.lightningcss = 1.30.1` debe controlar también la resolución efectiva desde Expo Metro: fijar solo la dependencia directa móvil no basta. No usar un override global de Lightning CSS que afecte al pipeline web. `bun run check:nativewind` comprueba ambas condiciones y compila tokens de color alternativos con PostCSS → compilador nativo, verificando `backgroundColor` resultante.

### Comprobación visual Android (manual, pendiente)

1. Conectar un dispositivo Android o iniciar un emulador compatible con el SDK de Expo y ejecutar `bun run dev:android` desde la raíz.
2. Abrir la pantalla inicial y comprobar que la muestra NativeWind tiene fondo azul de `bg-brand-600` (`#2563eb`), esquinas `rounded-xl` y texto legible, sin errores de Metro.
3. Recargar la app y repetir en temas claro y oscuro; guardar captura, dispositivo y versión para registrar el resultado.

Los tests y un bundle correcto no sustituyen esta revisión visual ni prueban interoperabilidad con todos los componentes nativos.

## Validación

`check:monorepo` valida la organización, no reemplaza las comprobaciones funcionales. El baseline móvil tiene un error de tipos por una referencia incompatible en `app-tabs.web.tsx` y un error de lint `react-hooks/set-state-in-effect` en `use-color-scheme.web.ts`; quedan fuera del alcance de la integración de estilos. `expo lint` puede generar configuración o intentar instalar dependencias: no aceptar esos cambios incidentalmente al validar. Los errores de web (Drizzle/autenticación en tipos y botón sin `type` en lint) se revisan por separado.
