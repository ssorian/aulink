# UI consistency + Tailwind migration (apps/web)

Branch `feat/ui-tailwind` (from master after fast-forward merge of feat/schedule-redesign at 63f06d4). Move every screen to the minimal style using shadcn-like tokens, Tailwind utilities and shared components; reorganize modules/school by module.

## Specs
- S1: "Quiero que hagas consistente toda la ui, mas similar a como la hemos estado trabajando"
- S2: "por lo que he visto has trabajado con archivos css en lugar de usar tailwind quiero que crees un styles.css/globals.css o donde sea que se haga la configuracion de tailwind para hacer algo asi como lo que hace shadcn con ese archivo"
- S3: "e implementar todos los estilos en taiwlind"
- S4: "tambien quiero que lances explorers para reconocer y despues componentizar partes de toda la UI en sus respectivos modulos."
- S5 (decision): dependencies "clsx + tailwind-merge + cva (Recomendado)" — no Radix; native <dialog>/<select> stay.
- S6 (decision): "merge primero y despues nueva rama".
- S7 (decision): old screens (perfil del alumno, Inicio, directorios) — "Llevarlas al estilo mínimo (Recomendado)".
- S8 (decision): modules/school folders — "Sí, por módulo (Recomendado)": shell/, schedule/, evaluation/, communications/, conduct/, attendance/, grades/, students/, staff/, groups/, setup/, shared/.

- S9 (T3 contract, derived from S2-S4 + explorer map): every shared primitive lives in `apps/web/src/components/ui/<name>.tsx`, styled only with Tailwind utilities over the @theme tokens (bg-card, border-border, text-muted-foreground, bg-<tone>-bg, text-<tone>-ink, rounded-lg/xl…), variants via `cva`, class merging via `cn()` from `@/lib/utils` (relative import is fine), and a stable `data-slot="<name>"` (plus `data-variant` / `data-tone` / `data-state` where relevant) so tests never assert utility classes. Visual spec = the current minimal style (see `modules/school/group-tables.css` `.progress-card`, `.progress-stats`, `.progress-filters/.progress-filter`, `.grades-legend/.results-legend`, `.notice-*` post card, `.results-rows` bars, `schedule-calendar.css` `.schedule-mini*`). Primitives: Button (variant default|primary|ghost|link|danger|icon, size), Card (+CardHeader/CardTitle/CardContent/CardFooter, as article|section), StatGrid/Stat (label, value, caption?, tone/state), Field + Select (id, label, value, items, all?, onChange — API of the current `Select` in evaluation-progress.tsx), FilterBar (wrapper row), Badge (tone), Legend (label, items [{tone,label}] dots), Avatar + AvatarStack (name→initials, size, max with +N), EmptyState (title?, text, icon?, action?), Meter (percent, min?), RankedBars (rows [{id,label,value,display,tone,onSelect?}]), MiniMonth (same props as schedule-sidebar MiniMonth), Dialog (native <dialog> wrapper: open, onClose, title). `initials()` goes to `src/lib/initials.ts`. Callers are NOT migrated in T3.
- S10 (T4 contract, from S8): move files only; no behaviour or markup change. Mapping: shell/ = school-app, navigation, sidebar-nav(+test), home-view, home-summary; schedule/ = schedule-calendar(+css,+test), schedule-grid, schedule-sidebar, schedule-helpers, calendar-day-actions(+css,+test), calendar-workflows; evaluation/ = evaluation-dashboard(+css,+test), evaluation-progress, evaluation-risk, evaluation-results-view, evaluation-results(+test), evaluation-operations, evaluation-workspace.css; communications/ = communications-view, communication-summary, ui-refinement.test; conduct/ = conduct-view(+css,+test); attendance/ = attendance-view, attendance-record(+test), attendance-record-demo; grades/ = grades-view, grades-record(+test), grades-record-demo, student-grades, group-grades-table(+test); students/ = students-view(+css), students-layout.test, student-profile(+css,+test), student-summary(+test), experience, workflows-profile.test; staff/ = staff-view(+css), staff-layout.test, credentials-view; groups/ = group-workspace, group-followup-view, group-attendance-table(+test), group-context, group-table-helpers, group-directory.css, group-directory-layout.test; setup/ = setup-view, cycle-calendar(+css,+test), cycle-dates, flow-dialog(+test), flow-validation; shared/ = workflows, view-types, view-helpers, mock-data, seed-migration, demo, directory-components, directory.css, chip-tooltip(+css), profile-badge, group-tables.css. Move `Field` type out of flow-dialog into shared/view-types (re-export from flow-dialog) to avoid setup<->shared cycles. Update every import incl. scripts/*.test.ts and src/routes.

## Tasks
- T0 [S4] Explorers: styles, components, test coupling. Route: 3x gentle-ai-explore. ✅
- T1 [S6] Merge feat/schedule-redesign into master (ff) and branch feat/ui-tailwind. Route: inline. ✅
- T2 [S2,S5] Foundation: deps, `lib/utils.ts` cn(), styles.css as shadcn-like globals (:root tokens, @theme inline, @layer base, legacy purple/dead rules removed). Route: inline. Commit: (T2 commit) ✅
- T3 [S3,S4] Shared primitives in components/ui (Button, Card, Stat, Field/Select, Badge, Legend, Avatar, EmptyState, Meter, MiniMonth, Dialog, FilterBar) with data-slot hooks + tests + README. Route: inline.
- T4 [S4,S8] Move modules/school files into module folders; imports only. Route: inline.
- T5 [S1,S3] Evaluation → Tailwind + primitives; delete its CSS.
- T6 [S1,S3] Communications + Conduct.
- T7 [S1,S3] Groups (workspace, attendance/grades tables, directory).
- T8 [S1,S3] Schedule (calendar, grid, sidebar, day actions, chip tooltip).
- T9 [S1,S3,S7] Students (directory + profile to minimal style).
- T10 [S1,S3,S7] Staff + credentials directories.
- T11 [S1,S3] Setup, cycle calendar, flow dialog.
- T12 [S1,S3,S7] Shell + Inicio; delete remaining .css except styles.css.
- T13 Verification: suite, typecheck, Biome, detector, browser desktop+390.

## Log
- L1: "Quiero que hagas consistente toda la ui, mas similar a como la hemos estado trabajando, y por lo que he visto has trabajado con archivos css en lugar de usar tailwind quiero que crees un styles.css/globals.css o donde sea que se haga la configuracion de tailwind para hacer algo asi como lo que hace shadcn con ese archivo e implementar todos los estilos en taiwlind, tambien quiero que lances explorers para reconocer y despues componentizar partes de toda la UI en sus respectivos modulos."
- L2: explorer findings: single token source styles.css:94-141; unlayered global element rules beat Tailwind utilities (move to @layer base first); 3 card, 3 table, 4 avatar, 7+ empty-state implementations; ~17 test files assert class names → replace with data-slot/data-tone/data-variant; 6 pre-existing failures are stale expectations unrelated to CSS (kept as known baseline).
- L3: decisions S5-S8 answered. master fast-forwarded to 63f06d4 locally (no push).
- L4: T2 done. Visual-diff harness outside the repo (/tmp/aulink-vd: shoot.mjs = 17 screens x 1440/390 full-page via playwright-core on :3101; diff.py; cmp.py). Baseline noise ≤0.03% at 1440. After layering, all screens identical/noise except: group workspace shifted 16px because module `.group-back` (brick button, previously beaten by global `button.group-back`) now won -> dead module rule removed; perfil and "Agregar materia" show 2-4px gap/padding shifts (module rules now beat generic global button rules) — accepted, those screens are redone in T8/T9. Suite 329/6 known, typecheck clean.
