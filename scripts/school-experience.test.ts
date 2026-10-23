import { describe, expect, test } from "bun:test";
import { filterDirectory, summarizeAttendance } from "../apps/web/src/modules/school/experience";
import { buildMockData } from "../apps/web/src/modules/school/mock-data";

describe("directory context", () => {
	test("combines accent-insensitive search, group and cycle", () => {
		const s = buildMockData();
		const student = s.students[0]!;
		const enrollment = student.enrollments[0]!;
		expect(filterDirectory(s, student.matricula.toLowerCase(), enrollment.group, enrollment.cycle).map(x => x.id)).toContain(student.id);
		expect(filterDirectory(s, "inexistente", "", "")).toEqual([]);
		expect(filterDirectory(s, "", enrollment.group, "otro-ciclo")).toEqual([]);
	});
	test("empty filters include every student without duplicating history", () => {
		const s = buildMockData();
		expect(filterDirectory(s, "", "", "")).toEqual(s.students);
	});
});

describe("attendance evidence summary", () => {
	test("counts adjusted events once even with several adjustments", () => {
		const events = [{ id: "a" }, { id: "b" }];
		const adjustments = [{ event: "a" }, { event: "a" }, { event: "outside" }];
		expect(summarizeAttendance(events, adjustments)).toEqual({ events: 2, adjusted: 1, unchanged: 1 });
	});
	test("no evidence does not become an absence or definitive attendance", () => {
		expect(summarizeAttendance([], [{ event: "outside" }])).toEqual({ events: 0, adjusted: 0, unchanged: 0 });
	});
});
