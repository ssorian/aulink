import { expect, test } from "bun:test";
import {
	apply,
	initialState,
	restore,
	type State,
} from "../apps/web/src/modules/school/workflows";
import {
	dayWindow,
	occurrences,
	schoolToday,
	validDate,
} from "../apps/web/src/modules/school/schedule-helpers";
const run = (s: State, kind: string, data: Record<string, string>) =>
	apply(s, { kind, data });
function fixture() {
	let s = run(initialState(), "assignment", {
		group: "g1",
		subject: "Arte",
		teacher: "Docente",
		period: "P1",
		min: "0",
		max: "10",
	});
	for (const [start, end] of [
		["08:00", "09:00"],
		["09:00", "10:00"],
		["10:00", "11:00"],
	])
		s = run(s, "schedule", {
			assignment: s.assignments[0].id,
			day: "Lunes",
			start,
			end,
		});
	return run(s, "schedule-window", { group: "g1", before: "10", after: "20" });
}
const change = (
	s: State,
	index: number,
	action: string,
	extra: Record<string, string> = {},
) =>
	run(s, "schedule-occurrence", {
		schedule: s.schedules[index].id,
		date: "2026-08-03",
		action,
		reason: "Prueba",
		...extra,
	});
test("last, middle, all cancellations and immutable source", () => {
	const s = fixture();
	const middle = change(s, 1, "cancel");
	expect(dayWindow(middle, "g1", "2026-08-03")?.end).toBe("11:20");
	const last = change(s, 2, "cancel");
	expect(dayWindow(last, "g1", "2026-08-03")).toEqual({
		last: "10:00",
		start: "09:50",
		end: "10:20",
	});
	expect(dayWindow(last, "g1", "2026-08-10")?.last).toBe("11:00");
	expect(
		dayWindow(
			change(change(last, 0, "cancel"), 1, "cancel"),
			"g1",
			"2026-08-03",
		),
	).toBeNull();
	expect(last.schedules).toEqual(s.schedules);
	expect(last.events).toEqual(s.events);
});
test("reschedule recalculates both dates, restore and history survive persistence", () => {
	const s = fixture();
	const moved = change(s, 2, "move", {
		targetDate: "2026-08-04",
		start: "12:00",
		end: "13:00",
	});
	expect(dayWindow(moved, "g1", "2026-08-03")?.last).toBe("10:00");
	expect(dayWindow(moved, "g1", "2026-08-04")?.last).toBe("13:00");
	expect(
		occurrences(moved, "g1", "2026-08-03").find(
			(x) => x.schedule === s.schedules[2].id,
		)?.status,
	).toBe("move");
	const restored = change(restore(JSON.stringify(moved))!, 2, "restore");
	expect(dayWindow(restored, "g1", "2026-08-03")?.last).toBe("11:00");
	expect(dayWindow(restored, "g1", "2026-08-04")).toBeNull();
	expect(restored.scheduleChanges).toHaveLength(2);
});
test("conflicts with series and moved occurrences including restore", () => {
	const s = fixture();
	expect(() =>
		change(s, 2, "move", {
			targetDate: "2026-08-03",
			start: "08:30",
			end: "09:30",
		}),
	).toThrow(/superpone/);
	const moved = change(s, 2, "move", {
		targetDate: "2026-08-04",
		start: "12:00",
		end: "13:00",
	});
	expect(() =>
		change(moved, 1, "move", {
			targetDate: "2026-08-04",
			start: "12:30",
			end: "13:30",
		}),
	).toThrow(/superpone/);
	expect(() =>
		run(moved, "schedule", {
			assignment: s.assignments[0].id,
			day: "Martes",
			start: "12:30",
			end: "13:30",
		}),
	).toThrow(/superpone/);
	const cancelled = change(s, 2, "cancel");
	const filled = change(cancelled, 1, "move", {
		targetDate: "2026-08-03",
		start: "10:00",
		end: "11:00",
	});
	expect(() => change(filled, 2, "restore")).toThrow(/superpone/);
});
test("non-school days and empty days have no window; legacy defaults", () => {
	const s = fixture();
	s.exceptions.push({ id: "holiday", date: "2026-08-03", reason: "Inhábil" });
	expect(dayWindow(s, "g1", "2026-08-03")).toBeNull();
	expect(dayWindow(s, "g1", "2026-08-05")).toBeNull();
	expect(() =>
		change(s, 2, "move", {
			targetDate: "2026-08-03",
			start: "12:00",
			end: "13:00",
		}),
	).toThrow();
	const legacy = JSON.parse(JSON.stringify(initialState()));
	delete legacy.scheduleChanges;
	delete legacy.scheduleWindows;
	expect(restore(JSON.stringify(legacy))?.scheduleChanges).toEqual([]);
	expect(restore(JSON.stringify(legacy))?.scheduleWindows).toEqual([]);
});
test("same-day move, edit recurrence, group isolation and persisted temporal validation", () => {
	const s = fixture();
	const moved = change(s, 2, "move", {
		targetDate: "2026-08-03",
		start: "12:00",
		end: "13:00",
	});
	expect(dayWindow(moved, "g1", "2026-08-03")?.last).toBe("13:00");
	expect(dayWindow(moved, "g2", "2026-08-03")).toBeNull();
	const edited = run(s, "schedule", {
		id: s.schedules[2].id,
		assignment: s.assignments[0].id,
		day: "Lunes",
		start: "11:00",
		end: "12:00",
	});
	expect(edited.schedules).toHaveLength(3);
	expect(dayWindow(edited, "g1", "2026-08-03")?.last).toBe("12:00");
	expect(() =>
		run(moved, "schedule", {
			id: s.schedules[2].id,
			assignment: s.assignments[0].id,
			day: "Martes",
			start: "11:00",
			end: "12:00",
		}),
	).toThrow(/historial/);
	const corrupt = JSON.parse(JSON.stringify(moved));
	corrupt.scheduleChanges[0].targetDate = "2026-02-30";
	expect(restore(JSON.stringify(corrupt))).toBeNull();
	corrupt.scheduleChanges[0].targetDate = "2026-08-03";
	corrupt.scheduleChanges[0].start = "25:00";
	expect(restore(JSON.stringify(corrupt))).toBeNull();
});
test("strict dates, time, weekdays, reasons, midnight and integer minutes", () => {
	const s = fixture();
	for (const date of ["2026-02-30", "2025-02-29", "2026-8-03"])
		expect(validDate(date)).toBe(false);
	expect(validDate("2024-02-29")).toBe(true);
	for (const extra of [
		{ date: "2026-02-30" },
		{ date: "2026-08-04" },
		{ reason: "" },
	])
		expect(() => change(s, 0, "cancel", extra)).toThrow();
	for (const before of ["-1", "1.5", "121", ""])
		expect(() =>
			run(s, "schedule-window", { group: "g1", before, after: "10" }),
		).toThrow();
	for (const data of [
		{ day: "Monday", start: "08:00", end: "09:00" },
		{ day: "Lunes", start: "25:00", end: "26:00" },
		{ day: "Lunes", start: "23:00", end: "01:00" },
	])
		expect(() =>
			run(s, "schedule", { assignment: s.assignments[0].id, ...data }),
		).toThrow();
	expect(() =>
		change(s, 2, "move", {
			targetDate: "2026-08-04",
			start: "23:00",
			end: "23:50",
		}),
	).toThrow(/medianoche/);
	expect(
		schoolToday("America/Mexico_City", new Date("2026-08-04T02:00:00Z")),
	).toBe("2026-08-03");
});
