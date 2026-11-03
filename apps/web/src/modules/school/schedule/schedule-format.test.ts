// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { hm, isoWeek, longDate, shortDate, weekTitle } from "./schedule-format";

test("week and date labels follow es-MX conventions", () => {
	expect(shortDate("2026-11-02")).toBe("lun 2 de nov");
	expect(longDate("2026-11-02")).toBe("lunes, 2 de noviembre");
	expect(weekTitle("2026-11-02", "2026-11-08")).toBe("2 – 8 nov 2026");
	expect(weekTitle("2026-10-26", "2026-11-01")).toBe("26 oct – 1 nov 2026");
	expect(isoWeek("2026-11-02")).toBe(45);
	expect(hm("07:30")).toBe("7:30");
	expect(hm("13:00")).toBe("13:00");
});
