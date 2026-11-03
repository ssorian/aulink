import { describe, expect, test } from "bun:test";
import { filterStudents, students } from "../apps/web/src/modules/school/shared/demo";

describe("student directory filters", () => {
	test("searches accents and student registration without case sensitivity", () => {
		expect(filterStudents(students, "sofia", "Todos")).toHaveLength(1);
		expect(filterStudents(students, "AL-002", "Todos")[0]?.id).toBe("AL-002");
	});
	test("combines group and query; unknown queries return no students", () => {
		expect(
			filterStudents(students, "", "1° A").every((s) => s.group === "1° A"),
		).toBe(true);
		expect(filterStudents(students, "Sofía", "3° A")).toHaveLength(0);
		expect(filterStudents(students, "no existe", "Todos")).toHaveLength(0);
	});
});
