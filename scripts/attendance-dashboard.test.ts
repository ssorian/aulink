import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { summarizeAttendance } from "../apps/web/src/modules/school/attendance-summary";
import { initialState } from "../apps/web/src/modules/school/workflows";

function fixture() {
	const s = initialState();
	s.events = [];
	s.calendarHolidays = [];
	s.exceptions = [];
	s.cycles = [
		{ id: "c1", name: "Ciclo", startDate: "2026-10-01", endDate: "2026-10-31" },
	];
	s.groups = [
		{ id: "g1", name: "1 A", cycle: "c1" },
		{ id: "g2", name: "1 B", cycle: "c1" },
	];
	s.students = ["a", "b", "c"].map((id) => ({
		id,
		name: id,
		matricula: id,
		enrollments: [{ group: "g1", cycle: "c1" }],
	}));
	const add = (
		student: string,
		kind: string,
		date = "2026-10-19",
		group = "g1",
		time = "08:00",
	) =>
		s.events.push({
			id: String(s.events.length),
			student,
			kind,
			date,
			group,
			cycle: "c1",
			time,
		});
	return { s, add };
}
const query = {
	cycle: "c1",
	date: "2026-10-19",
	mode: "Semana",
	today: "2026-10-21",
};
test("counts student-days, not scans, and weights school totals", () => {
	const { s, add } = fixture();
	add("a", "Entrada");
	add("a", "Entrada");
	add("a", "Salida", undefined, undefined, "14:00");
	add("b", "Inasistencia");
	add("c", "Entrada", undefined, "g2");
	const report = summarizeAttendance(s, query);
	expect(report.total).toMatchObject({
		present: 2,
		absent: 1,
		review: 0,
		recorded: 3,
		coverage: 100,
	});
	expect(report.total.rate).toBeCloseTo(200 / 3);
	expect(report.groups[0].rate).toBe(50);
	expect(report.groups[1].rate).toBe(100);
});
test("conflicts and exit-only evidence are unresolved; missing records are not absences", () => {
	const { s, add } = fixture();
	add("a", "Entrada");
	add("a", "Falta");
	add("b", "Salida");
	const report = summarizeAttendance(s, query);
	expect(report.total).toMatchObject({
		present: 0,
		absent: 0,
		review: 2,
		recorded: 2,
		rate: null,
		coverage: 0,
	});
	expect(report.days.find((d) => d.date === "2026-10-20")?.rate).toBeNull();
});
test("excludes non-school exceptions, future and foreign evidence but retains visual holidays", () => {
	const { s, add } = fixture();
	s.calendarHolidays = [{ id: "h", date: "2026-10-19", title: "Feriado" }];
	s.exceptions = [{ id: "x", date: "2026-10-20", reason: "Sin clases" }];
	add("a", "Entrada");
	add("a", "Entrada", "2026-10-20");
	add("a", "Entrada", "2026-10-22");
	add("a", "Entrada", "2026-10-21");
	s.events.at(-1)!.cycle = "other";
	expect(summarizeAttendance(s, query).total.recorded).toBe(1);
	expect(summarizeAttendance(s, query).total.present).toBe(1);
	s.cycles[0].endDate = "2026-10-18";
	expect(summarizeAttendance(s, query).days).toEqual([]);
});
test("deduplicates students across transferred groups and filters grade/shift", () => {
	const { s, add } = fixture();
	s.groups[0].grade = "1";
	s.groups[1].grade = "2";
	s.groups[0].shift = "Matutino";
	s.groups[1].shift = "Vespertino";
	add("a", "Entrada");
	add("a", "Entrada", undefined, "g2");
	expect(summarizeAttendance(s, query).total.recorded).toBe(1);
	expect(
		summarizeAttendance(s, {
			...query,
			grade: "2",
			shift: "Vespertino",
		}).groups.map((g) => g.id),
	).toEqual(["g2"]);
});
test("does not interpret free-text adjustments or unscoped records as confirmed attendance", () => {
	const { s, add } = fixture();
	add("a", "Falta");
	s.adjustments = [
		{
			id: "adj",
			event: "0",
			value: "Justificada",
			reason: "Prueba",
			author: "Docente",
		},
	];
	add("b", "Entrada");
	s.events.at(-1)!.group = undefined;
	expect(summarizeAttendance(s, query).total.absent).toBe(1);
	expect(summarizeAttendance(s, query).total.present).toBe(0);
	expect(summarizeAttendance(s, { ...query, date: "" }).total.rate).toBeNull();
});
test("latest available date respects scope, calendar and school cutoff", () => {
	const { s, add } = fixture();
	add("a", "Entrada", "2026-10-05");
	add("b", "Entrada", "2026-10-20");
	add("a", "Entrada", "2026-10-22");
	s.exceptions = [{ id: "x", date: "2026-10-20", reason: "Sin clases" }];
	expect(summarizeAttendance(s, query).latestDate).toBe("2026-10-05");
	expect(
		summarizeAttendance(s, { ...query, shift: "Inexistente" }).latestDate,
	).toBeNull();
});

test("attendance opens a school overview without requiring a group", async () => {
	const requireWeb = createRequire(
		new URL("../apps/web/package.json", import.meta.url),
	);
	const { createElement } = requireWeb("react");
	const { renderToStaticMarkup } = requireWeb("react-dom/server");
	const { GroupFollowupView } = await import(
		"../apps/web/src/modules/school/group-followup-view"
	);
	const html = renderToStaticMarkup(
		createElement(GroupFollowupView, {
			s: fixture().s,
			open() {},
			mode: "Asistencia",
			groupId: "",
			onGroup() {},
		}),
	);
	for (const text of [
		"Panorama escolar",
		"Evolución de asistencia",
		"Asistencia por grupo",
		"Sin registros confirmados",
	])
		expect(html).toContain(text);
	expect(html).not.toContain("Sin grupo seleccionado");
	expect(html).not.toContain('class="attendance-column"');
	expect(html).not.toContain("0 de 0 alumno-días clasificados");
	expect(html).toContain('class="attendance-analysis"');
});


test("renders two bar charts using actual percentages and opens the last recorded period", async () => {
 const { s, add } = fixture();
 s.cycles[0] = { id: "c1", name: "Histórico", startDate: "2020-01-01", endDate: "2020-12-31" };
 add("a", "Entrada", "2020-10-19");
 add("b", "Falta", "2020-10-19");
 const requireWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
 const { createElement } = requireWeb("react");
 const { renderToStaticMarkup } = requireWeb("react-dom/server");
 const { AttendanceDashboard } = await import("../apps/web/src/modules/school/attendance-dashboard");
 const render = () => renderToStaticMarkup(createElement(AttendanceDashboard, { s, onOpenGroup() {} }));
 const html = render();
 expect(html).toContain('class="attendance-group-chart"');
 expect(html).toContain('style="width:50%"');
 expect(html).toContain('style="height:50%"');
 expect(html).toContain('value="2020-10-19"');
 expect(html).toContain('Ver alumnos de 1 A');
 expect(html).toContain('Sin registros confirmados');
 s.events[0].kind = "Falta";
 const zero = render();
 expect(zero).toContain('style="width:0%"');
 expect(zero).toContain('style="height:0%"');
 expect(zero).not.toContain('attendance-group-empty');
});
