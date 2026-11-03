# Shared workspace surfaces

Use these primitives for consistent navigation and comparable records. They use the shadcn-style tokens exposed by `src/styles.css` (`@theme inline`); domain decisions stay in `src/modules/school`.

## Quick path

```tsx
<Panel heading="Equipos" description="Registro administrativo">
  <DataTable caption="Registro de equipos">
    <thead>
      <tr><th scope="col">Equipo</th><th scope="col">Acciones</th></tr>
    </thead>
    <tbody>
      {equipment.map((item) => (
        <tr key={item.id}>
          <th scope="row">{item.name}</th>
          <td><button type="button" onClick={() => open(item.id)}>Abrir equipo</button></td>
        </tr>
      ))}
      {!equipment.length && <EmptyTableRow columns={2}>No hay equipos.</EmptyTableRow>}
    </tbody>
  </DataTable>
</Panel>

<WorkspaceTabs
  label="Espacio de grupo"
  items={["Alumnos", "Horario"]}
  value={tab}
  onChange={setTab}
/>
```

Import each component from its named file. `styles.css` imports `primitives.css` once.

## Contracts

- **Panel:** required string `heading`, optional React-node `description`, semantic content as `children`. The heading names the section automatically. Put visible actions in children.
- **DataTable:** required string `caption`; compose native `thead`, `tbody`, `tr`, `th` and `td`. Always scope column and row headers. `EmptyTableRow` belongs inside `tbody`; `columns` must match the table.
- **WorkspaceTabs:** controlled string items, current value and change callback. Uses navigation buttons with `aria-current="page"`, not ARIA tabs. Tab/Shift+Tab and Enter/Space retain native behavior.
- **Scrolling:** `.ui-table-scroll` is a named, keyboard-focusable horizontal scroll region; long cells wrap. A mobile-only hint above the scroll region (“Desliza para ver todas las columnas”) makes offscreen columns discoverable without reaching the bottom scrollbar. Keep actions as visible buttons, never row-only click targets.

## Tailwind primitives

Styled only with Tailwind utilities over the `@theme` tokens (`bg-card`, `border-border`, `bg-teal-bg`, `text-teal-ink`…). Variants use `cva`, classes merge with `cn()`, every root has `data-slot` (plus `data-variant`, `data-tone`, `data-state` where relevant). Assert `data-*` in tests, never utility classes. All accept `className`.

```tsx
<Card as="article">
  <CardHeader><CardTitle>Avance</CardTitle><Badge tone="success">Al día</Badge></CardHeader>
  <CardContent>
    <Meter percent={72} label="Calificaciones publicadas" />
    <StatGrid label="Resumen"><Stat label="Publicadas" value={18} caption="72%" state="published" /></StatGrid>
  </CardContent>
</Card>
<FilterBar label="Filtros">
  <Select id="grp" label="Grupo" value={group} all="Todos" items={groups} onChange={setGroup} />
</FilterBar>
```

- **Tone** (`tone.ts`): `neutral | teal | lilac | sky | mustard | brick | brown | peach | lemon | success | warning | danger`.
- **Button:** `variant` default|primary|ghost|link|danger|icon, `size` default|sm|lg. Defaults to `type="button"`; min 44px height (icon: 44×44, needs `aria-label`). Base sets border/background explicitly over the legacy global `button` rule.
- **Card / CardHeader / CardTitle / CardContent / CardFooter:** `as` article|section (default section), optional `tone`, `padding` none|default|compact.
- **StatGrid / Stat:** `StatGrid label?` is a `<dl>`. `Stat` takes `label`, `value`, optional `caption`, and `tone` or `state` (published→success, draft→mustard, missing→brick, groups→teal).
- **Field / Select:** `Field id label` wraps any control whose id equals `id`. `Select id label value items all? onChange(value)`: label tied by `htmlFor`, disabled with “Sin opciones” when `items` is empty.
- **FilterBar:** `label` required; a `fieldset` row that wraps its children.
- **Badge:** `tone`.
- **Legend:** `label` (accessible list name) and `items: {tone, label, hollow?, id?}[]` rendered as dot list. `hollow` draws a ring in the tone colour (neutral → `input`) instead of a fill; `hook="data-status"|"data-state"` exposes each `id`. `success` fills use the mid green `bg-success-fill`; `text-success` stays the dark ink.
- **Avatar / AvatarStack:** `Avatar name size sm|md|lg tone` shows `initials(name)`. `AvatarStack names max=3 size` shows the rest as `+N`; the stack is labelled with all names.
- **EmptyState:** `text` required, `title="Sin registros"`, `icon` (an `IconName`, default `book`), optional `action`.
- **Meter:** `percent` (clamped 0–100, NaN→0), `label`, `tone`; `role="meter"` with `aria-valuenow`.
- **RankedBars:** `label`, `rows: {id, label, value 0–100, display, tone, onSelect?}[]`; rows with `onSelect` render a link-style button.
- **MiniMonth:** same props as the schedule sidebar picker (`selected`, `today`, `marks`, `onSelect`, `label`, `inRange`, `legend`). Arrows move by day/week, PageUp/PageDown by month, roving `tabindex`, `aria-pressed` for the covered range, aria-labels with “hoy” and marks.
- **Dialog:** native `<dialog>`; `open`, `onClose`, `title`, `children`. Opens with `showModal()`, closes on Escape or the labelled close button.
- **`initials(name)`** lives in `src/lib/initials.ts`.

## Table or list?

Use tables when users compare stable fields across records (Personal, Grupos, Terminales). Keep lists for narrative communications and chronological histories. Staff history stays in a disclosure within its table cell. Filtering, counts, callback payloads, permissions and storage do not belong in these primitives.

## Verification

Check empty rows, long names, keyboard scrolling, visible focus and disabled actions at narrow widths. The three directories share Panel/DataTable; SchoolApp, GroupWorkspace and StudentProfile share WorkspaceTabs.
