import { initialState, recipients, type State } from "./workflows";

export const SAMPLE_DATE = "2026-10-19";
const id = (kind: string, n: number) => `sample-v1-${kind}-${n}`;
const collections = [
	"cycles",
	"groups",
	"students",
	"links",
	"credentials",
	"devices",
	"events",
	"adjustments",
	"assignments",
	"schedules",
	"grades",
	"conduct",
	"transfers",
	"notices",
	"staff",
	"exceptions",
] as const;
type Collection = (typeof collections)[number];
const audit = (n: number, value: string, reason: string) => ({
	id: id("audit", n),
	value,
	reason,
	author: "Personal de ejemplo",
});

/** Deterministic, synthetic records. IDs and registrations are stable across reloads. */
export function buildMockData(legacy = false): State {
	let s = initialState(true);
	for (const key of collections) s[key] = [];
	s.cycles = [
		{ id: id("cycle", 1), name: "2026–2027 · Muestra" },
		{ id: id("cycle", 2), name: "2025–2026 · Muestra histórica" },
	];
	for (let i = 0; i < 6; i++)
		s.groups.push({
			id: id("group", i),
			name: `${i === 5 ? "1° H" : `${Math.floor(i / 2) + 1}° ${i % 2 ? "B" : "A"}`} · Muestra`,
			cycle: id("cycle", i === 5 ? 2 : 1),
			grade: i === 5 ? "1°" : `${Math.floor(i / 2) + 1}°`,
			shift: i % 2 ? "Vespertino" : "Matutino",
		});
	const names = [
		"Alba",
		"Bruno",
		"Celia",
		"Darío",
		"Eva",
		"Félix",
		"Gala",
		"Hugo",
		"Iris",
		"Joel",
		"Kiara",
		"Lino",
	];
	for (let i = 0; i < 36; i++) {
		const group = s.groups[Math.floor(i / 6)];
		const student = id("student", i);
		const enrollments = [{ group: group.id, cycle: group.cycle }];
		if (i < 3)
			enrollments.unshift({ group: id("group", 5), cycle: id("cycle", 2) });
		s.students.push({
			id: student,
			name: `${names[i % names.length]} Ejemplo ${String(i + 1).padStart(2, "0")}`,
			matricula: `MUESTRA-${String(i + 1).padStart(3, "0")}`,
			enrollments,
		});
		const tutor = `Familia Ejemplo ${String(Math.floor(i / 2) + 1).padStart(2, "0")}`;
		s.links.push({
			id: id("link", i),
			student,
			name: tutor,
			status: "Verificado DEMO",
			history: [
				audit(i, "Verificado DEMO", "Verificación exclusivamente sintética"),
			],
		});
		if (i % 6 === 0)
			s.links.push({
				id: id("extra-link", i),
				student,
				name: `Tutor alterno Ejemplo ${i + 1}`,
				status: i % 12 === 0 ? "Restringido" : "Revocado",
				history: [
					audit(
						100 + i,
						i % 12 === 0 ? "Restringido" : "Revocado",
						"Cambio de alcance ficticio con motivo de ejemplo",
					),
				],
			});
		s.credentials.push({
			id: id("credential", i),
			student,
			revision: i % 6 === 0 ? 2 : 1,
			active: true,
			reason: "Modelo sintético sin QR ni token",
		});
		if (i % 6 === 0)
			s.credentials.push({
				id: id("old-credential", i),
				student,
				revision: 1,
				active: false,
				reason: "Revisión anterior revocada por reemisión demo",
			});
		const date = group.cycle === id("cycle", 2) ? "2026-05-18" : SAMPLE_DATE;
		s.events.push({
			id: id("event", i),
			student,
			date,
			time: group.shift === "Vespertino" ? "14:05" : "07:05",
			kind: "Entrada sintética",
			group: group.id,
			cycle: group.cycle,
		});
		if (i % 3 === 0)
			s.events.push({
				id: id("exit", i),
				student,
				date,
				time: group.shift === "Vespertino" ? "19:00" : "13:00",
				kind: "Salida sintética",
				group: group.id,
				cycle: group.cycle,
			});
		if (i % 6 === 0)
			s.adjustments.push({
				id: id("adjustment", i),
				event: id("event", i),
				value: "Entrada justificada en ejemplo",
				reason: "Llegada acordada en escenario ficticio",
				author: "Control escolar demo",
			});
		if (i % 3 === 0)
			s.conduct.push({
				id: id("conduct", i),
				student,
				group: group.id,
				cycle: group.cycle,
				kind: i % 2 ? "Incidente" : "Reconocimiento",
				text:
					i % 2
						? "Escenario ficticio: acuerdo de convivencia durante una actividad."
						: "Escenario ficticio: colaboración en proyecto de ciencias.",
				internal:
					"Nota interna sintética: preparar acompañamiento; no compartir esta nota.",
				followup: "Revisar el acuerdo en la siguiente sesión de muestra.",
				shared: i % 2 ? "Interno" : "Compartido",
				published: i % 4 === 0,
			});
	}
	// Historical enrollment and same-cycle transfer demonstrate different concepts.
	s.transfers.push({
		id: id("transfer", 1),
		student: id("student", 0),
		cycle: id("cycle", 1),
		from: id("group", 0),
		to: id("group", 1),
		reason: "Traslado de ejemplo posterior a la jornada de muestra",
		author: "Control escolar demo",
	});
	for (let g = 0; g < 6; g++)
		for (let subject = 0; subject < 2; subject++) {
			const n = g * 2 + subject,
				group = s.groups[g];
			const assignment = id("assignment", n);
			s.assignments.push({
				id: assignment,
				group: group.id,
				subject: subject ? "Lengua y comunicación" : "Matemáticas",
				teacher: `Docente Ejemplo ${subject + 1}`,
				period: "Periodo 1 · Muestra",
				min: 0,
				max: 10,
			});
			s.schedules.push({
				id: id("schedule", n),
				assignment,
				day: subject ? "Miércoles" : "Lunes",
				start: group.shift === "Vespertino" ? "14:00" : "08:00",
				end: group.shift === "Vespertino" ? "15:00" : "09:00",
			});
			for (const student of s.students.filter((x) =>
				x.enrollments.some((e) => e.group === group.id),
			)) {
				const nGrade = s.grades.length;
				s.grades.push({
					id: id("grade", nGrade),
					assignment,
					student: student.id,
					value: 7 + (nGrade % 4),
					published: nGrade % 3 !== 0,
					history:
						nGrade % 9 === 0
							? [
									audit(
										300 + nGrade,
										`6 → ${7 + (nGrade % 4)}`,
										"Revisión sintética de captura",
									),
								]
							: [],
				});
			}
		}
	s.devices = [
		{
			id: id("device", 1),
			name: "Acceso principal · Equipo de muestra",
			active: true,
			reason: "Alta local: sin conexión física ni sincronización",
		},
		{
			id: id("device", 2),
			name: "Biblioteca · Equipo de muestra",
			active: false,
			reason: "Desactivación ficticia para mantenimiento; sin dispositivo real",
		},
	];
	s.staff = [
		"Administración escolar",
		"Control escolar",
		"Docente",
		"Operador de terminal",
	].map((role, i) => ({
		id: id("staff", i),
		name: i === 2 ? "Docente Ejemplo 1" : `Personal Ejemplo ${i + 1}`,
		role,
		history: [],
	}));
	s.staff.push({
		id: id("staff", 4),
		name: "Docente Ejemplo 2",
		role: "Docente",
		history: [],
	});
	s.exceptions = [
		{
			id: id("exception", 1),
			date: "2026-10-30",
			reason: "Día sin clase de muestra; calendario ficticio",
		},
	];
	s.notices = [
		{
			id: id("notice", 1),
			title: "Proyecto de ciencias · Muestra",
			text: "Simulación: preparar una actividad colaborativa para el grupo. No se ha enviado ningún aviso.",
			audience: "group",
			target: id("group", 0),
			published: true,
			recipients: [],
		},
		{
			id: id("notice", 2),
			title: "Encuentro de familias · Borrador de muestra",
			text: "Borrador sintético para revisar audiencia antes de simular publicación.",
			audience: "school",
			target: "",
			published: false,
			recipients: [],
		},
		{
			id: id("notice", 3),
			title: "Reconocimiento individual · Muestra",
			text: "Ejemplo de contenido compartido, sin entrega por correo ni push.",
			audience: "student",
			target: id("student", 2),
			published: true,
			recipients: [],
		},
		{
			id: id("notice", 4),
			title: "Organización del grupo · Borrador",
			text: "Propuesta sintética pendiente de revisión.",
			audience: "group",
			target: id("group", 1),
			published: false,
			recipients: [],
		},
	];
	varyEvaluationSample(s);
	if (!legacy) s = naturalSeed(s);
	for (const notice of s.notices)
		if (notice.published)
			notice.recipients = recipients(s, notice.audience, notice.target);
	return s;
}

/**
 * Current-cycle grades get failing results and a partially captured second
 * period, so evaluation follow-up has real work to show.
 */
function varyEvaluationSample(s: State) {
	const current = s.groups.filter((g) => g.cycle === s.cycles[0]?.id);
	const roster = (group: string) =>
		s.students.filter((x) => x.enrollments.some((e) => e.group === group));
	for (const [g, group] of current.entries()) {
		const students = roster(group.id);
		for (const a of s.assignments.filter((a) => a.group === group.id)) {
			const math = a.subject === "Matemáticas";
			// Audited grades keep the value their correction history describes.
			for (const grade of s.grades.filter(
				(x) => x.assignment === a.id && !x.history.length,
			)) {
				const position = students.findIndex((x) => x.id === grade.student);
				if (position === 0) grade.value = 6 + g;
				if (position === 1 + g && g % 2 === 0) grade.value = math ? 5 : 5.5;
				if (position === 4 - g && g % 2 === 1 && math) grade.value = 5;
			}
		}
	}
	const first = [...s.assignments];
	for (const [n, a] of first.entries()) {
		const g = current.findIndex((group) => group.id === a.group);
		if (g < 0) continue;
		const assignment = id("assignment", 100 + n);
		s.assignments.push({ ...a, id: assignment, period: "Periodo 2 · Muestra" });
		const math = a.subject === "Matemáticas";
		// Coverage per group: complete, all drafts, one subject only, half, none.
		if (g === 4 || (g === 2 && !math)) continue;
		for (const [position, student] of roster(a.group).entries()) {
			if (g === 3 && position % 2) continue;
			s.grades.push({
				id: id("grade", 1000 + n * 10 + position),
				assignment,
				student: student.id,
				value: position === 1 && g === 0 ? 5 : 6 + ((position + g) % 5),
				published: g === 1 || g === 3 ? false : position !== 5,
				history: [],
			});
		}
	}
}

/** Only transforms freshly generated seed data, never persisted/user-authored strings. */
function naturalSeed(seed: State): State {
	const replacements: Record<string, string> = {
		"Instituto Aurora · ejemplo": "Instituto Aurora",
		"2026–2027 · Muestra": "Agosto 2026 – Julio 2027",
		"2025–2026 · Muestra histórica": "Agosto 2025 – Julio 2026",
		"Verificado DEMO": "Verificado",
		"Personal de ejemplo": "Patricia Salgado Méndez",
		"Control escolar demo": "Patricia Salgado Méndez",
		"Verificación exclusivamente sintética":
			"Identidad y parentesco cotejados con el expediente de inscripción",
		"Cambio de alcance ficticio con motivo de ejemplo":
			"Actualización de personas autorizadas a solicitud de la tutora",
		"Modelo sintético sin QR ni token":
			"Credencial vigente para el ciclo escolar",
		"Revisión anterior revocada por reemisión demo":
			"Reposición por deterioro; revisión anterior revocada",
		"Entrada sintética": "Entrada",
		"Salida sintética": "Salida",
		"Entrada justificada en ejemplo": "Entrada justificada",
		"Llegada acordada en escenario ficticio":
			"Retraso por cita médica, comprobante recibido en control escolar",
		"Escenario ficticio: acuerdo de convivencia durante una actividad.":
			"Interrumpió la exposición de su equipo; acordó respetar los turnos de participación.",
		"Escenario ficticio: colaboración en proyecto de ciencias.":
			"Organizó los materiales y apoyó a su equipo durante el proyecto de ciencias.",
		"Nota interna sintética: preparar acompañamiento; no compartir esta nota.":
			"Conversar con la docente titular para acordar el acompañamiento en el aula.",
		"Revisar el acuerdo en la siguiente sesión de muestra.":
			"Revisar los acuerdos durante la tutoría del próximo lunes.",
		"Traslado de ejemplo posterior a la jornada de muestra":
			"Cambio al turno vespertino solicitado por la familia, efectivo después de la jornada del 19 de octubre",
		"Docente Ejemplo 1": "Gabriel Torres Nájera",
		"Docente Ejemplo 2": "Elena Cárdenas Solís",
		"Periodo 1 · Muestra": "Primer trimestre",
		"Periodo 2 · Muestra": "Segundo trimestre",
		"Revisión sintética de captura":
			"Corrección de captura tras cotejar la rúbrica de evaluación",
		"Acceso principal · Equipo de muestra": "Acceso principal",
		"Biblioteca · Equipo de muestra": "Biblioteca",
		"Alta local: sin conexión física ni sincronización":
			"Asignado al registro de acceso principal",
		"Desactivación ficticia para mantenimiento; sin dispositivo real":
			"Fuera de servicio por mantenimiento preventivo",
		"Personal Ejemplo 1": "Adriana Beltrán Ríos",
		"Personal Ejemplo 2": "Patricia Salgado Méndez",
		"Personal Ejemplo 4": "Roberto Aguilar Téllez",
		"Día sin clase de muestra; calendario ficticio":
			"Sesión ordinaria del Consejo Técnico Escolar",
		"Proyecto de ciencias · Muestra": "Materiales para el proyecto de ciencias",
		"Simulación: preparar una actividad colaborativa para el grupo. No se ha enviado ningún aviso.":
			"El jueves 22 de octubre trabajaremos en equipos. Traer una botella reutilizada, una regla y colores; los demás materiales estarán disponibles en el aula.",
		"Encuentro de familias · Borrador de muestra":
			"Reunión de familias del primer trimestre",
		"Borrador sintético para revisar audiencia antes de simular publicación.":
			"Propuesta de reunión para el 5 de noviembre: avances de aprendizaje, hábitos de estudio y acuerdos de acompañamiento. Horario pendiente de confirmar.",
		"Reconocimiento individual · Muestra": "Reconocimiento por colaboración",
		"Ejemplo de contenido compartido, sin entrega por correo ni push.":
			"Reconocemos su disposición para escuchar y ayudar a sus compañeros durante las actividades del grupo. Gracias por acompañar este esfuerzo desde casa.",
		"Propuesta sintética pendiente de revisión.":
			"Revisar la distribución de equipos y los responsables de materiales antes de la próxima sesión.",
	};
	const families = [
		"Mendoza Ruiz",
		"Castillo Vega",
		"Hernández Soto",
		"López Acosta",
		"García Pineda",
		"Martínez Luna",
		"Ramírez Ochoa",
		"Torres Salas",
		"Flores Ibarra",
		"Vargas Molina",
		"Reyes Duarte",
		"Morales Rivas",
		"Cruz Navarro",
		"Ortiz Castañeda",
		"Rojas Padilla",
		"Sánchez Lozano",
		"Medina Carrillo",
		"Delgado Fuentes",
	];
	const guardians = [
		"Mariana Ruiz Salcedo",
		"Daniela Vega Montes",
		"Isabel Soto Campos",
		"Rocío Acosta Trejo",
		"Verónica Pineda Rosales",
		"Claudia Luna Espinoza",
		"Adriana Ochoa Serrano",
		"Beatriz Salas Montero",
		"Lorena Ibarra Valdés",
		"Patricia Molina Cervantes",
		"Silvia Duarte Estrada",
		"Teresa Rivas Cabrera",
		"Gabriela Navarro León",
		"Mónica Castañeda Bravo",
		"Alejandra Padilla Solano",
		"Cecilia Lozano Nieto",
		"Raquel Carrillo Zamora",
		"Lucía Fuentes Escobar",
	];
	for (const [i, student] of seed.students.entries()) {
		replacements[student.name] =
			`${student.name.split(" ")[0]} ${families[Math.floor(i / 2)]}`;
		replacements[student.matricula] =
			`AUR-${i < 30 ? "26" : "25"}${String(i + 101).padStart(3, "0")}`;
		replacements[
			`Familia Ejemplo ${String(Math.floor(i / 2) + 1).padStart(2, "0")}`
		] = guardians[Math.floor(i / 2)];
		if (i % 6 === 0)
			replacements[`Tutor alterno Ejemplo ${i + 1}`] =
				`Javier ${families[Math.floor(i / 2)].split(" ")[0]} Esquivel`;
	}
	for (const group of seed.groups)
		replacements[group.name] = group.name.replace(" · Muestra", "");
	// Exact value mapping is confined to this freshly constructed dataset.
	const s: State = JSON.parse(JSON.stringify(seed), (_key, value: unknown) =>
		typeof value === "string" ? (replacements[value] ?? value) : value,
	);
	for (const [i, slot] of s.schedules.entries()) {
		const groupIndex = Math.floor(i / 2);
		const hour = (groupIndex % 2 ? 14 : 8) + Math.floor(groupIndex / 2);
		slot.start = `${String(hour).padStart(2, "0")}:00`;
		slot.end = `${String(hour + 1).padStart(2, "0")}:00`;
	}
	return s;
}

/** Conservative dependency-aware merge: never patches existing records or adopts conflicting identities. */
export function mergeMockData(existing: State) {
	const seed = buildMockData(),
		state = structuredClone(existing);
	let added = 0;
	const conflicts: string[] = [];
	const usable = Object.fromEntries(
		collections.map((k) => [k, new Set<string>()]),
	) as Record<Collection, Set<string>>;
	const ids = new Set(collections.flatMap((k) => state[k].map((x) => x.id)));
	function merge<K extends Collection>(
		key: K,
		valid: (row: State[K][number]) => boolean = () => true,
		duplicate: (a: State[K][number], b: State[K][number]) => boolean = () =>
			false,
	) {
		const target = state[key] as State[K][number][];
		for (const source of seed[key]) {
			const row = source as State[K][number];
			const old = target.find((x) => x.id === row.id);
			if (old) {
				if (JSON.stringify(old) === JSON.stringify(row) && valid(row))
					usable[key].add(row.id);
				else
					conflicts.push(
						`${key}: ${row.id} conservado; registro existente diferente`,
					);
				continue;
			}
			if (
				ids.has(row.id) ||
				target.some((x) => duplicate(x, row)) ||
				!valid(row)
			) {
				conflicts.push(
					`${key}: ${row.id} omitido por conflicto o referencia no disponible`,
				);
				continue;
			}
			target.push(structuredClone(row));
			ids.add(row.id);
			usable[key].add(row.id);
			added++;
		}
	}
	const has = (key: Collection, ref: string) => usable[key].has(ref);
	merge(
		"cycles",
		() => true,
		(a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
	);
	merge(
		"groups",
		(g) => has("cycles", g.cycle),
		(a, b) =>
			a.cycle === b.cycle &&
			a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
	);
	merge(
		"students",
		(x) =>
			x.enrollments.every(
				(e) => has("groups", e.group) && has("cycles", e.cycle),
			),
		(a, b) =>
			a.matricula.trim().toUpperCase() === b.matricula.trim().toUpperCase(),
	);
	merge(
		"links",
		(x) => has("students", x.student),
		(a, b) =>
			a.student === b.student &&
			a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
	);
	merge(
		"credentials",
		(x) => has("students", x.student),
		(a, b) =>
			a.student === b.student &&
			(a.revision === b.revision || (a.active && b.active)),
	);
	merge(
		"events",
		(x) =>
			has("students", x.student) &&
			has("groups", x.group || "") &&
			has("cycles", x.cycle || ""),
	);
	merge("adjustments", (x) => has("events", x.event));
	merge(
		"assignments",
		(x) => has("groups", x.group),
		(a, b) =>
			a.group === b.group && a.subject === b.subject && a.period === b.period,
	);
	merge(
		"schedules",
		(x) => has("assignments", x.assignment),
		(a, b) =>
			a.day === b.day &&
			state.assignments.find((x) => x.id === a.assignment)?.group ===
				state.assignments.find((x) => x.id === b.assignment)?.group &&
			a.start < b.end &&
			a.end > b.start,
	);
	merge(
		"grades",
		(x) => has("students", x.student) && has("assignments", x.assignment),
		(a, b) => a.student === b.student && a.assignment === b.assignment,
	);
	merge(
		"conduct",
		(x) =>
			has("students", x.student) &&
			has("groups", x.group || "") &&
			has("cycles", x.cycle || ""),
	);
	merge(
		"transfers",
		(x) =>
			has("students", x.student) &&
			has("groups", x.from) &&
			has("groups", x.to) &&
			has("cycles", x.cycle),
		(a, b) => a.student === b.student && a.cycle === b.cycle,
	);
	// New simulated publication snapshots are resolved against the merged, current links.
	for (const n of seed.notices)
		if (n.published) n.recipients = recipients(state, n.audience, n.target);
	merge(
		"notices",
		(n) =>
			(n.audience === "school" ||
				has(n.audience === "group" ? "groups" : "students", n.target)) &&
			(!n.published || n.recipients.length > 0),
	);
	merge("devices");
	merge("staff");
	merge("exceptions");
	return { state, added, conflicts };
}
