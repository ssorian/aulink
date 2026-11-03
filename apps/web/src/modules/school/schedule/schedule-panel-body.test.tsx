// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState } from "../shared/workflows";
import { occurrences, schoolToday, weekday } from "./schedule-helpers";
import { SchedulePanelBody } from "./schedule-panel-body";
import type { PanelState } from "./schedule-types";

function fixture() {
	const s = initialState();
	const today = schoolToday(s.school.timezone);
	s.assignments = [
		{
			id: "a",
			group: "g1",
			subject: "Matemáticas",
			teacher: "Docente del grupo",
			period: "P1",
			min: 0,
			max: 10,
		},
	];
	s.schedules = [
		{
			id: "slot",
			assignment: "a",
			day: weekday(today),
			start: "07:00",
			end: "15:00",
		},
	];
	s.scheduleChanges = [];
	s.scheduleStaffing = [];
	s.exceptions = [];
	const [item] = occurrences(s, "g1", today);
	return { s, item, slot: s.schedules[0] };
}
const noop = () => {};
const render = (panel: PanelState, error = "") =>
	renderToStaticMarkup(
		createElement(SchedulePanelBody, {
			panel,
			teachers: ["Docente del grupo", "Laura Suplente"],
			titular: () => "Docente del grupo",
			error,
			onMode: noop,
			onSubmit: noop,
			onEditSlot: noop,
			onRemoveSlot: noop,
		}),
	);

test("a live class offers staffing, reschedule and cancel; a slot offers edit and delete", () => {
	const { item, slot } = fixture();
	const view = render({
		kind: "occurrence",
		item,
		key: "k",
		anchor: null as never,
		mode: "view",
	});
	expect(view).toContain('data-slot="schedule-panel-body"');
	for (const text of ["Cambiar docente", "Reagendar", "Cancelar clase"])
		expect(view).toContain(text);
	expect(view).toContain("Docente: ");
	expect(view).not.toContain("Restaurar");
	const structure = render({
		kind: "slot",
		slot,
		key: "k",
		anchor: null as never,
	});
	expect(structure).toContain("Editar");
	expect(structure).toContain("Eliminar");
	expect(structure).toContain("Titular: Docente del grupo");
});

test("each form mode renders its fields, reason is required and errors announce", () => {
	const { item } = fixture();
	const mode = (m: "staff" | "move" | "cancel" | "restore", error = "") =>
		render(
			{ kind: "occurrence", item, key: "k", anchor: null as never, mode: m },
			error,
		);
	const staff = mode("staff");
	expect(staff).toContain('name="role"');
	expect(staff).toMatch(/disabled=""[^>]*value="titular"/);
	expect(staff).toContain("Laura Suplente");
	expect(staff).toContain('name="reason"');
	expect(mode("move")).toContain('name="targetDate"');
	expect(mode("cancel")).toContain("Queda visible como evidencia");
	expect(mode("restore")).toContain("Vuelve a su horario original");
	const failed = mode("cancel", "Escribe el motivo del cambio.");
	expect(failed).toMatch(/role="alert"[^>]*>Escribe el motivo del cambio\./);
	expect(failed).toContain('type="submit"');
});
