// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import {
	type AttendanceDay,
	type AttendanceRules,
	summarizeAttendance,
} from "./attendance-record";

const rules: AttendanceRules = { minimumPercent: 80, latesPerAbsence: 3 };

const day = (
	date: string,
	entered: boolean,
	marks: Record<string, AttendanceDay["classes"][number]["mark"]>,
): AttendanceDay => ({
	date,
	entered,
	classes: Object.entries(marks).map(([subject, mark]) => ({ subject, mark })),
});

test("general percent counts days with a campus entry over school days", () => {
	const days = [
		day("2026-10-19", true, { Ciencias: "Falta" }),
		day("2026-10-20", false, { Ciencias: "Falta" }),
		day("2026-10-21", true, { Ciencias: "Presente" }),
		day("2026-10-22", true, { Ciencias: "Presente" }),
	];
	const { general } = summarizeAttendance(days, new Map(), rules);
	expect(general).toEqual({ attended: 3, total: 4, percent: 75 });
});

test("subject percent counts sessions attended over sessions given", () => {
	const days = [
		day("2026-10-19", true, { Ciencias: "Falta", Historia: "Presente" }),
		day("2026-10-20", true, { Ciencias: "Presente", Historia: "Presente" }),
	];
	const { subjects } = summarizeAttendance(days, new Map(), rules);
	expect(
		subjects.map((s) => [s.subject, s.attended, s.total, s.percent]),
	).toEqual([
		["Ciencias", 1, 2, 50],
		["Historia", 2, 2, 100],
	]);
});

test("a class without roll call counts as attended", () => {
	const days = [day("2026-10-19", true, { Inglés: "Sin pase de lista" })];
	const [inglés] = summarizeAttendance(days, new Map(), rules).subjects;
	expect([inglés.attended, inglés.total, inglés.absences]).toEqual([1, 1, 0]);
});

test("every N lates count as one absence", () => {
	const lates = ["19", "20", "21", "22"].map((d) =>
		day(`2026-10-${d}`, true, { Lengua: "Retardo" }),
	);
	const [lengua] = summarizeAttendance(lates, new Map(), rules).subjects;
	expect([lengua.lates, lengua.attended, lengua.total]).toEqual([4, 3, 4]);
	expect(lengua.percent).toBe(75);
});

test("subjects under the minimum are at risk of extraordinario", () => {
	const days = [
		day("2026-10-19", true, { Artes: "Falta" }),
		...["20", "21", "22", "23"].map((d) =>
			day(`2026-10-${d}`, true, { Artes: "Presente" }),
		),
	];
	const at = (n: number) =>
		summarizeAttendance(days.slice(0, n), new Map(), rules).subjects[0];
	expect(at(5)).toMatchObject({ percent: 80, atRisk: false });
	expect(at(4)).toMatchObject({ percent: 75, atRisk: true });
});

test("percent never rounds a failing value up to the minimum", () => {
	const days = Array.from({ length: 49 }, (_, i) =>
		day(`d${i}`, true, { Artes: i < 10 ? "Falta" : "Presente" }),
	);
	const [artes] = summarizeAttendance(days, new Map(), rules).subjects;
	expect(artes.percent).toBe(79);
	expect(artes.atRisk).toBe(true);
});

test("pending lists each day with unjustified absences, merging its classes", () => {
	const days = [
		day("2026-10-19", true, {
			Ciencias: "Falta",
			Historia: "Falta",
			Inglés: "Presente",
		}),
		day("2026-10-20", false, { Ciencias: "Falta", Historia: "Falta" }),
		day("2026-10-21", true, { Ciencias: "Retardo" }),
	];
	const { pending } = summarizeAttendance(days, new Map(), rules);
	expect(pending).toEqual([
		{ date: "2026-10-20", wholeDay: true, subjects: ["Ciencias", "Historia"] },
		{ date: "2026-10-19", wholeDay: false, subjects: ["Ciencias", "Historia"] },
	]);
});

test("a double period missed lists its subject once", () => {
	const days: AttendanceDay[] = [
		{
			date: "2026-10-22",
			entered: true,
			classes: [
				{ subject: "Lengua", mark: "Falta" },
				{ subject: "Lengua", mark: "Falta" },
			],
		},
	];
	const { pending, subjects } = summarizeAttendance(days, new Map(), rules);
	expect(pending[0].subjects).toEqual(["Lengua"]);
	expect(subjects[0]).toMatchObject({ total: 2, absences: 2 });
});

test("a justified day leaves pending and counts as attended everywhere", () => {
	const days = [
		day("2026-10-19", false, { Ciencias: "Falta" }),
		day("2026-10-20", true, { Ciencias: "Presente" }),
	];
	const justified = new Map([["2026-10-19", "Cita médica"]]);
	const summary = summarizeAttendance(days, justified, rules);
	expect(summary.pending).toEqual([]);
	expect(summary.general.percent).toBe(100);
	expect(summary.subjects[0]).toMatchObject({ attended: 2, absences: 0 });
	expect(summary.justified).toEqual([
		{
			date: "2026-10-19",
			wholeDay: true,
			subjects: ["Ciencias"],
			reason: "Cita médica",
		},
	]);
});

test("no school days yet gives no percent instead of zero", () => {
	const summary = summarizeAttendance([], new Map(), rules);
	expect(summary.general).toEqual({ attended: 0, total: 0, percent: null });
	expect(summary.subjects).toEqual([]);
});
