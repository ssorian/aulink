import { EmptyState } from "../../../components/ui/empty-state";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { ConductView } from "../conduct/conduct-view";
import { GroupGradesTable } from "../grades/group-grades-table";
import { options } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { groupScope } from "./group-context";

export function GroupFollowupView({
	s,
	open,
	mode,
	groupId,
	onGroup,
}: Pick<ViewProps, "s" | "open"> & {
	mode: "Calificaciones" | "Conducta";
	groupId: string;
	onGroup: (id: string) => void;
}) {
	const group = s.groups.find((g) => g.id === groupId);
	const cycle = s.cycles.find((c) => c.id === group?.cycle);
	const scoped = groupScope(s, groupId);
	const contextualOpen: ViewProps["open"] = (
		kind,
		title,
		fields,
		values = {},
		preview = [],
		description,
	) =>
		open(
			kind,
			`${title} · ${group?.name} · ${cycle?.name}`,
			fields,
			{ ...values, group: groupId },
			[`${group?.name} · ${cycle?.name}`, ...preview],
			description,
		);
	return (
		<>
			<FilterBar label="Grupo a consultar" className="mt-2 mb-5 max-w-[420px]">
				<Select
					id="followup-group"
					label="Grupo"
					value={groupId}
					all="Selecciona un grupo"
					items={s.groups.map((g) => ({
						value: g.id,
						label: `${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
					}))}
					onChange={onGroup}
				/>
			</FilterBar>
			{!group ? (
				<EmptyState
					title={
						s.groups.length ? "Sin grupo seleccionado" : "Aún no hay grupos"
					}
					text={
						s.groups.length
							? "Selecciona un grupo para consultar sus registros."
							: "Crea un grupo en Gestión académica para comenzar."
					}
				/>
			) : mode === "Calificaciones" ? (
				<GroupGradesTable
					key={groupId}
					s={s}
					open={contextualOpen}
					groupId={groupId}
				/>
			) : (
				<ConductView
					s={scoped}
					open={contextualOpen}
					students={options("student", "Alumno del grupo", scoped.students)}
					studentName={(id) => s.students.find((x) => x.id === id)?.name || id}
				/>
			)}
		</>
	);
}
