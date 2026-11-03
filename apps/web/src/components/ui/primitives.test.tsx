// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initials } from "../../lib/initials";
import { Avatar, AvatarStack } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Dialog } from "./dialog";
import { EmptyState } from "./empty-state";
import { Field, Select } from "./field";
import { FilterBar } from "./filter-bar";
import { Legend } from "./legend";
import { Meter } from "./meter";
import { MiniMonth } from "./mini-month";
import { RankedBars } from "./ranked-bars";
import { Stat, StatGrid } from "./stat";

const render = renderToStaticMarkup;

test("initials takes two leading letters and skips symbols", () => {
	expect(initials("Ana María López")).toBe("AM");
	expect(initials("  - Luis")).toBe("L");
	expect(initials("")).toBe("");
});

test("Button defaults to type=button and exposes variant", () => {
	const html = render(<Button>Guardar</Button>);
	expect(html).toContain('type="button"');
	expect(html).toContain('data-slot="button"');
	expect(html).toContain('data-variant="default"');
	expect(
		render(
			<Button variant="primary" type="submit" className="x-extra">
				A
			</Button>,
		),
	).toContain('data-variant="primary"');
	expect(
		render(
			<Button variant="primary" type="submit" className="x-extra">
				A
			</Button>,
		),
	).toContain('type="submit"');
	expect(render(<Button className="x-extra">A</Button>)).toContain("x-extra");
});

test("Card renders semantic root and sub-slots", () => {
	const html = render(
		<Card as="article" tone="teal">
			<CardHeader>
				<CardTitle>Titulo</CardTitle>
			</CardHeader>
			<CardContent>Cuerpo</CardContent>
			<CardFooter>Pie</CardFooter>
		</Card>,
	);
	expect(html).toContain("<article");
	for (const slot of [
		"card",
		"card-header",
		"card-title",
		"card-content",
		"card-footer",
	])
		expect(html).toContain(`data-slot="${slot}"`);
	expect(html).toContain('data-tone="teal"');
	expect(render(<Card>x</Card>)).toContain("<section");
});

test("StatGrid and Stat expose state and caption", () => {
	const html = render(
		<StatGrid label="Resumen">
			<Stat label="Publicadas" value={12} caption="80%" state="published" />
		</StatGrid>,
	);
	expect(html).toContain('data-slot="stat-grid"');
	expect(html).toContain('aria-label="Resumen"');
	expect(html).toContain('data-slot="stat"');
	expect(html).toContain('data-state="published"');
	expect(html).toContain("Publicadas");
	expect(html).toContain("80%");
});

test("Select ties label to the control and handles empty items", () => {
	const html = render(
		<Select
			id="grp"
			label="Grupo"
			value="b"
			all="Todos"
			items={[
				{ value: "a", label: "A" },
				{ value: "b", label: "B" },
			]}
			onChange={() => {}}
		/>,
	);
	expect(html).toContain('for="grp"');
	expect(html).toContain('id="grp"');
	expect(html).toContain('<option value="">Todos</option>');
	expect(html).toContain('data-slot="field"');
	expect(html).toContain('data-slot="select"');
	const empty = render(
		<Select id="e" label="E" value="" items={[]} onChange={() => {}} />,
	);
	expect(empty).toContain("Sin opciones");
	expect(empty).toContain("disabled");
	expect(
		render(
			<Field id="f" label="Nombre">
				<input id="f" />
			</Field>,
		),
	).toContain('for="f"');
});

test("FilterBar is a labelled group", () => {
	const html = render(<FilterBar label="Filtros">x</FilterBar>);
	expect(html).toContain('data-slot="filter-bar"');
	expect(html).toContain("<fieldset");
	expect(html).toContain('aria-label="Filtros"');
});

test("Badge carries tone", () => {
	const html = render(<Badge tone="brick">Bloqueado</Badge>);
	expect(html).toContain('data-slot="badge"');
	expect(html).toContain('data-tone="brick"');
});

test("Legend lists items with an accessible name", () => {
	const html = render(
		<Legend
			label="Estados"
			items={[
				{ tone: "success", label: "Publicada" },
				{ tone: "brick", label: "Falta" },
			]}
		/>,
	);
	expect(html).toContain('data-slot="legend"');
	expect(html).toContain('aria-label="Estados"');
	expect(html).toContain("<ul");
	expect(html).toContain('data-tone="success"');
	expect(html).toContain("Falta");
});

test("Avatar shows initials; AvatarStack overflows to +N", () => {
	const a = render(<Avatar name="Ana López" size="lg" />);
	expect(a).toContain('data-slot="avatar"');
	expect(a).toContain('data-size="lg"');
	expect(a).toContain(">AL<");
	const stack = render(
		<AvatarStack
			names={["Ana A", "Beto B", "Carla C", "Dani D", "Eva E"]}
			max={3}
		/>,
	);
	expect(stack).toContain('data-slot="avatar-stack"');
	expect(stack).toContain(">+2<");
	expect(stack).not.toContain(">DD<");
	expect(render(<AvatarStack names={["Ana A"]} max={3} />)).not.toContain("+");
});

test("EmptyState shows text, default title and action", () => {
	const html = render(
		<EmptyState
			text="Nada por aquí"
			action={<button type="button">Crear</button>}
		/>,
	);
	expect(html).toContain('data-slot="empty-state"');
	expect(html).toContain("Sin registros");
	expect(html).toContain("Nada por aquí");
	expect(html).toContain("Crear");
	expect(render(<EmptyState title="Vacío" text="t" />)).toContain("Vacío");
});

test("Meter clamps percent to 0..100", () => {
	expect(render(<Meter percent={150} label="Avance" />)).toContain(
		'aria-valuenow="100"',
	);
	expect(render(<Meter percent={-4} label="Avance" />)).toContain(
		'aria-valuenow="0"',
	);
	const html = render(<Meter percent={42.4} label="Avance" tone="teal" />);
	expect(html).toContain('data-slot="meter"');
	expect(html).toContain('role="meter"');
	expect(html).toContain('aria-label="Avance"');
	expect(html).toContain("width:42.4%");
	expect(render(<Meter percent={Number.NaN} label="x" />)).toContain(
		'aria-valuenow="0"',
	);
});

test("RankedBars renders rows with values, tones and buttons for onSelect", () => {
	const html = render(
		<RankedBars
			label="Promedios"
			rows={[
				{
					id: "a",
					label: "Grupo A",
					value: 80,
					display: "8.0",
					tone: "success",
					onSelect: () => {},
				},
				{ id: "b", label: "Grupo B", value: 120, display: "12", tone: "brick" },
			]}
		/>,
	);
	expect(html).toContain('data-slot="ranked-bars"');
	expect(html).toContain('aria-label="Promedios"');
	expect(html).toContain('data-slot="ranked-bar"');
	expect(html).toContain('data-tone="success"');
	expect(html).toContain('data-variant="link" type="button"');
	expect(html).toContain("8.0");
	expect(html).toContain("width:100%");
	expect(html).toContain("width:80%");
});

test("MiniMonth keeps aria, selected week, today and marks", () => {
	const marks = new Map([["2026-03-10", new Set(["cancel" as const])]]);
	const html = render(
		<MiniMonth
			selected="2026-03-10"
			today="2026-03-11"
			marks={marks}
			onSelect={() => {}}
		/>,
	);
	expect(html).toContain('data-slot="mini-month"');
	expect(html).toContain('aria-label="Elegir semana"');
	expect(html).toContain('data-date="2026-03-10"');
	expect(html).toContain('aria-pressed="true"');
	expect(html).toContain('data-today="true"');
	expect(html).toContain("10 de marzo de 2026, con cancelación");
	expect(html).toContain("11 de marzo de 2026, hoy");
	expect(html).toContain('aria-label="Mes anterior"');
	expect(html).toContain('tabindex="0"');
	expect(html).toContain("Suplencia");
	expect(
		render(
			<MiniMonth
				selected="2026-03-10"
				today="2026-03-11"
				legend={false}
				onSelect={() => {}}
			/>,
		),
	).not.toContain("Suplencia");
});

test("Dialog renders a native dialog with title and close", () => {
	const html = render(
		<Dialog open={false} onClose={() => {}} title="Nuevo">
			Contenido
		</Dialog>,
	);
	expect(html).toContain("<dialog");
	expect(html).toContain('data-slot="dialog"');
	expect(html).toContain("Nuevo");
	expect(html).toContain('aria-label="Cerrar"');
	expect(html).toContain("Contenido");
});
