# Shared workspace surfaces

Use these primitives for consistent navigation and comparable records. They reuse the existing cool-neutral surfaces and purple action tokens; domain decisions stay in `src/modules/school`.

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

## Table or list?

Use tables when users compare stable fields across records (Personal, Grupos, Terminales). Keep lists for narrative communications and chronological histories. Staff history stays in a disclosure within its table cell. Filtering, counts, callback payloads, permissions and storage do not belong in these primitives.

## Verification

Check empty rows, long names, keyboard scrolling, visible focus and disabled actions at narrow widths. The three directories share Panel/DataTable; SchoolApp, GroupWorkspace and StudentProfile share WorkspaceTabs.
