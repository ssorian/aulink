import { type State, wasEnrolled } from "../shared/workflows";

/** Lower and upper secondary both last three school years. */
const PLAN_YEARS = 3;

export function cycleStartYear(s: State, cycle: string) {
	const c = s.cycles.find((x) => x.id === cycle);
	const year = (c?.startDate || c?.name || "").match(/\d{4}/)?.[0];
	return year ? Number(year) : undefined;
}

/** Completed school years before this grade: "2°" → 1, "3° semestre" → 1. */
function elapsedYears(grade = "") {
	const n = Number(grade.match(/^\s*(\d+)/)?.[1]);
	if (!n) return undefined;
	return (/semestre/i.test(grade) ? Math.ceil(n / 2) : n) - 1;
}

/** Grade, group letter and generation (entry year to expected exit year) in one cycle. */
export function studentPlacement(
	s: State,
	student: Pick<State["students"][number], "id" | "enrollments">,
	cycle: string,
) {
	const shown =
		cycle ||
		[...student.enrollments]
			.sort(
				(a, b) =>
					(cycleStartYear(s, a.cycle) ?? 0) - (cycleStartYear(s, b.cycle) ?? 0),
			)
			.at(-1)?.cycle;
	// Same rule as activeGroup: the latest transfer wins over the enrollment.
	const groupOf = (c: string) => {
		const id =
			s.transfers
				.filter((t) => t.student === student.id && t.cycle === c)
				.at(-1)?.to || student.enrollments.find((e) => e.cycle === c)?.group;
		return s.groups.find((g) => g.id === id);
	};
	const group = shown ? groupOf(shown) : undefined;
	const entries = student.enrollments.flatMap((e) => {
		const start = cycleStartYear(s, e.cycle);
		const elapsed = elapsedYears(groupOf(e.cycle)?.grade);
		return start === undefined || elapsed === undefined
			? []
			: [start - elapsed];
	});
	const entry = entries.length ? Math.min(...entries) : undefined;
	const name = group?.name ?? "Sin grupo";
	const prefix = group?.grade?.toLowerCase();
	return {
		grade: group?.grade || "—",
		group:
			(prefix && name.toLowerCase().startsWith(prefix)
				? name.slice(prefix.length).trim()
				: "") || name,
		generation: entry === undefined ? "—" : `${entry}–${entry + PLAN_YEARS}`,
	};
}

export function filterDirectory(
	s: State,
	query: string,
	group: string,
	cycle: string,
) {
	const normalize = (text: string) =>
		text
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase();
	const search = normalize(query.trim());
	return s.students.filter(
		(student) =>
			normalize(`${student.name} ${student.matricula}`).includes(search) &&
			(!group || wasEnrolled(s, student.id, group)) &&
			(!cycle || student.enrollments.some((e) => e.cycle === cycle)) &&
			(!group ||
				!cycle ||
				s.groups.some((g) => g.id === group && g.cycle === cycle)),
	);
}
