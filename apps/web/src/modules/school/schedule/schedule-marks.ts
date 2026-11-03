import type { DayMarks } from "../../../components/ui/mini-month";
import type { State } from "../shared/workflows";
import type { Slot } from "./schedule-types";

/** Days of the month picker that hold a cancellation, a reschedule or a cover. */
export function dayMarks(s: State, slots: Slot[]): DayMarks {
	const marks: DayMarks = new Map();
	const mark = (date: string, value: "cancel" | "move" | "cover") => {
		if (!marks.has(date)) marks.set(date, new Set());
		marks.get(date)?.add(value);
	};
	for (const slot of slots) {
		const seen = new Map<string, State["scheduleChanges"][number]>();
		for (const change of s.scheduleChanges.filter(
			(c) => c.schedule === slot.id,
		))
			seen.set(change.date, change);
		for (const change of seen.values()) {
			if (change.action === "cancel") mark(change.date, "cancel");
			if (change.action === "move") {
				mark(change.date, "move");
				mark(change.targetDate, "move");
			}
		}
		const covers = new Map<string, State["scheduleStaffing"][number]>();
		for (const record of s.scheduleStaffing.filter(
			(c) => c.schedule === slot.id,
		))
			covers.set(record.date, record);
		for (const record of covers.values())
			if (record.role !== "titular") {
				const moved = seen.get(record.date);
				mark(
					moved?.action === "move" ? moved.targetDate : record.date,
					"cover",
				);
			}
	}
	return marks;
}
