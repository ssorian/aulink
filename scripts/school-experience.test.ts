import { describe, expect, test } from "bun:test";
import { filterDirectory } from "../apps/web/src/modules/school/students/experience";
import { buildMockData } from "../apps/web/src/modules/school/shared/mock-data";

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

