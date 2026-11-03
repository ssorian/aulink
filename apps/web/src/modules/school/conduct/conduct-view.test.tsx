// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, setSystemTime, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConductView, sortConduct, visibleConduct } from "./conduct-view";
import { GroupFollowupView } from "../groups/group-followup-view";
import { buildMockData } from "../shared/mock-data";
import { options } from "../shared/view-helpers";
import { activeGroup, apply, type State } from "../shared/workflows";

type Report = State["conduct"][number];

function setup() {
	const s = buildMockData();
	const student = s.students[0];
	const group = s.groups.find((g) => g.cycle === s.cycles[0].id) ?? s.groups[0];
	const report = (over: Partial<Report>): Report => ({
		id: "r",
		student: student.id,
		group: group.id,
		cycle: group.cycle,
		kind: "Reconocimiento",
		text: "Apoyó a su equipo.",
		internal: "",
		followup: "Revisar en tutoría.",
		shared: "Compartido",
		published: false,
		...over,
	});
	return { s, student, group, report };
}

function html(s: State, studentId?: string, groupId?: string) {
	return renderToStaticMarkup(
		<ConductView
			s={s}
			open={() => {}}
			students={options("student", "Alumno", s.students)}
			studentName={(id) => s.students.find((x) => x.id === id)?.name || id}
			studentId={studentId}
			groupId={groupId}
		/>,
	);
}

test("apply(conduct) stores today's school date and the author", () => {
	const s = buildMockData();
	const student = s.students[0];
	const enrollment = student.enrollments.find((e) =>
		activeGroup(s, student.id, e.cycle),
	);
	const group = {
		id: activeGroup(s, student.id, enrollment?.cycle ?? "") ?? "",
	};
	setSystemTime(new Date("2026-11-02T15:00:00Z"));
	try {
		const next = apply(s, {
			kind: "conduct",
			data: {
				student: student.id,
				group: group.id,
				kind: "Incidente",
				text: "Texto",
				internal: "",
				followup: "Seguimiento",
				shared: "Interno",
			},
		});
		const created = next.conduct.at(-1);
		expect(created?.date).toBe("2026-11-02");
		expect(created?.author).toBe("Patricia Salgado Méndez");
	} finally {
		setSystemTime();
	}
});

test("conduct records without date or author still render with honest fallbacks", () => {
	const { s, report } = setup();
	s.conduct = [report({ date: undefined, author: undefined })];
	const out = html(s);
	expect(out).toContain("Sin fecha");
	expect(out).toContain("Autor no registrado");
});

test("timeline groups reports under month headings, undated last", () => {
	const { s, report } = setup();
	s.conduct = [
		report({ id: "a", date: "2026-10-12" }),
		report({ id: "b", date: "2026-09-03" }),
		report({ id: "c" }),
	];
	const out = html(s);
	const oct = out.indexOf(">Octubre 2026<");
	const sep = out.indexOf(">Septiembre 2026<");
	const none = out.indexOf(">Sin fecha<");
	expect(oct).toBeGreaterThan(-1);
	expect(sep).toBeGreaterThan(oct);
	expect(out.indexOf("<h3", sep)).toBeGreaterThan(sep);
	expect(out).toMatch(/<h3[^>]*>Sin fecha<\/h3>/);
	expect(none).toBeGreaterThan(-1);
	expect(out).toContain("12 oct");
});

test("event sentence names author and type; group view adds the student", () => {
	const { s, student, group, report } = setup();
	s.conduct = [
		report({
			id: "a",
			date: "2026-10-12",
			author: "Adriana Beltrán Ríos",
			kind: "Incidente",
		}),
	];
	const profile = html(s, student.id, group.id);
	expect(profile).toContain(
		"<strong>Adriana Beltrán Ríos</strong> registró un ",
	);
	expect(profile).toContain(">incidente</span>");
	expect(profile).not.toContain(`de <strong>${student.name}</strong>`);
	expect(profile).toContain(group.name);
	const groupView = html(s);
	expect(groupView).toContain(
		`incidente</span> de <strong>${student.name}</strong>`,
	);
	s.conduct = [report({ author: undefined })];
	expect(html(s)).toContain(
		'Autor no registrado · <span class="conduct-type">reconocimiento</span>',
	);
});

test("pills show draft only when pending, plus visibility", () => {
	const { s, report } = setup();
	s.conduct = [
		report({ id: "a", shared: "Compartido", published: false }),
		report({ id: "b", shared: "Interno", published: true }),
	];
	const out = html(s);
	expect(out.match(/conduct-pill--draft">Borrador</g)?.length).toBe(1);
	expect(out).toContain("Visible para familias");
	expect(out).toContain("Solo interno");
	expect(out).toContain("conduct-item--draft");
});

test("the report text has no visibility prefix and empty internal notes are omitted", () => {
	const { s, report } = setup();
	s.conduct = [report({ internal: "", followup: "" })];
	const out = html(s);
	expect(out).not.toContain("Compartido:");
	expect(out).not.toContain("Interno:");
	expect(out).not.toContain("<details");
	expect(out).not.toContain("Nota interna");
	s.conduct = [report({ internal: "Hablar con la docente.", followup: "" })];
	const withNote = html(s);
	expect(withNote).toContain("Nota interna y seguimiento (1)");
	expect(withNote).toContain("Nota interna · solo personal");
	expect(withNote).toContain("Hablar con la docente.");
});

test("details are collapsed and count the note plus follow-up lines", () => {
	const { s, report } = setup();
	s.conduct = [
		report({ internal: "Nota", followup: "Primero\nSegundo\n\nTercero" }),
	];
	const out = html(s);
	expect(out).toContain("<details");
	expect(out).not.toContain("<details open");
	expect(out).toContain("Nota interna y seguimiento (4)");
	const details = out.match(/<details[\s\S]*?<\/details>/)?.[0] ?? "";
	expect(details.match(/<li/g)?.length).toBe(3);
});

test("drafts offer a publish action and published reports never show one", () => {
	const { s, report } = setup();
	s.conduct = [report({ published: false })];
	const draft = html(s);
	expect(draft).toContain("Revisar y publicar");
	expect(draft).toContain("Agregar seguimiento");
	s.conduct = [report({ published: true })];
	const published = html(s);
	expect(published).not.toContain("Revisar y publicar");
	expect(published).not.toContain("disabled");
	expect(published).toContain("Agregar seguimiento");
	expect(published).not.toContain('conduct-pill--draft">Borrador');
});

test("stats card counts types, drafts and shared reports; filter buttons expose aria-pressed", () => {
	const { s, report } = setup();
	s.conduct = [
		report({ id: "1" }),
		report({ id: "2", published: true }),
		report({ id: "3", kind: "Incidente" }),
	];
	const out = html(s);
	expect(out).toContain('class="progress-card progress-stats conduct-stats"');
	expect(out).toMatch(
		/data-state="recognition"><dt>Reconocimientos<\/dt><dd><strong>2</,
	);
	expect(out).toMatch(
		/data-state="incident"><dt>Incidentes<\/dt><dd><strong>1</,
	);
	expect(out).toMatch(/data-state="draft"><dt>Borradores<\/dt><dd><strong>2</);
	expect(out).toMatch(
		/data-state="shared"><dt>Visibles para familias<\/dt><dd><strong>3</,
	);
	expect(out).toMatch(/aria-pressed="true"[^>]*>Todos</);
	expect(out).toMatch(/aria-pressed="false"[^>]*>Reconocimientos</);
	expect(out).toMatch(/aria-pressed="false"[^>]*>Incidentes</);
	s.conduct = s.conduct.map((c) => ({ ...c, published: true }));
	expect(html(s)).toMatch(
		/data-state="draft"><dt>Borradores<\/dt><dd><strong>0</,
	);
});

test("filter narrows by type and the list sorts by date descending, undated last", () => {
	const { report } = setup();
	const rows = [
		report({ id: "old", date: "2026-08-26" }),
		report({ id: "none" }),
		report({ id: "new", date: "2026-10-19", kind: "Incidente" }),
		report({ id: "mid", date: "2026-09-09" }),
	];
	expect(sortConduct(rows).map((r) => r.id)).toEqual([
		"new",
		"mid",
		"old",
		"none",
	]);
	expect(visibleConduct(rows, "Incidente").map((r) => r.id)).toEqual(["new"]);
	expect(visibleConduct(rows, "Todos")).toHaveLength(4);
});

test("empty states: no records, and the filter-empty copy", () => {
	const { s } = setup();
	s.conduct = [];
	expect(html(s)).toContain(
		"Registra un reconocimiento o incidente con seguimiento concreto.",
	);
});

test("each report is a post card with the sentence as its header and button actions", () => {
	const { s, report } = setup();
	s.conduct = [
		report({ id: "a", date: "2026-10-12", author: "Adriana Beltrán Ríos" }),
		report({ id: "b", date: "2026-10-01", published: true }),
	];
	const out = html(s);
	expect(
		out.match(/<article class="progress-card conduct-post[^"]*"/g),
	).toHaveLength(2);
	expect(out).toMatch(/<header class="conduct-event">[\s\S]*?registró un/);
	expect(out).toContain('class="conduct-footer"');
	expect(out).toMatch(
		/<button[^>]*class="primary"[^>]*>Revisar y publicar<\/button>/,
	);
	expect(out).not.toContain("conduct-rail");
});
test("the group view has a heading with the register action and filters above the list", () => {
	const { s, report } = setup();
	s.conduct = [report({ id: "a" })];
	const out = html(s);
	const heading = out.indexOf("<h2>Reportes de conducta</h2>");
	const stats = out.indexOf("conduct-stats");
	const filters = out.indexOf('class="progress-filters conduct-filters"');
	const list = out.indexOf('class="conduct-list"');
	expect(heading).toBeGreaterThan(-1);
	expect(heading).toBeLessThan(stats);
	expect(stats).toBeLessThan(filters);
	expect(filters).toBeLessThan(list);
	expect(out.slice(heading, stats)).toContain(
		"Registrar reconocimiento / incidente",
	);
	const { student, group } = setup();
	expect(html(s, student.id, group.id)).not.toContain(
		"<h2>Reportes de conducta</h2>",
	);
});
test("the follow-up group picker is a compact filter, not a panel", () => {
	const { s, group } = setup();
	const out = renderToStaticMarkup(
		<GroupFollowupView
			s={s}
			open={() => {}}
			mode="Conducta"
			groupId={group.id}
			onGroup={() => {}}
		/>,
	);
	expect(out).not.toContain("scope-selector");
	expect(out).toMatch(
		/<label for="followup-group" class="progress-filter"><span>Grupo<\/span>/,
	);
});
