import { z } from "zod";
import {
	applyCalendar,
	calendarEventsSchema,
	calendarHolidaysSchema,
} from "./calendar-workflows";
import { cycleDates, cycleSchema } from "./cycle-dates";
import {
	applySchedule,
	assertDate,
	scheduleChangesSchema,
	scheduleWindowsSchema,
	schoolToday,
} from "./schedule-helpers";

const enrollment = z.object({ group: z.string(), cycle: z.string() });
const history = z.array(
	z.object({
		id: z.string(),
		reason: z.string(),
		value: z.string(),
		author: z.string(),
	}),
);
const schema = z.object({
	version: z.literal(1),
	school: z.object({
		name: z.string(),
		timezone: z.string(),
		shift: z.string(),
	}),
	cycles: z.array(cycleSchema),
	groups: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			cycle: z.string(),
			grade: z.string().optional(),
			shift: z.string().optional(),
		}),
	),
	calendarHolidays: calendarHolidaysSchema,
	calendarEvents: calendarEventsSchema,
	exceptions: z.array(
		z.object({ id: z.string(), date: z.string(), reason: z.string() }),
	),
	students: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			matricula: z.string(),
			enrollments: z.array(enrollment),
		}),
	),
	links: z.array(
		z.object({
			id: z.string(),
			student: z.string(),
			name: z.string(),
			relation: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().optional(),
			status: z.string(),
			history,
		}),
	),
	credentials: z.array(
		z.object({
			id: z.string(),
			student: z.string(),
			revision: z.number(),
			active: z.boolean(),
			reason: z.string(),
		}),
	),
	devices: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			active: z.boolean(),
			reason: z.string(),
		}),
	),
	events: z.array(
		z.object({
			id: z.string(),
			student: z.string(),
			date: z.string(),
			time: z.string(),
			kind: z.string(),
			group: z.string().optional(),
			cycle: z.string().optional(),
		}),
	),
	adjustments: z.array(
		z.object({
			id: z.string(),
			event: z.string(),
			value: z.string(),
			reason: z.string(),
			author: z.string(),
		}),
	),
	notices: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			text: z.string(),
			audience: z.string(),
			target: z.string(),
			published: z.boolean(),
			recipients: z.array(z.string()),
		}),
	),
	conduct: z.array(
		z.object({
			id: z.string(),
			student: z.string(),
			kind: z.string(),
			group: z.string().optional(),
			cycle: z.string().optional(),
			text: z.string(),
			internal: z.string(),
			followup: z.string(),
			shared: z.string(),
			published: z.boolean(),
			/** ISO yyyy-mm-dd in the school's calendar; absent on records saved before it existed. */
			date: z.string().optional(),
			author: z.string().optional(),
		}),
	),
	assignments: z.array(
		z.object({
			id: z.string(),
			subject: z.string(),
			teacher: z.string(),
			period: z.string(),
			group: z.string(),
			min: z.number(),
			max: z.number(),
		}),
	),
	grades: z.array(
		z.object({
			id: z.string(),
			assignment: z.string(),
			student: z.string(),
			value: z.number(),
			published: z.boolean(),
			history,
		}),
	),
	evaluationRules: z
		.object({ passing: z.number(), riskSubjects: z.number() })
		.default({ passing: 6, riskSubjects: 2 }),
	transfers: z
		.array(
			z.object({
				id: z.string(),
				student: z.string(),
				cycle: z.string(),
				from: z.string(),
				to: z.string(),
				reason: z.string(),
				author: z.string(),
			}),
		)
		.default([]),
	withdrawals: z
		.array(
			z.object({
				id: z.string(),
				student: z.string(),
				cycle: z.string(),
				reason: z.string(),
				author: z.string(),
			}),
		)
		.default([]),
	schedules: z
		.array(
			z.object({
				id: z.string(),
				assignment: z.string(),
				day: z.string(),
				start: z.string(),
				end: z.string(),
			}),
		)
		.default([]),
	scheduleChanges: scheduleChangesSchema,
	scheduleWindows: scheduleWindowsSchema,
	staff: z.array(
		z.object({ id: z.string(), name: z.string(), role: z.string(), history }),
	),
});
export type State = z.infer<typeof schema>;
export type Command = { kind: string; data: Record<string, string> };
/** Legacy mode reproduces the exact original seed for bounded migration only. */
export function initialState(legacy = false): State {
	const state: State = {
		version: 1,
		school: {
			name: "Instituto Aurora · ejemplo",
			timezone: "America/Mexico_City",
			shift: "Matutino",
		},
		cycles: [{ id: "c1", name: "2026–2027" }],
		groups: [
			{ id: "g1", name: "1° A", cycle: "c1", grade: "1°", shift: "Matutino" },
			{ id: "g2", name: "2° B", cycle: "c1", grade: "2°", shift: "Matutino" },
		],
		calendarHolidays: [],
		calendarEvents: [],
		exceptions: [],
		students: [
			{
				id: "s1",
				name: "Ana Ejemplo",
				matricula: "DEMO-001",
				enrollments: [{ group: "g1", cycle: "c1" }],
			},
			{
				id: "s2",
				name: "Leo Ejemplo",
				matricula: "DEMO-002",
				enrollments: [{ group: "g2", cycle: "c1" }],
			},
		],
		links: [
			{
				id: "l1",
				student: "s1",
				name: "Tutor Ejemplo",
				status: "Verificado DEMO",
				history: [],
			},
		],
		credentials: [],
		devices: [],
		events: [
			{
				id: "e1",
				student: "s1",
				date: "2026-01-15",
				time: "07:05",
				kind: "Entrada sintética",
				group: "g1",
				cycle: "c1",
			},
		],
		adjustments: [],
		notices: [],
		conduct: [],
		assignments: [],
		grades: [],
		evaluationRules: { passing: 6, riskSubjects: 2 },
		staff: [],
		schedules: [],
		scheduleChanges: [],
		scheduleWindows: [],
		transfers: [],
		withdrawals: [],
	};
	if (!legacy) {
		state.school.name = "Instituto Aurora";
		state.students[0].name = "Ana Sofía Mendoza Ruiz";
		state.students[0].matricula = "AUR-26001";
		state.students[1].name = "Leonardo Castillo Vega";
		state.students[1].matricula = "AUR-26002";
		state.links[0].name = "Mariana Ruiz Salcedo";
		state.links[0].status = "Verificado";
		state.links[0].relation = "Madre";
		state.links[0].phone = "5551234567";
		state.links[0].email = "mariana.ruiz@example.com";
		state.events[0].kind = "Entrada";
		state.events[0].date = "2026-10-19";
	}
	return state;
}
export const isVerifiedGuardian = (status: string) =>
	status === "Verificado" || status === "Verificado DEMO";
export function restore(raw: string): State | null {
	try {
		return schema.parse(JSON.parse(raw));
	} catch {
		return null;
	}
}
export function activeGroup(s: State, student: string, cycle: string) {
	if (s.withdrawals.some((w) => w.student === student && w.cycle === cycle))
		return undefined;
	return (
		s.transfers.filter((t) => t.student === student && t.cycle === cycle).at(-1)
			?.to ||
		s.students
			.find((x) => x.id === student)
			?.enrollments.find((e) => e.cycle === cycle)?.group
	);
}
export function wasEnrolled(s: State, student: string, group: string) {
	const g = s.groups.find((x) => x.id === group);
	return (
		!!g &&
		(s.students
			.find((x) => x.id === student)
			?.enrollments.some((e) => e.group === group && e.cycle === g.cycle) ||
			s.transfers.some(
				(t) =>
					t.student === student &&
					t.cycle === g.cycle &&
					(t.from === group || t.to === group),
			))
	);
}
export const currentGroup = (s: State, id: string) => {
	const cycle = s.students.find((x) => x.id === id)?.enrollments.at(-1)?.cycle;
	return cycle ? activeGroup(s, id, cycle) : undefined;
};
export function recipients(s: State, audience: string, target: string) {
	return [
		...new Set(
			s.links
				.filter(
					(l) =>
						isVerifiedGuardian(l.status) &&
						(audience === "school" ||
							(audience === "student"
								? l.student === target
								: activeGroup(
										s,
										l.student,
										s.groups.find((g) => g.id === target)?.cycle || "",
									) === target)),
				)
				.map((l) => l.name),
		),
	];
}
/** Local copy of experience.ts's year lookup; importing it would be circular. */
function startYear(s: State, cycle: string) {
	const c = s.cycles.find((x) => x.id === cycle);
	return Number((c?.startDate || c?.name || "").match(/\d{4}/)?.[0] ?? 0);
}
function required(value: string | undefined, label: string) {
	if (!value?.trim()) throw Error(`Completa ${label}.`);
	return value.trim();
}
export function apply(state: State, { kind, data: d }: Command): State {
	const s = structuredClone(state);
	const id = `demo-${crypto.randomUUID()}`;
	const req = (key: string) => required(d[key], key);
	const reason = () => req("reason");
	const student = () => {
		const x = s.students.find((x) => x.id === d.student);
		if (!x) throw Error("Selecciona un alumno existente.");
		return x;
	};
	const group = () => {
		const x = s.groups.find((x) => x.id === d.group);
		if (!x) throw Error("Selecciona un grupo existente.");
		return x;
	};
	const entry = (value: string) => ({
		id: `audit-${crypto.randomUUID()}`,
		value,
		reason: reason(),
		author: "Patricia Salgado Méndez",
	});
	switch (kind) {
		case "school":
			new Intl.DateTimeFormat("es", { timeZone: req("timezone") });
			s.school = {
				name: req("name"),
				timezone: req("timezone"),
				shift: req("shift"),
			};
			break;
		case "cycle":
			if (s.cycles.some((x) => x.name === req("name")))
				throw Error("El ciclo ya existe.");
			s.cycles.push({ id, name: req("name"), ...cycleDates(d, true) });
			break;
		case "cycle-dates": {
			const cycle = s.cycles.find((item) => item.id === d.id);
			if (!cycle) throw Error("Selecciona un ciclo existente.");
			Object.assign(cycle, cycleDates(d));
			break;
		}
		case "group":
			if (!s.cycles.some((x) => x.id === d.cycle))
				throw Error("Selecciona un ciclo.");
			s.groups.push({
				id,
				name: req("name"),
				cycle: d.cycle,
				grade: d.grade || undefined,
				shift: d.shift || s.school.shift,
			});
			break;
		case "group-edit": {
			const g = group();
			g.name = req("name");
			g.grade = req("grade");
			g.shift = req("shift");
			break;
		}
		case "schedule":
		case "schedule-window":
		case "schedule-occurrence":
			applySchedule(s, kind, d, id);
			break;
		case "calendar-holiday":
		case "calendar-event":
			applyCalendar(s, kind, d, id);
			break;
		case "exception":
			assertDate(req("date"));
			s.exceptions.push({ id, date: req("date"), reason: reason() });
			break;
		case "student": {
			const matricula = req("matricula").toUpperCase();
			if (s.students.some((x) => x.matricula.toUpperCase() === matricula))
				throw Error("La matrícula ya existe.");
			const g = group();
			s.students.push({
				id,
				name: req("name"),
				matricula,
				enrollments: [{ group: g.id, cycle: g.cycle }],
			});
			break;
		}
		case "enroll": {
			const x = student(),
				g = group();
			if (x.enrollments.some((e) => e.cycle === g.cycle))
				throw Error(
					"Ya tiene inscripción en ese ciclo; crea un ciclo y grupo nuevos.",
				);
			x.enrollments.push({ group: g.id, cycle: g.cycle });
			break;
		}
		case "transfer": {
			const x = student(),
				g = group(),
				from = activeGroup(s, x.id, g.cycle);
			if (!from)
				throw Error(
					"No tiene inscripción en ese ciclo; utiliza reinscripción.",
				);
			if (from === g.id) throw Error("El alumno ya está activo en este grupo.");
			s.transfers.push({
				id,
				student: x.id,
				cycle: g.cycle,
				from,
				to: g.id,
				reason: reason(),
				author: "Patricia Salgado Méndez",
			});
			break;
		}
		case "withdraw": {
			const x = student();
			const cycle = x.enrollments
				.map((e) => e.cycle)
				.sort((a, b) => startYear(s, b) - startYear(s, a))[0];
			if (!cycle) throw Error("El alumno no tiene inscripción activa.");
			if (s.withdrawals.some((w) => w.student === x.id && w.cycle === cycle))
				throw Error("El alumno ya está dado de baja en este ciclo.");
			s.withdrawals.push({
				id,
				student: x.id,
				cycle,
				reason: reason(),
				author: "Patricia Salgado Méndez",
			});
			break;
		}
		case "guardian":
			student();
			if (
				s.links.some(
					(l) =>
						l.student === d.student &&
						l.name === d.name &&
						isVerifiedGuardian(l.status),
				)
			)
				throw Error("El vínculo ya existe.");
			s.links.push({
				id,
				student: d.student,
				name: req("name"),
				status: "Verificado",
				history: [entry("Verificado")],
			});
			break;
		case "guardian-edit": {
			const x = s.links.find((x) => x.id === d.id);
			if (!x) throw Error("Vínculo no encontrado.");
			x.name = req("name");
			x.relation = d.relation?.trim() || undefined;
			x.phone = d.phone?.trim() || undefined;
			x.email = d.email?.trim() || undefined;
			break;
		}
		case "guardian-status": {
			const x = s.links.find((x) => x.id === d.id);
			if (!x) throw Error("Vínculo no encontrado.");
			if (!["Restringido", "Revocado"].includes(d.status))
				throw Error("Estado inválido.");
			x.history.push(entry(d.status));
			x.status = d.status;
			break;
		}
		case "credential": {
			student();
			reason();
			const previous = s.credentials.filter((x) => x.student === d.student);
			for (const x of previous) x.active = false;
			s.credentials.push({
				id,
				student: d.student,
				revision: previous.length + 1,
				active: true,
				reason: d.reason,
			});
			break;
		}
		case "device":
			s.devices.push({
				id,
				name: req("name"),
				active: true,
				reason: "Alta local; sin aprovisionamiento",
			});
			break;
		case "device-off": {
			const x = s.devices.find((x) => x.id === d.id);
			if (!x) throw Error("Equipo no encontrado.");
			x.active = false;
			x.reason = reason();
			break;
		}
		case "adjust":
			if (!s.events.some((e) => e.id === d.event))
				throw Error("Evento inexistente.");
			s.adjustments.push({
				id,
				event: d.event,
				value: req("value"),
				reason: reason(),
				author: "Patricia Salgado Méndez",
			});
			break;
		case "notice": {
			const old = s.notices.find((x) => x.id === d.id);
			if (old?.published) throw Error("La simulación publicada no se edita.");
			const values = {
				title: req("title"),
				text: req("text"),
				audience: req("audience"),
				target: d.target || "",
				published: false,
				recipients: [],
			};
			if (old) Object.assign(old, values);
			else s.notices.push({ id, ...values });
			break;
		}
		case "notice-publish": {
			const x = s.notices.find((x) => x.id === d.id);
			if (!x || x.published) throw Error("Selecciona un borrador.");
			x.recipients = recipients(s, x.audience, x.target);
			if (!x.recipients.length)
				throw Error("No hay tutores verificados en esta audiencia.");
			x.published = true;
			break;
		}
		case "conduct":
			student();
			if (d.group && activeGroup(s, d.student, group().cycle) !== d.group)
				throw Error("El alumno no está inscrito en este grupo y ciclo.");
			s.conduct.push({
				id,
				student: d.student,
				kind: req("kind"),
				text: req("text"),
				internal: d.internal || "",
				followup: req("followup"),
				group: d.group || undefined,
				cycle: d.group ? group().cycle : undefined,
				shared: req("shared"),
				published: false,
				date: schoolToday(s.school.timezone),
				author: "Patricia Salgado Méndez",
			});
			break;
		case "conduct-followup": {
			const x = s.conduct.find((x) => x.id === d.id);
			if (!x) throw Error("Reporte inexistente.");
			x.followup += `\nSeguimiento · Patricia Salgado Méndez: ${req("followup")} · Motivo: ${reason()}`;
			break;
		}
		case "conduct-publish": {
			const x = s.conduct.find((x) => x.id === d.id);
			if (!x || x.published) throw Error("Selecciona un borrador.");
			x.published = true;
			break;
		}
		case "assignment": {
			group();
			const min = Number(req("min")),
				max = Number(req("max"));
			if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max)
				throw Error("La escala debe tener mínimo menor que máximo.");
			s.assignments.push({
				id,
				subject: req("subject"),
				teacher: req("teacher"),
				period: req("period"),
				group: d.group,
				min,
				max,
			});
			break;
		}
		case "grade": {
			const a = s.assignments.find((x) => x.id === d.assignment);
			student();
			if (!a || !wasEnrolled(s, d.student, a.group))
				throw Error("El alumno no está inscrito en el grupo de la asignación.");
			const value = Number(req("value"));
			if (!Number.isFinite(value) || value < a.min || value > a.max)
				throw Error(`Calificación fuera de escala (${a.min}–${a.max}).`);
			const old = s.grades.find(
				(x) => x.assignment === a.id && x.student === d.student,
			);
			if (old) {
				old.history.push(entry(`${old.value} → ${value}`));
				old.value = value;
			} else
				s.grades.push({
					id,
					assignment: a.id,
					student: d.student,
					value,
					published: false,
					history: [],
				});
			break;
		}
		case "grade-publish": {
			const x = s.grades.find((x) => x.id === d.id);
			if (!x || x.published)
				throw Error("Selecciona una calificación en borrador.");
			x.published = true;
			break;
		}
		case "grade-publish-batch": {
			const ids = new Set(req("ids").split(",").filter(Boolean));
			const drafts = s.grades.filter((x) => ids.has(x.id) && !x.published);
			if (!ids.size || drafts.length !== ids.size)
				throw Error("Solo se pueden publicar calificaciones en borrador.");
			for (const x of drafts) x.published = true;
			break;
		}
		case "evaluation-rules": {
			const passing = Number(req("passing")),
				riskSubjects = Number(req("riskSubjects"));
			if (!Number.isFinite(passing) || passing < 0)
				throw Error("La calificación aprobatoria debe ser un número positivo.");
			if (!Number.isInteger(riskSubjects) || riskSubjects < 1)
				throw Error("Indica un número entero de materias reprobadas, desde 1.");
			s.evaluationRules = { passing, riskSubjects };
			break;
		}
		case "staff":
			s.staff.push({ id, name: req("name"), role: req("role"), history: [] });
			break;
		case "staff-role": {
			const x = s.staff.find((x) => x.id === d.id);
			if (!x) throw Error("Personal inexistente.");
			x.history.push(entry(req("role")));
			x.role = d.role;
			break;
		}
		default:
			throw Error("Acción desconocida.");
	}
	return s;
}
export function previewCSV(s: State, text: string) {
	const seen = new Set(s.students.map((x) => x.matricula.toUpperCase()));
	return text
		.trim()
		.split(/\r?\n/)
		.slice(1)
		.map((line, i) => {
			const [name = "", matricula = "", group = ""] = line
				.split(",")
				.map((x) => x.trim());
			let error = "";
			if (!name || !matricula || !s.groups.some((g) => g.id === group))
				error = "Nombre, matrícula o ID de grupo inválido";
			else if (seen.has(matricula.toUpperCase())) error = "Matrícula duplicada";
			seen.add(matricula.toUpperCase());
			return { row: i + 2, name, matricula, group, error };
		});
}
