import { buildMockData } from "./mock-data";
import { initialState, type State } from "./workflows";

// Object key order can differ after schema restoration; array order is historical.
function equal(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
	if (Array.isArray(a) || Array.isArray(b))
		return (
			Array.isArray(a) &&
			Array.isArray(b) &&
			a.length === b.length &&
			a.every((v, i) => equal(v, b[i]))
		);
	const left = a as Record<string, unknown>;
	const right = b as Record<string, unknown>;
	return (
		Object.keys(left).length === Object.keys(right).length &&
		Object.keys(left).every(
			(key) => Object.hasOwn(right, key) && equal(left[key], right[key]),
		)
	);
}

/** Upgrade only exact known seed records. Edited rows, histories and snapshots are opaque. */
export function migrateLegacySeed(existing: State): {
	state: State;
	changed: boolean;
} {
	const state = structuredClone(existing);
	let changed = false;
	const seeds = [
		[initialState(true), initialState()],
		[buildMockData(true), buildMockData()],
	];
	for (const [old, next] of seeds) {
		if (equal(state.school, old.school) && !equal(state.school, next.school)) {
			state.school = structuredClone(next.school);
			changed = true;
		}
		for (const key of Object.keys(old) as (keyof State)[]) {
			const current = state[key];
			const prior = old[key];
			const replacement = next[key];
			if (
				!Array.isArray(current) ||
				!Array.isArray(prior) ||
				!Array.isArray(replacement)
			)
				continue;
			const rows = current.map((row) => {
				if (!("id" in row)) return row;
				const original = prior.find(
					(item) => "id" in item && item.id === row.id,
				);
				const updated = replacement.find(
					(item) => "id" in item && item.id === row.id,
				);
				if (
					!original ||
					!updated ||
					!equal(row, original) ||
					equal(row, updated)
				)
					return row;
				if (
					key === "students" &&
					"matricula" in updated &&
					state.students.some(
						(student) =>
							student.id !== row.id &&
							student.matricula.trim().toUpperCase() ===
								String(updated.matricula).trim().toUpperCase(),
					)
				)
					return row;
				if (
					key === "cycles" &&
					"name" in updated &&
					state.cycles.some(
						(cycle) =>
							cycle.id !== row.id &&
							cycle.name.trim().toLowerCase() ===
								String(updated.name).trim().toLowerCase(),
					)
				)
					return row;
				if (
					key === "groups" &&
					"name" in updated &&
					"cycle" in updated &&
					state.groups.some(
						(group) =>
							group.id !== row.id &&
							group.cycle === updated.cycle &&
							group.name.trim().toLowerCase() ===
								String(updated.name).trim().toLowerCase(),
					)
				)
					return row;
				changed = true;
				return structuredClone(updated);
			});
			Object.assign(state, { [key]: rows });
		}
	}
	return { state: changed ? state : existing, changed };
}
