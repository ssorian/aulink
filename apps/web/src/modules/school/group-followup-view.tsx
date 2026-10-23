import { ConductView } from "./conduct-view";
import { GroupAttendanceTable } from "./group-attendance-table";
import { groupScope } from "./group-context";
import { GroupGradesTable } from "./group-grades-table";
import { Empty, options } from "./view-helpers";
import type { ViewProps } from "./view-types";

export function GroupFollowupView({
	s,
	open,
	mode,
	groupId,
	onGroup,
}: Pick<ViewProps, "s" | "open"> & {
	mode: "Calificaciones" | "Asistencia" | "Conducta";
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
			<section className="panel scope-selector" aria-label="Grupo de consulta">
				<label htmlFor="followup-group">
					Grupo y ciclo
					<select
						id="followup-group"
						value={groupId}
						onChange={(event) => onGroup(event.target.value)}
					>
						<option value="">Selecciona un grupo</option>
						{s.groups.map((g) => (
							<option key={g.id} value={g.id}>
								{g.name} · {s.cycles.find((c) => c.id === g.cycle)?.name}
							</option>
						))}
					</select>
				</label>
			</section>
			{!group ? (
				<Empty
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
			) : mode === "Asistencia" ? (
				<GroupAttendanceTable
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
