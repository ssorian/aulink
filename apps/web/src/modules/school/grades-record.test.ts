// @ts-expect-error Bun test types are not part of the browser build.
import { expect, test } from "bun:test";
import { average, periodRows, periodState, situation } from "./grades-record";

test("period boundaries include both start and end", () => {
	const period = { start: "2026-10-05", end: "2026-11-13" };
	expect(periodState(period, "2026-10-04")).toBe("upcoming");
	expect(periodState(period, "2026-10-05")).toBe("open");
	expect(periodState(period, "2026-11-13")).toBe("open");
	expect(periodState(period, "2026-11-14")).toBe("closed");
});
test("missing grades stay absent, and averages use captured periods only", () => {
	expect(
		periodRows([{ subject: "Arte", values: {} }], "Primer trimestre")[0].value,
	).toBeNull();
	expect(average([null, undefined])).toBeNull();
	expect(average([8, null, 9.1])).toBe(8.6);
	expect(average([0, 8, null])).toBe(4);
});
test("passing boundary is inclusive", () => {
	expect(situation(6, 6)).toBe("Aprueba");
	expect(situation(5.9, 6)).toBe("Reprueba");
	expect(situation(null, 6)).toBeNull();
});
