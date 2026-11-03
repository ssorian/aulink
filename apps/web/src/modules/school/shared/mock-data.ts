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

const conductAuthors = [
	"Patricia Salgado Méndez",
	"Adriana Beltrán Ríos",
	"Roberto Aguilar Téllez",
];
const conductDates = [
	"2026-08-26",
	"2026-09-09",
	"2026-09-23",
	"2026-10-07",
	"2026-10-14",
	"2026-10-19",
];
/** Current-cycle reports fall in Aug–Oct 2026; the historical cycle ends before. */
const conductDate = (i: number, cycle: string) =>
	cycle === id("cycle", 2)
		? `2026-0${3 + ((i / 3) % 3)}-${String(10 + (i % 15)).padStart(2, "0")}`
		: conductDates[(i / 3) % conductDates.length];

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
	// Upper-secondary groups follow a semester plan with their own subjects.
	for (const [n, semester] of ["1°", "3°"].entries())
		s.groups.push({
			id: id("group", 6 + n),
			name: `${semester} Semestre A · Muestra`,
			cycle: id("cycle", 1),
			grade: `${semester} semestre`,
			shift: n ? "Vespertino" : "Matutino",
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
	for (let i = 0; i < 48; i++) {
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
				// Legacy seeds predate these fields so unedited stored rows still migrate.
				...(legacy
					? {}
					: {
							date: conductDate(i, group.cycle),
							author: conductAuthors[(i / 3) % conductAuthors.length],
						}),
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
			const hour = (g % 2 ? 14 : 8) + Math.floor(g / 2);
			s.schedules.push({
				id: id("schedule", n),
				assignment,
				day: subject ? "Miércoles" : "Lunes",
				start: `${String(hour).padStart(2, "0")}:00`,
				end: `${String(hour + 1).padStart(2, "0")}:00`,
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
	curriculumSample(s);
	if (!legacy) s = naturalSeed(s);
	for (const notice of s.notices)
		if (notice.published)
			notice.recipients = recipients(s, notice.audience, notice.target);
	return s;
}

type Course = { subject: string; teacher: number; mean: number; trend: number };
const course = (subject: string, teacher: number, mean: number, trend = 0) => ({
	subject,
	teacher,
	mean,
	trend,
});
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/** Study plan by level: lower secondary by grade, upper secondary by semester. */
function studyPlan(grade = ""): Course[] {
	if (grade === "1° semestre")
		return [
			course("Matemáticas I", 11, 6.3, 0.2),
			course("Química I", 12, 6.9, -0.2),
			course("Lectura, Expresión Oral y Escrita I", 13, 8, 0.1),
			course("Inglés I", 7, 7.5, 0.2),
			course("Ética I", 15, 8.5),
			course("Informática I", 16, 8.9),
			course("Metodología de la Investigación", 14, 7.8, -0.1),
		];
	if (grade === "3° semestre")
		return [
			course("Matemáticas III", 11, 6.1, 0.3),
			course("Física I", 14, 6.4, -0.3),
			course("Biología I", 12, 7.4),
			course("Historia de México I", 15, 7.7, 0.1),
			course("Literatura I", 13, 8.2),
			course("Inglés III", 7, 7.8, 0.1),
			course("Educación Física", 10, 9.3),
		];
	const science =
		grade === "1°"
			? course("Biología", 3, 7.7, 0.1)
			: grade === "2°"
				? course("Física", 4, 6.6, -0.3)
				: course("Química", 5, 6.9, 0.2);
	return [
		course("Matemáticas", 1, 6.8, 0.3),
		course("Lengua y comunicación", 2, 8.1),
		science,
		course("Historia", 6, 7.9, -0.2),
		course("Inglés", 7, 7.3, 0.2),
		course("Formación Cívica y Ética", 8, 8.6),
		course("Artes", 9, 9.1),
		course("Educación Física", 10, 9.4),
	];
}

/** Stable pseudo-random number in [0, 1) so the sample is identical on every load. */
function noise(...seed: number[]) {
	let h = 2166136261;
	for (const n of seed) h = Math.imul(h ^ n, 16777619);
	h = Math.imul(h ^ (h >>> 15), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Current-cycle groups get their full study plan, grades whose averages differ
 * by subject, and a partially captured second period, so evaluation follow-up
 * has real work to show.
 */
function curriculumSample(s: State) {
	const cycle = s.cycles[0]?.id;
	const current = s.groups.filter((g) => g.cycle === cycle);
	const roster = (group: string) =>
		s.students.filter((x) => x.enrollments.some((e) => e.group === group));
	const studentIndex = new Map(s.students.map((x, i) => [x.id, i]));
	const value = (
		c: Course,
		subject: number,
		g: number,
		student: string,
		period: number,
		upper: boolean,
	) => {
		const n = studentIndex.get(student) ?? 0;
		const ability = (noise(n, 1) - 0.5) * 3.4;
		const raw =
			c.mean +
			period * c.trend +
			(noise(g, 7) - 0.5) * 1.2 +
			(ability * (10.6 - c.mean)) / 3 +
			(noise(n, subject, period, g) - 0.5) * 1.8;
		const clamped = Math.min(10, Math.max(5, raw));
		return upper ? Math.round(clamped * 10) / 10 : Math.round(clamped);
	};
	const teacher = (n: number) => `Docente Ejemplo ${n}`;
	const busy = (group: string, who: string, day: string, start: string) =>
		s.schedules.some((slot) => {
			const a = s.assignments.find((x) => x.id === slot.assignment);
			const owner = s.groups.find((x) => x.id === a?.group);
			return (
				slot.day === day &&
				slot.start === start &&
				owner?.cycle === cycle &&
				(a?.group === group || a?.teacher === who)
			);
		});
	let next = 0;
	for (const [g, group] of current.entries()) {
		const upper = group.grade?.includes("semestre") ?? false;
		const students = roster(group.id);
		const base = group.shift === "Vespertino" ? 14 : 7;
		for (const [k, c] of studyPlan(group.grade).entries()) {
			const existing = s.assignments.find(
				(a) => a.group === group.id && a.subject === c.subject,
			);
			let first = existing?.id;
			if (!first) {
				first = id("assignment", 200 + next++);
				s.assignments.push({
					id: first,
					group: group.id,
					subject: c.subject,
					teacher: teacher(c.teacher),
					period: "Periodo 1 · Muestra",
					min: 0,
					max: 10,
				});
				// One weekly lesson in the group's shift, never double-booking the group or teacher.
				for (let t = 0; t < 35; t++) {
					const day = DAYS[(k + g + t) % 5];
					const hour = base + ((k + Math.floor(t / 5)) % 7);
					const start = `${String(hour).padStart(2, "0")}:00`;
					if (busy(group.id, teacher(c.teacher), day, start)) continue;
					s.schedules.push({
						id: id("schedule", 200 + next),
						assignment: first,
						day,
						start,
						end: `${String(hour + 1).padStart(2, "0")}:00`,
					});
					break;
				}
				for (const student of students)
					s.grades.push({
						id: id("grade", 2000 + next * 10 + students.indexOf(student)),
						assignment: first,
						student: student.id,
						value: value(c, k, g, student.id, 0, upper),
						// One closed-period draft that was never published.
						published: !(g === 3 && c.subject === "Artes"),
						history: [],
					});
			}
			// Audited grades keep the value their correction history describes.
			else
				for (const grade of s.grades.filter(
					(x) => x.assignment === first && !x.history.length,
				))
					grade.value = value(c, k, g, grade.student, 0, upper);
			// Second period: coverage varies by subject and group.
			const source = s.assignments.find((a) => a.id === first);
			const n = s.assignments.indexOf(source as (typeof s.assignments)[number]);
			const second = existing
				? id("assignment", 100 + n)
				: id("assignment", 600 + next);
			s.assignments.push({
				...(source as (typeof s.assignments)[number]),
				id: second,
				period: "Periodo 2 · Muestra",
			});
			const coverage = noise(g, k, 31);
			if (coverage >= 0.82) continue;
			for (const [position, student] of students.entries()) {
				if (coverage >= 0.7 && position % 2) continue;
				s.grades.push({
					id: existing
						? id("grade", 1000 + n * 10 + position)
						: id("grade", 6000 + next * 10 + position),
					assignment: second,
					student: student.id,
					value: value(c, k, g, student.id, 1, upper),
					published: coverage < 0.48,
					history: [],
				});
			}
		}
	}
	for (let n = 3; n <= 16; n++)
		s.staff.push({
			id: id("staff", 10 + n),
			name: teacher(n),
			role: "Docente",
			history: [],
		});
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
		"Docente Ejemplo 3": "Sofía Ramírez Cordero",
		"Docente Ejemplo 4": "Héctor Villalobos Arce",
		"Docente Ejemplo 5": "Natalia Ponce Guzmán",
		"Docente Ejemplo 6": "Arturo Méndez Robles",
		"Docente Ejemplo 7": "Karina Ortega Lara",
		"Docente Ejemplo 8": "Leticia Barrera Gil",
		"Docente Ejemplo 9": "Fernando Quintero Paz",
		"Docente Ejemplo 10": "Omar Galindo Reyna",
		"Docente Ejemplo 11": "Ricardo Ávila Montaño",
		"Docente Ejemplo 12": "Mariela Juárez Treviño",
		"Docente Ejemplo 13": "Diana Esparza Ruelas",
		"Docente Ejemplo 14": "Iván Cortés Bermúdez",
		"Docente Ejemplo 15": "Julia Aguirre Campos",
		"Docente Ejemplo 16": "Saúl Domínguez Prado",
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
		"Guerrero Valle",
		"Juárez Peña",
		"Aguilar Moreno",
		"Herrera Bustos",
		"Romero Lara",
		"Salinas Cortés",
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
		"Elena Valle Sandoval",
		"Norma Peña Villegas",
		"Sandra Moreno Gallegos",
		"Andrea Bustos Quiroz",
		"Marisol Lara Arriaga",
		"Rebeca Cortés Medrano",
	];
	for (const [i, student] of seed.students.entries()) {
		replacements[student.name] =
			`${student.name.split(" ")[0]} ${families[Math.floor(i / 2)]}`;
		replacements[student.matricula] =
			`AUR-${i < 30 || i >= 36 ? "26" : "25"}${String(i + 101).padStart(3, "0")}`;
		replacements[
			`Familia Ejemplo ${String(Math.floor(i / 2) + 1).padStart(2, "0")}`
		] = guardians[Math.floor(i / 2)];
		if (i % 6 === 0)
			replacements[`Tutor alterno Ejemplo ${i + 1}`] =
				`Javier ${families[Math.floor(i / 2)].split(" ")[0]} Esquivel`;
	}
	for (const group of seed.groups)
		replacements[group.name] = group.name.replace(" · Muestra", "");
	const contact = new Map<string, { phone?: string; email?: string }>();
	for (const [i, link] of seed.links.entries()) {
		// Every third guardian has no contact data so "Sin registrar" is exercised.
		contact.set(link.id, {
			phone:
				i % 3 === 2
					? undefined
					: `55${String(30000000 + i * 137).padStart(8, "0")}`,
			email: i % 3 === 0 ? `tutor${i + 1}@example.com` : undefined,
		});
	}
	// Exact value mapping is confined to this freshly constructed dataset.
	const s: State = JSON.parse(JSON.stringify(seed), (_key, value: unknown) =>
		typeof value === "string" ? (replacements[value] ?? value) : value,
	);
	for (const link of s.links) {
		link.relation = link.name.startsWith("Javier") ? "Padre" : "Madre";
		Object.assign(link, contact.get(link.id));
	}
	// The first sample guardian is the documented example with full contact data.
	const first = s.links.find((l) => l.name === "Mariana Ruiz Salcedo");
	if (first) {
		first.phone = "5551234567";
		first.email = "mariana.ruiz@example.com";
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
