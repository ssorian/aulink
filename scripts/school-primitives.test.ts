import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { StaffRoleAction, StaffView } from "../apps/web/src/modules/school/staff/staff-view";
import { DevicesView } from "../apps/web/src/modules/school/staff/credentials-view";
import { GroupDirectory } from "../apps/web/src/modules/school/groups/group-workspace";
import { initialState } from "../apps/web/src/modules/school/shared/workflows";

const requireWeb = createRequire(
	new URL("../apps/web/package.json", import.meta.url),
);
const { createElement } = requireWeb("react");
const { renderToStaticMarkup } = requireWeb("react-dom/server");
const render = (component: unknown, s = initialState()) =>
	renderToStaticMarkup(
		createElement(component, { s, open: () => {}, onSelect: () => {} }),
	);

for (const [component, caption, action, columns] of [
	[StaffView, "Directorio del personal", "Cambiar responsabilidad", 4],
	[GroupDirectory, "Directorio de grupos", "Abrir grupo", 6],
	[DevicesView, "Registro de equipos", "Desactivar equipo", 4],
] as const) {
	test(`${caption}: semantic table, scoped headers and visible actions`, () => {
		const s = initialState();
		s.staff = [
			{ id: "staff", name: "Docente Ejemplo", role: "Docente", history: [] },
		];
		s.devices = [
			{ id: "device", name: "Entrada", active: true, reason: "Alta" },
		];
		const markup = render(component, s);
		expect(markup).toContain(`<caption>${caption}</caption>`);
		expect(markup.match(/<table/g)).toHaveLength(1);
		expect(markup.match(/scope="col"/g)).toHaveLength(columns);
		expect(markup).toContain('scope="row"');
		expect(markup).toMatch(/class="ui-table-scroll[ "]/);
		expect(markup).toContain(
			'<p class="ui-table-scroll-hint">Desliza para ver todas las columnas</p>',
		);
		expect(markup.indexOf('class="ui-table-scroll-hint"')).toBeLessThan(
			markup.search(/class="ui-table-scroll[ "]/),
		);
		expect(markup).toContain('tabindex="0"');
		expect(markup).toContain(action);
	});
	test(`${caption}: empty state remains inside the table`, () => {
		const s = initialState();
		s.staff = [];
		s.groups = [];
		s.devices = [];
		const markup = render(component, s);
		expect(markup).toContain(`<td colSpan="${columns}"`);
		expect(markup).toContain('class="ui-table-empty"');
	});
}

test("administration breadcrumb does not repeat its root", async () => {
	const { schoolBreadcrumb } = await import(
		"../apps/web/src/modules/school/shell/school-app"
	);
	expect(schoolBreadcrumb("Administración", "Terminales")).toBe(
		"Administración / Terminales",
	);
	expect(schoolBreadcrumb("Comunidad escolar", "Alumnos")).toBe(
		"Administración / Comunidad escolar / Alumnos",
	);
	expect(schoolBreadcrumb("Inicio", "Inicio")).toBe("Administración / Inicio");
});

test("equipment registry keeps inactive actions disabled and connectivity caveat", () => {
	const s = initialState();
	s.devices = [
		{
			id: "off",
			name: "Equipo desactivado",
			active: false,
			reason: "Retirado",
		},
	];
	const markup = render(DevicesView, s);
	expect(markup).toContain('disabled=""');
	expect(markup).toContain("Desactivado en el registro");
	expect(markup).toContain(
		"El estado del registro no indica si el equipo físico está conectado.",
	);
});

test("workspace navigation is controlled, current-marked native buttons", async () => {
	const { WorkspaceTabs } = await import(
		"../apps/web/src/components/ui/workspace-tabs"
	);
	const props = {
		label: "Secciones",
		items: ["Uno", "Dos"],
		value: "Dos",
		onChange: () => {},
	};
	const markup = renderToStaticMarkup(createElement(WorkspaceTabs, props));
	expect(markup).toContain(
		'<nav class="workspace-tabs" aria-label="Secciones">',
	);
	expect(markup.match(/type="button"/g)).toHaveLength(2);
	expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
	expect(markup).toContain('aria-current="page">Dos</button>');
	expect(markup).not.toContain('role="tab');
});

test("staff history preserves value, reason and author", () => {
	const s = initialState();
	s.staff = [
		{
			id: "staff",
			name: "Docente Ejemplo",
			role: "Docente",
			history: [
				{
					id: "change",
					value: "Dirección",
					reason: "Cambio de función",
					author: "Control escolar",
				},
			],
		},
	];
	const markup = render(StaffView, s);
	expect(markup).toContain("<details>");
	expect(markup).toContain("Ver historial de Docente Ejemplo");
	for (const text of ["Dirección", "Cambio de función", "Control escolar"])
		expect(markup).toContain(text);
});

test("directory row actions retain their open payloads", () => {
	const s = initialState();
	s.staff = [
		{ id: "staff-id", name: "Docente Ejemplo", role: "Docente", history: [] },
	];
	s.devices = [
		{ id: "device-id", name: "Entrada", active: true, reason: "Alta" },
	];
	const calls: unknown[][] = [];
	const open = (...args: unknown[]) => {
		calls.push(args);
	};
	const clickActions = (node: unknown) => {
		if (Array.isArray(node)) {
			node.forEach(clickActions);
			return;
		}
		if (!node || typeof node !== "object" || !("props" in node)) return;
		const props = node.props as { children?: unknown; onClick?: () => void };
		if (
			props.children === "Cambiar responsabilidad" ||
			props.children === "Desactivar equipo"
		)
			props.onClick?.();
		clickActions(props.children);
	};
	// Exercise the stateless action, not a hook-owning component outside React.
	clickActions(StaffRoleAction({ person: s.staff[0], open }));
	clickActions(DevicesView({ s, open }));
	expect(calls[0][2]).toEqual([
		{
			key: "role",
			label: "Nueva responsabilidad",
			options: [
				"Administración escolar",
				"Control escolar",
				"Docente",
				"Operador de terminal",
			].map((value) => ({ value, label: value })),
		},
		{ key: "reason", label: "Motivo / evidencia", type: "textarea" },
	]);
	expect(calls.map((args) => [args[0], args[1], args[3]])).toEqual([
		[
			"staff-role",
			"Cambiar responsabilidad de Docente Ejemplo",
			{ id: "staff-id" },
		],
		["device-off", "Desactivar Entrada", { id: "device-id" }],
	]);
});
