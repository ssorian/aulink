# Completar experiencia web escolar

## Objetivo y alcance autorizado
Completar las recomendaciones UI restantes tras la primera iteración: inicio operativo de la demo, publicación con audiencia explícita, formularios guiados y accesibles, y typecheck. El usuario pidió continuar todas hasta acabar. No implementar backend, permisos reales, terminal ni envío a familias; toda simulación debe identificarse.

## Criterios de aceptación
- Inicio calcula pendientes exclusivamente desde State y ofrece navegación coherente; no inventa salud de equipos ni sincronización.
- Comunicado muestra alcance, destinatarios verificados, vista previa y diferencia borrador/publicación local frente a envío/lectura no disponibles.
- Formularios enfocan entrada inicial, errores accionables asociados a campos, resumen de revisión y devuelven foco al cerrar. Cancelar conserva captura en memoria, no promete borrador durable.
- Mantener historial y datos de demo, no exponer notas internas como contenido familiar.
- Typecheck, pruebas escolares, lint de archivos afectados y build pasan; probar recorridos desktop y móvil en navegador.

## Riesgo y tamaño
Trabajo grande de interfaz, riesgo contenido: no alterar autorización, esquema persistido, algoritmos de asistencia ni publicación real. Las transiciones de dominio existentes siguen siendo autoridad. No hay high-risk item identificado.
Previsión: 3 unidades, aproximadamente 600–900 líneas totales incluyendo pruebas; dividir por comportamiento, no comprimir para cumplir presupuesto. No commits ni PR solicitados. Git no tiene commits y los archivos existentes están untracked: no existe diff basal para aislar revisión nativa; registrar ese límite sin afirmar aprobación.

## T1 — Inicio operativo de demo
Estado: terminado.
Evidencia: RED módulo ausente exit 1; GREEN 5 pruebas, 7 aserciones exit 0. Integración lint/typecheck exit 0. Navegador confirmó 4 tarjetas y navegación a Alumnos/Grupos/Comunicados/Configuración. El dominio no tiene estado de tutor pendiente: no se inventa.
Implementar componente y selectores puros con tests para pendientes verificables: borradores, vínculos de tutores pendientes si el modelo los distingue, configuración incompleta. Navegación mediante callbacks, wiring y estilos a cargo del padre.
Superficies: home-view.tsx, home-summary.ts, scripts/school-home.test.ts; wiring parent school-app.tsx y styles.css.

## T2 — Formularios y publicación segura en demo
Estado: terminado.
Evidencia: validación base RED módulo ausente y GREEN; corrección contextual RED conductual (grupo vacío se aceptaba) exit 1, GREEN 3 pruebas/22 aserciones exit 0. Navegador bloquea grupo vacío/alumno, alumno con grupo y enfoca destino; escuela sin destino avanza. Confirmar borra cache, cancelar conserva captura; publicación y cero tutores verificados sin residuos en datos.
Mejorar foco, validación por campo, revisión y retorno; comunicar audiencia, conteo y destinatarios, vista previa familiar y estados no disponibles. Mantener semántica actual de dominio y cache de captura.
Superficies: flow-dialog.tsx, flow-validation.ts, communications-view.tsx, communication-summary.ts, scripts/school-publishing-ui.test.ts. Parent styles.css.

## T3 — Integración, accesibilidad y verificación global
Estado: terminado para alcance web. Revisión nativa declinada para el candidato; no se creó lineage ni se afirma aprobación.
Drizzle corregido sin credenciales inventadas; typecheck exit 0. Skip-link probado con Tab/Enter: foco en main. Controles principales ≥44px y páginas sin desbordamiento a 390/320px; diálogo a 320px conserva scroll interno sin desbordamiento horizontal. Se oscurecieron texto secundario/placeholder/cabeceras con contraste insuficiente. Suite escolar final: 38 pruebas, 728 aserciones, exit 0. Lint de 7 archivos afectados exit 0. Build final exit 0, con avisos de dependencias sobre directivas use-client; sin errores.
Integrar Inicio, skip-link y mensajes accesibles sin perder contexto existente; corregir Drizzle URL undefined sin secreto inventado. Ejecutar suites, typecheck, build y navegador; corregir regresiones con pruebas proporcionales.
Superficies parent: school-app.tsx, styles.css, drizzle.config.ts, scripts adicionales si necesarios.

## Evidencia
- Verificación estática final: 38 pruebas, 728 aserciones, exit 0; typecheck y lint de 7 archivos exit 0. Formato corregido de forma acotada. Build exit 0.
- Navegador: foco inicial flow-name; primer inválido enfocado con tres errores; revisión enfocada; error de dominio «La matrícula ya existe» enfocado incluso al repetirse; cancelar restaura disparador y conserva captura en memoria.
- Confirmar un borrador limpia cache al reabrir. Publicación de fixture escolar mostró audiencia, texto público y 19 tutores, luego estado Publicado solo demo. Fixture individual sin tutores impide revisar publicación y permite editar. Se restauró el localStorage original en finally y se recargó: sin residuos de esos ensayos.
- Revisión encontró audiencia/destino incompatible admitido en captura; corrección T2 terminada y validada con RED/GREEN y navegador. Hallazgo estático de foco al repetir error fue refutado en navegador (alert/alert), no se cambió ese código.
- No atribuir los archivos completos preexistentes al trabajo de esta unidad. La evaluación nativa inicial no pudo aislar delta por archivos untracked. INSPECT seleccionó explícitamente los 11 archivos completos afectados; START devolvió consent-declined-this-candidate, lineage_created=false y mutation_performed=false. No hay aprobación nativa y no se reintentó esa revisión.
- Suite completa del repositorio: bun test scripts → 48 pasan, 0 fallan, 775 aserciones, exit 0. La suite escolar es un subconjunto de 38 pruebas.
- Typecheck web exit 0. La comprobación adicional bun run typecheck en la raíz devuelve exit 2 por tipos ref incompatibles en apps/mobile/src/components/app-tabs.web.tsx:38, archivo no modificado y fuera del alcance de esta mejora web. No se declara typecheck de monorepo aprobado.
- Capturas finales: .playwright-mcp/remaining-home-desktop.png, remaining-home-mobile.png y remaining-publication-review-desktop.png. Servidor de revisión local en http://localhost:3000.
