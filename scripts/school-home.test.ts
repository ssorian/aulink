import { describe, expect, test } from "bun:test";
import { summarizeHome } from "../apps/web/src/modules/school/home-summary";
import { initialState } from "../apps/web/src/modules/school/workflows";

describe("inicio operativo DEMO", () => {
	test("cuenta alumnos y grupos sin modificar el estado", () => {
		const s = initialState();
		const before = structuredClone(s);
		expect(summarizeHome(s)).toEqual({
			students: 2, groups: 2, drafts: 0,
			groupsWithoutSubjects: 2, groupsWithoutSchedule: 2,
			activeDevices: 0, inactiveDevices: 0,
		});
		expect(s).toEqual(before);
	});

	test("estado vacío produce solo ceros", () => {
		const s = initialState();
		s.students = [];
		s.groups = [];
		s.links = [];
		s.events = [];
		expect(Object.values(summarizeHome(s))).toEqual([0, 0, 0, 0, 0, 0, 0]);
	});

	test("separa borradores de publicaciones y configuración activa/inactiva", () => {
		const s = initialState();
		const notice = { id: "n1", title: "Demo", text: "Texto", audience: "school", target: "", recipients: [] };
		s.notices = [{ ...notice, published: false }, { ...notice, id: "n2", published: true }];
		s.devices = [
			{ id: "d1", name: "Uno", active: true, reason: "Demo" },
			{ id: "d2", name: "Dos", active: false, reason: "Demo" },
		];
		expect(summarizeHome(s)).toMatchObject({ drafts: 1, activeDevices: 1, inactiveDevices: 1 });
	});

	test("el horario debe pertenecer a una materia del grupo; no duplica grupos", () => {
		const s = initialState();
		const assignment = { id: "a1", subject: "Arte", teacher: "Demo", period: "1", group: "g1", min: 0, max: 10 };
		s.assignments = [assignment, { ...assignment, id: "a2" }];
		s.schedules = [{ id: "h1", assignment: "inexistente", day: "Lunes", start: "08:00", end: "09:00" }];
		expect(summarizeHome(s)).toMatchObject({ groupsWithoutSubjects: 1, groupsWithoutSchedule: 2 });
		s.schedules.push({ ...s.schedules[0], id: "h2", assignment: "a1" });
		expect(summarizeHome(s)).toMatchObject({ groupsWithoutSubjects: 1, groupsWithoutSchedule: 1 });
	});

	test("vínculos revocados o desconocidos y eventos no inventan pendientes", () => {
		const s = initialState();
		const before = summarizeHome(s);
		s.links = ["Revocado", "Restringido", "No verificado"].map((status, i) => ({
			id: `l${i}`, student: "s1", name: "Demo", status, history: [],
		}));
		s.events = [];
		expect(summarizeHome(s)).toEqual(before);
	});
});
