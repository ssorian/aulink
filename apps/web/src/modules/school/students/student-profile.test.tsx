// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConductView } from "../conduct/conduct-view";
import { buildMockData } from "../shared/mock-data";
import { StudentGrades } from "../grades/student-grades";
import {
	credentialPreview,
	GuardianDetail,
	openWithdraw,
	StudentProfile,
} from "./student-profile";
import { summarizeGrades } from "./student-summary";
import { options } from "../shared/view-helpers";
import { activeGroup, wasEnrolled } from "../shared/workflows";

function setup() {
	const s = buildMockData();
	const student = s.students.find((x) => x.matricula === "AUR-26101");
	if (!student) throw Error("sample student missing");
	return { s, student };
}

function render(
	s = setup().s,
	studentId = setup().student.id,
	initialTab?: "Resumen" | "Asistencia" | "Calificaciones" | "Conducta",
) {
	return renderToStaticMarkup(
		<StudentProfile
			s={s}
			open={() => {}}
			studentId={studentId}
			onGroup={() => {}}
			initialTab={initialTab}
		/>,
	);
}

const text = (html: string) =>
	html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("profile offers four tabs and opens on Resumen", () => {
	const html = render();
	const nav =
		html.match(/<nav class="workspace-tabs"[\s\S]*?<\/nav>/)?.[0] ?? "";
	const tabs = [...nav.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(
		(m) => m[1],
	);
	expect(tabs).toEqual(["Resumen", "Asistencia", "Calificaciones", "Conducta"]);
	expect(nav).toContain('aria-current="page">Resumen</button>');
	for (const gone of ["Inscripciones", "Credenciales"])
		expect(nav).not.toContain(gone);
});

const section = (html: string, heading: string) =>
	html.match(
		new RegExp(
			`<section class="panel ui-panel profile-card[^"]*"[^>]*>(?:(?!</section>)[\\s\\S])*?<h2[^>]*>${heading}</h2>[\\s\\S]*?</section>`,
		),
	)?.[0] ?? "";

test("heading names the student with matrícula, grade, group, cycle and two actions", () => {
	const html = render();
	const heading =
		html.match(/<section class="workspace-heading[\s\S]*?<\/section>/)?.[0] ??
		"";
	expect(heading).toContain("<h2>Alba Mendoza Ruiz</h2>");
	expect(text(heading)).toContain(
		"Matrícula AUR-26101 · 1° B · Agosto 2026 – Julio 2027",
	);
	expect(heading).toContain(">Cambiar de grupo</button>");
	expect(heading).toContain(">Dar de baja</button>");
	expect(heading).not.toContain("Reinscribir");
	expect(heading).not.toContain("Baja</span>");
});

test("a withdrawn student shows a Baja badge and cannot be moved or withdrawn again", () => {
	const { s, student } = setup();
	s.withdrawals.push({
		id: "w",
		student: student.id,
		cycle: student.enrollments.at(-1)?.cycle ?? "",
		reason: "Cambio de ciudad",
		author: "A",
	});
	const heading =
		render(s, student.id).match(
			/<section class="workspace-heading[\s\S]*?<\/section>/,
		)?.[0] ?? "";
	expect(heading).toMatch(/profile-badge[^"]*">Baja<\/span>/);
	expect(heading).toMatch(/<button[^>]*disabled=""[^>]*>Cambiar de grupo/);
	expect(heading).toMatch(/<button[^>]*disabled=""[^>]*>Dar de baja/);
});

test("Dar de baja opens the withdraw flow with a warning preview", () => {
	const { student } = setup();
	const calls: unknown[][] = [];
	openWithdraw((...args) => calls.push(args), student);
	expect(calls[0][0]).toBe("withdraw");
	expect(calls[0][3]).toEqual({ student: student.id });
	expect((calls[0][2] as { key: string }[]).map((f) => f.key)).toEqual([
		"reason",
	]);
	const preview = (calls[0][4] as string[]).join(" ");
	expect(preview).toContain("sale de las listas del grupo");
	expect(preview).toContain("avisos a sus tutores");
	expect(preview).toContain("registros se conservan");
});

test("grado y grupo shows grade, group link, cycle and shift without history", () => {
	const html = render();
	const panel = section(html, "Grado y grupo");
	expect(text(panel)).toContain("Grado 1°");
	expect(panel).toContain('aria-label="Abrir grupo 1° B"');
	expect(text(panel)).toContain("Agosto 2026 – Julio 2027");
	for (const gone of [
		"Inscripción original",
		"Ciclos anteriores",
		"Motivo",
		"Registró",
		"Actual",
	])
		expect(text(html)).not.toContain(gone);
	expect(html).not.toContain("<details");
});

test("a group without grade says Sin grado", () => {
	const { s, student } = setup();
	const id = activeGroup(
		s,
		student.id,
		student.enrollments.at(-1)?.cycle ?? "",
	);
	const group = s.groups.find((g) => g.id === id);
	if (group) group.grade = undefined;
	expect(text(section(render(s, student.id), "Grado y grupo"))).toContain(
		"Sin grado",
	);
});

test("guardians list at most two rows, each a button, with relation and status", () => {
	const { s, student } = setup();
	s.links.push({
		id: "extra",
		student: student.id,
		name: "Tercer Tutor",
		status: "Verificado",
		history: [],
	});
	const html = render(s, student.id);
	const panel = section(html, "Tutores");
	const rows: string[] = panel.match(/<li>[\s\S]*?<\/li>/g) ?? [];
	expect(rows).toHaveLength(2);
	for (const row of rows)
		expect(row).toMatch(/<button[^>]*aria-haspopup="dialog"/);
	expect(text(rows[0])).toContain("Mariana Ruiz Salcedo");
	expect(text(rows[0])).toContain("Madre");
	expect(rows.join("")).toMatch(
		/profile-badge[^"]*">Verificado en el registro<\/span>/,
	);
	expect(text(panel)).not.toContain("Historial del vínculo");
	expect(panel).not.toContain("Revocado");
	expect(text(panel)).not.toContain("Vincular tutor");
});

test("revoked links go last and free a slot for Vincular tutor", () => {
	const { s, student } = setup();
	for (const l of s.links.filter((x) => x.student === student.id))
		l.status = "Revocado";
	const first = s.links.find((x) => x.student === student.id);
	if (first) first.status = "Verificado";
	s.links.unshift({
		id: "old",
		student: student.id,
		name: "Antiguo Tutor",
		status: "Revocado",
		history: [],
	});
	const panel = section(render(s, student.id), "Tutores");
	const rows: string[] = panel.match(/<li>[\s\S]*?<\/li>/g) ?? [];
	expect(rows).toHaveLength(2);
	expect(text(rows[0])).toContain(first?.name ?? "?");
	expect(panel).toContain(">Vincular tutor</button>");
});

test("guardian detail shows contact data, never invents missing values, and wires its actions", () => {
	const calls: unknown[][] = [];
	const closed: string[] = [];
	const link = {
		id: "l9",
		student: "s",
		name: "Rosa Pérez",
		relation: undefined,
		phone: "5512345678",
		email: undefined,
		status: "Verificado",
		history: [],
	};
	const element = GuardianDetail({
		link,
		open: (...a) => calls.push(a),
		onClose: () => closed.push("x"),
	});
	const html = renderToStaticMarkup(element);
	expect(text(html)).toContain("Rosa Pérez");
	expect(text(html)).toContain("Parentesco Sin registrar");
	expect(text(html)).toContain("Teléfono 5512345678");
	expect(text(html)).toContain("Correo Sin registrar");
	expect(text(html)).toContain("Estado Verificado en el registro");
	expect(html).toContain(">Editar datos</button>");
	expect(html).toContain(">Restringir o revocar</button>");
	const buttons = Children.toArray(
		(
			Children.toArray(element.props.children).at(-1) as ReactElement<{
				children: ReactNode;
			}>
		).props.children,
	) as ReactElement<{ onClick: () => void; children: string }>[];
	const edit = buttons.find((b) => b.props.children === "Editar datos");
	edit?.props.onClick();
	expect(closed).toEqual(["x"]);
	expect(calls[0][0]).toBe("guardian-edit");
	expect(calls[0][3]).toEqual({
		id: "l9",
		name: "Rosa Pérez",
		relation: "",
		phone: "5512345678",
		email: "",
	});
	const fields = calls[0][2] as {
		key: string;
		type?: string;
		optional?: boolean;
	}[];
	expect(fields.map((f) => f.key)).toEqual([
		"name",
		"relation",
		"phone",
		"email",
	]);
	expect(fields.find((f) => f.key === "phone")).toMatchObject({
		type: "tel",
		optional: true,
	});
	expect(fields.find((f) => f.key === "email")).toMatchObject({
		type: "email",
		optional: true,
	});
	const status = buttons.find(
		(b) => b.props.children === "Restringir o revocar",
	);
	status?.props.onClick();
	expect(calls[1][0]).toBe("guardian-status");
	expect(calls[1][3]).toEqual({ id: "l9" });
});

test("guardian detail disables status change for revoked links", () => {
	const html = renderToStaticMarkup(
		GuardianDetail({
			link: {
				id: "l",
				student: "s",
				name: "N",
				status: "Revocado",
				history: [],
			},
			open: () => {},
			onClose: () => {},
		}),
	);
	expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Restringir o revocar/);
});

test("grades summary reports the published average, coverage, failing subjects and drafts", () => {
	const { s, student } = setup();
	const html = render(s, student.id);
	const panel = section(html, "Calificaciones");
	const cycle = student.enrollments.at(-1)?.cycle;
	const groups = s.groups
		.filter((g) => g.cycle === cycle && wasEnrolled(s, student.id, g.id))
		.map((g) => g.id);
	const expected = summarizeGrades(s, student.id, groups);
	expect(expected.average).not.toBeNull();
	expect(text(panel)).toContain(
		(expected.average ?? 0).toLocaleString("es-MX", {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		}),
	);
	expect(text(panel)).toContain(
		`Materias calificadas ${expected.graded} de ${expected.subjects}`,
	);
	expect(text(panel)).toContain(`Bajo el mínimo (6) ${expected.failing}`);
	expect(text(panel)).toContain(`En borrador ${expected.drafts}`);
	expect(text(panel)).toContain("calificaciones publicadas");
	expect(panel).toMatch(/Ver calificaciones<svg[\s\S]*<\/button>/);
});

test("grades summary does not invent a number without published grades", () => {
	const { s, student } = setup();
	for (const g of s.grades) if (g.student === student.id) g.published = false;
	const panel = section(render(s, student.id), "Calificaciones");
	expect(text(panel)).toContain("Promedio — Sin calificaciones publicadas");
	expect(text(panel)).not.toMatch(/\d\.\d/);
});

test("attendance summary separates campus entries from class roll call and is dated sample data", () => {
	const panel = section(render(), "Asistencia");
	const plain = text(panel);
	expect(plain).toContain("Datos de muestra");
	expect(plain).toContain("al viernes, 23 de octubre de 2026");
	expect(plain).toContain("Entradas al plantel");
	expect(plain).toContain("97 %");
	expect(plain).toContain("43 de 44 días con entrada");
	expect(plain).toContain("Materias en riesgo 1 pase de lista por materia");
	expect(plain).toContain("Faltas por justificar 6");
	expect(panel).toMatch(/Ver asistencia<svg[\s\S]*<\/button>/);
});

test("summary links switch tabs", () => {
	const html = render();
	expect(html).toMatch(/Ver calificaciones<svg/);
	expect(html).toMatch(/Ver asistencia<svg/);
});

test("credential shows a compact card for the active revision", () => {
	const html = render();
	const panel = section(html, "Credencial");
	expect(text(panel)).toContain("AUR-26101");
	expect(text(panel)).toContain("Revisión 2");
	expect(panel).toMatch(/profile-badge[^"]*">Vigente<\/span>/);
	expect(panel).toContain(">Reemitir credencial</button>");
	expect(text(panel)).not.toContain("Revisiones anteriores");
	expect(text(panel)).not.toContain("revoca");
	expect(html).not.toContain("<details");
});

test("without an active credential a static empty state offers issuing one", () => {
	const { s, student } = setup();
	s.credentials = s.credentials.filter((c) => c.student !== student.id);
	const panel = section(render(s, student.id), "Credencial");
	expect(text(panel)).toContain("Sin credencial vigente");
	expect(panel).not.toContain("skeleton");
	expect(panel).toContain(">Emitir credencial</button>");
	expect(panel).not.toContain("Vigente</span>");
});

test("the no-scan warning is a visible notice, not muted description", () => {
	const panel = section(render(), "Credencial");
	expect(panel).toMatch(/class="profile-notice"/);
	expect(text(panel)).toContain(
		"Modelo sin código escaneable; no sirve para acceso.",
	);
});

test("destructive actions use the danger button class and Cambiar de grupo stays neutral", () => {
	const html = render();
	expect(html).toMatch(/<button[^>]*class="button-danger"[^>]*>Dar de baja/);
	expect(html).not.toMatch(/<button[^>]*button-danger[^>]*>Cambiar de grupo/);
	const detail = renderToStaticMarkup(
		GuardianDetail({
			link: {
				id: "l",
				student: "s",
				name: "N",
				status: "Verificado",
				history: [],
			},
			open: () => {},
			onClose: () => {},
		}),
	);
	expect(detail).toMatch(
		/<button[^>]*class="button-danger"[^>]*>Restringir o revocar/,
	);
});

test("grades note spells out the minimum passing grade", () => {
	const text1 = text(section(render(), "Calificaciones"));
	expect(text1).toContain("Bajo el mínimo (6)");
});

test("reissuing warns in the flow preview that the previous revision is revoked", () => {
	const student = { id: "s", name: "Ana", matricula: "M-1", enrollments: [] };
	expect(credentialPreview(student, true).join(" ")).toContain(
		"Reemitir revoca la revisión anterior",
	);
	expect(credentialPreview(student, false).join(" ")).not.toContain("revoca");
});

test("resumen has no history anywhere", () => {
	const html = render();
	for (const gone of [
		"Historial del vínculo",
		"Ciclos anteriores",
		"Revisiones anteriores",
		"Pendientes",
	])
		expect(text(html)).not.toContain(gone);
	expect(html).not.toContain("<details");
	expect(html).not.toContain("avatar");
});

test("attendance shows campus percent, subject table and absences to justify", () => {
	const { s, student } = setup();
	const html = render(s, student.id, "Asistencia");
	const plain = text(html);
	// Three separate blocks.
	const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
		text(m[1]).trim(),
	);
	expect(headings).toEqual([
		"Alba Mendoza Ruiz",
		"Asistencia a la escuela",
		"Asistencia por materia",
		"Faltas por justificar 6",
	]);
	expect(plain).toContain("Datos de muestra");
	expect(plain).toContain(
		"Días de clase transcurridos al viernes, 23 de octubre de 2026",
	);
	// General percent comes from campus entries over elapsed school days.
	expect(plain).toContain(
		"Asistencia a la escuela Entradas registradas por la terminal del plantel 97 % 43 de 44 días de clase con entrada",
	);
	// Per-subject table states the rules and flags the subject under the minimum.
	expect(plain).toContain(
		"Mínimo para acreditar: 80 % · 3 retardos cuentan como 1 falta",
	);
	const headers = [
		...(html.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? "").matchAll(
			/<th[^>]*>([^<]+)<\/th>/g,
		),
	].map((m) => m[1]);
	expect(headers).toEqual([
		"Materia",
		"Clases asistidas",
		"Faltas",
		"Retardos",
		"Asistencia",
		"Estado",
	]);
	const artes = html.match(/<tr class="is-risk">[\s\S]*?<\/tr>/g) ?? [];
	expect(artes).toHaveLength(1);
	expect(text(artes[0] ?? "")).toContain(
		"Artes 13 de 18 5 0 72 % Riesgo de extraordinario",
	);
	expect(plain).toContain("Historia 35 de 35 0 0 100 % Acredita");
	// One row per day with unjustified absences, its classes merged.
	expect(plain).toContain(
		"Faltas por justificar 6 Al justificar, la falta cuenta como asistencia.",
	);
	expect(plain).toContain(
		"Sin entrada a la escuela · faltó a todas sus clases",
	);
	expect(html.match(/>Justificar<\/button>/g)).toHaveLength(6);
	// The table sits on the page in its own card; the list keeps its panel.
	expect(html.match(/class="panel ui-panel"/g)).toHaveLength(1);
	expect(html).toContain('class="panel attendance-pending-panel"');
	expect(html.match(/class="ui-table-card"/g)).toHaveLength(1);
	expect(html.match(/class="attendance-pending-item"/g)).toHaveLength(6);
	expect(html).toContain(
		'aria-label="Justificar falta del lunes, 19 de octubre de 2026"',
	);
	expect(plain).toContain("Ver faltas justificadas (1)");
	expect(plain).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b/);
	// The day-by-day access log and the day pager are gone from this tab.
	for (const gone of [
		"Todos los días con registro",
		"Ver registro original",
		"Docente",
	])
		expect(plain).not.toContain(gone);
});

test("conduct profile offers registration and omits repeated identity", () => {
	const { s, student } = setup();
	const html = render(s, student.id, "Conducta");
	expect(html).toMatch(/<h2[^>]*>Conducta<\/h2>/);
	expect(html).toContain(">Registrar reconocimiento o incidente</button>");
	expect(html).not.toContain(`<h2>Reconocimiento · ${student.name}</h2>`);
});

test("conduct profile empty state refers to its available action", () => {
	const { s, student } = setup();
	s.conduct = [];
	const html = render(s, student.id, "Conducta");
	expect(html).toContain(">Registrar reconocimiento o incidente</button>");
	expect(html).toContain(
		"Registra un reconocimiento o incidente con seguimiento concreto.",
	);
});

test("conduct registration fixes the student and current active group", () => {
	const { s, student } = setup();
	const group = s.groups.find(
		(g) =>
			g.name === "1° B" &&
			g.cycle ===
				student.enrollments.find(
					(e) => activeGroup(s, student.id, e.cycle) === g.id,
				)?.cycle,
	);
	if (!group) throw Error("active group missing");
	const calls: unknown[][] = [];
	const view = ConductView({
		s,
		studentId: student.id,
		groupId: group.id,
		open: (...args) => calls.push(args),
		students: options("student", "Alumno", [student]),
		studentName: () => student.name,
	});
	const board = Children.toArray(view.props.children).find(
		(child) => isValidElement(child) && "action" in (child.props as object),
	) as ReactElement<{ action: ReactElement<{ onClick: () => void }> }>;
	board.props.action.props.onClick();
	expect(calls[0][0]).toBe("conduct");
	expect(calls[0][3]).toEqual({ student: student.id, group: group.id });
	expect(
		(calls[0][2] as { key: string }[]).some((f) => f.key === "student"),
	).toBe(false);
});

test("group conduct keeps its original registration button", () => {
	const { s } = setup();
	const html = renderToStaticMarkup(
		<ConductView
			s={s}
			open={() => {}}
			students={options("student", "Alumno del grupo", s.students)}
			studentName={(id) => s.students.find((x) => x.id === id)?.name || id}
		/>,
	);
	expect(html).toContain(">Registrar reconocimiento / incidente</button>");
	const calls: unknown[][] = [];
	const view = ConductView({
		s,
		open: (...args) => calls.push(args),
		students: options("student", "Alumno del grupo", s.students),
		studentName: (id) => id,
	});
	const board = Children.toArray(view.props.children).find(
		(child) => isValidElement(child) && "action" in (child.props as object),
	) as ReactElement<{ action: ReactElement<{ onClick: () => void }> }>;
	board.props.action.props.onClick();
	expect(
		(calls[0][2] as { key: string }[]).some((f) => f.key === "student"),
	).toBe(true);
});

test("grade tables group cycles, sort rows and show statuses and actions", () => {
	const { s, student } = setup();
	const second = s.grades.filter(
		(g) =>
			g.student === student.id &&
			s.assignments.find((a) => a.id === g.assignment)?.period ===
				"Segundo trimestre",
	);
	if (second.length < 2) throw Error("sample grades missing");
	second[0].value = 5;
	s.grades = s.grades.filter((g) => g.id !== second[1].id);
	const html = render(s, student.id, "Calificaciones");
	for (const label of [
		"Materia",
		"Docente",
		"Calificación",
		"Situación",
		"Acciones",
	])
		expect(html).toContain(`<th scope="col">${label}</th>`);
	expect(text(html)).toContain("Datos de muestra");
	expect(text(html)).toContain("Segundo trimestre");
	expect(text(html)).toContain("Abierto hasta el 13 nov");
	// Passing subjects stay plain text; only failing ones get a badge.
	expect(html).not.toMatch(/profile-badge[^"]*">Aprueba</);
	expect(text(html)).toContain("Sin calificación del docente");
	expect(html).toContain("—");
	expect(html).toContain("Aprueba");
	expect(html).toContain("Reprueba");
	const final = renderToStaticMarkup(
		<StudentGrades
			s={{
				...s,
				students: [student],
				grades: s.grades.filter((g) => g.student === student.id),
			}}
			open={() => {}}
			studentName={student.name}
			initialPeriod="Final"
		/>,
	);
	expect(final).toContain("Promedio");
	const subject = s.assignments.find(
		(a) => a.id === second[0].assignment,
	)?.subject;
	const firstValue = s.grades.find(
		(g) =>
			g.student === student.id &&
			s.assignments.find(
				(a) =>
					a.id === g.assignment &&
					a.subject === subject &&
					a.period === "Primer trimestre",
			),
	)?.value;
	if (firstValue === undefined || !subject)
		throw Error("first period grade missing");
	const expected = ((firstValue + 5) / 2).toLocaleString("es-MX", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
	const row = [...final.matchAll(/<tr>[\s\S]*?<\/tr>/g)]
		.map((m) => m[0])
		.find((r) => r.includes(`>${subject}</th>`));
	expect(row).toContain(`>${expected}</td>`);
	expect(final).not.toContain("Ver historial");
	expect(html).not.toContain("Publicado");
	expect(html).not.toContain("Revisar publicación");
	expect(html).toContain("Ver historial");
});

test("grade history is disclosed and empty grades have a passive message", () => {
	const { s, student } = setup();
	const first = s.grades.find(
		(g) =>
			g.student === student.id &&
			s.assignments.find((a) => a.id === g.assignment)?.period ===
				"Primer trimestre",
	);
	if (!first) throw Error("sample grade missing");
	first.history = [
		{ id: "test", value: "6 → 7", reason: "Corrección", author: "Docente" },
	];
	const closed = renderToStaticMarkup(
		<StudentGrades
			s={{
				...s,
				students: [student],
				grades: s.grades.filter((g) => g.student === student.id),
			}}
			open={() => {}}
			studentName={student.name}
			initialPeriod="Primer trimestre"
		/>,
	);
	expect(text(closed)).toContain("Cerrado el 2 oct");
	expect(text(closed)).toContain("Periodo cerrado el 2 oct");
	expect(text(closed)).toContain("Valor original: 6");
	expect(text(closed)).toContain("6 → 7 · Corrección · Docente");
	expect(text(closed)).toContain("Sin correcciones");
	s.grades = s.grades.filter((g) => g.student !== student.id);
	const empty = render(s, student.id, "Calificaciones");
	expect(empty).toContain("Sin calificaciones capturadas para este alumno.");
	expect(empty).not.toContain("<table");
});

test("profile buttons avoid slash labels", () => {
	for (const tab of [
		"Resumen",
		"Asistencia",
		"Calificaciones",
		"Conducta",
	] as const) {
		const labels = [
			...render(undefined, undefined, tab).matchAll(
				/<button[^>]*>([^<]*)<\/button>/g,
			),
		].map((m) => m[1]);
		expect(labels.filter((l) => l.includes(" / "))).toEqual([]);
	}
});

test("each Resumen card carries its tone modifier", () => {
	const html = render();
	for (const [heading, tone] of [
		["Grado y grupo", "sky"],
		["Calificaciones", "lilac"],
		["Asistencia", "teal"],
		["Tutores", "peach"],
		["Credencial", "mustard"],
	] as const)
		expect(section(html, heading)).toContain(`profile-card--${tone}`);
});

test("focal numbers get a decorative meter and secondary tiles a status dot", () => {
	const html = render();
	for (const heading of ["Calificaciones", "Asistencia"]) {
		const panel = section(html, heading);
		expect(panel).toMatch(
			/<span class="profile-meter" aria-hidden="true"><span style="width:[\d.]+%"><\/span><i style="left:[\d.]+%"><\/i><\/span>/,
		);
	}
	expect(section(html, "Calificaciones")).toContain("profile-stat--dot");
	expect(section(html, "Asistencia")).toContain("profile-stat--dot");
});

test("no meter when the average is missing", () => {
	const { s, student } = setup();
	s.grades = [];
	expect(section(render(s, student.id), "Calificaciones")).not.toContain(
		"profile-meter",
	);
});

test("active credential is a card with school name, student and matrícula", () => {
	const { s, student } = setup();
	const panel = section(render(s, student.id), "Credencial");
	expect(panel).toContain("profile-id-card");
	expect(text(panel)).toContain(s.school.name);
	expect(text(panel)).toContain(student.name);
	expect(text(panel)).toContain(student.matricula);
});

test("guardian initials are decorative", () => {
	const panel = section(render(), "Tutores");
	expect(panel).toMatch(
		/<span class="profile-initials[^"]*" aria-hidden="true">[A-ZÁÉÍÓÚÑ]{1,2}<\/span>/,
	);
});
