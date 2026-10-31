import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import { Icon } from "../../components/ui/icon";
import "./group-directory.css";
import { useState } from "react";
import { WorkspaceTabs } from "../../components/ui/workspace-tabs";
import { GroupAttendanceTable } from "./group-attendance-table";
import { GroupGradesTable } from "./group-grades-table";
import { ScheduleCalendar } from "./schedule-calendar";
import "./group-tables.css";
import { groupScope, registrationContext } from "./group-context";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import { activeGroup } from "./workflows";

const tabs = ["Alumnos", "Horario", "Asistencia", "Calificaciones"];
export function GroupWorkspace({
	s,
	open,
	groupId,
	onStudent,
	onNotice,
	tab,
	setTab,
}: Pick<ViewProps, "s" | "open"> & {
	groupId: string;
	onStudent: (id: string) => void;
	onNotice: (id: string) => void;
	tab: string;
	setTab: (tab: string) => void;
}) {
	const g = s.groups.find((g) => g.id === groupId);
	if (!g) return null;
	const scoped = groupScope(s, groupId);
	const cycle = s.cycles.find((c) => c.id === g.cycle)?.name;
	const context = `${g.name} · ${cycle}`;
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
			`${title} · ${context}`,
			fields,
			{ ...values, group: groupId },
			[context, ...preview],
			description,
		);
	return (
		<>
			<section className="workspace-heading">
				<div>
					<h2>{g.name}</h2>
					<p>
						{g.grade || "Grado sin configurar"} ·{" "}
						{g.shift || "Turno sin configurar"} · {cycle}
					</p>
				</div>
				<div className="actions">
					<button
						type="button"
						onClick={() =>
							open(
								"group-edit",
								`Editar ${context}`,
								[
									field("name", "Nombre del grupo"),
									field("grade", "Grado"),
									field("shift", "Turno"),
								],
								{
									group: g.id,
									name: g.name,
									grade: g.grade || "",
									shift: g.shift || s.school.shift,
								},
							)
						}
					>
						Editar grupo
					</button>
					<button type="button" onClick={() => onNotice(g.id)}>
						Crear comunicado del grupo
					</button>
				</div>
			</section>
			<WorkspaceTabs
				label="Espacio de grupo"
				items={tabs}
				value={tab}
				onChange={setTab}
			/>
			{tab === "Alumnos" && (
				<section className="group-students" aria-label="Alumnos del grupo">
					<header className="group-students-header">
						<div>
							<h3>Alumnos de este grupo y ciclo</h3>
							<p>
								{scoped.students.length}{" "}
								{scoped.students.length === 1 ? "alumno" : "alumnos"} en {cycle}
							</p>
						</div>
						<div className="actions">
							<button
								className="primary"
								type="button"
								onClick={() =>
									contextualOpen("enroll", "Inscribir alumno existente", [
										options(
											"student",
											"Alumno sin inscripción en este ciclo",
											s.students.filter(
												(x) => !x.enrollments.some((e) => e.cycle === g.cycle),
											),
										),
									])
								}
							>
								Inscribir alumno existente
							</button>
							<button
								type="button"
								onClick={() => {
									const c = registrationContext(s, g.id);
									contextualOpen(
										"student",
										"Registrar alumno en este grupo",
										c.fields,
										c.values,
										c.preview,
									);
								}}
							>
								Registrar nuevo alumno
							</button>
							<button
								type="button"
								onClick={() =>
									contextualOpen(
										"transfer",
										"Cambiar de grupo",
										[
											options(
												"student",
												"Alumno de otro grupo del mismo ciclo",
												s.students.filter(
													(x) =>
														activeGroup(s, x.id, g.cycle) &&
														activeGroup(s, x.id, g.cycle) !== g.id,
												),
											),
											reason,
										],
										{},
										[
											"Traslado al grupo mostrado. No duplica inscripción ni modifica evidencia anterior.",
										],
									)
								}
							>
								Cambiar de grupo
							</button>
						</div>
					</header>
					<DataTable
						caption={`Alumnos de ${context}`}
						variant="card"
						scrollLabel="Alumnos del grupo, desplazamiento horizontal"
					>
						<thead>
							<tr>
								<th scope="col">Alumno</th>
								<th scope="col">Matrícula</th>
								<th scope="col">Inscripción</th>
								<th scope="col">Expediente</th>
							</tr>
						</thead>
						<tbody>
							{scoped.students.map((x) => (
								<tr key={x.id}>
									<th scope="row">{x.name}</th>
									<td>{x.matricula}</td>
									<td>
										{activeGroup(s, x.id, g.cycle) === g.id
											? "Inscripción activa en este grupo"
											: "Histórico · trasladado a otro grupo del ciclo"}
									</td>
									<td>
										<button
											id={`group-${groupId}-student-${x.id}`}
											type="button"
											className="group-open"
											aria-label={`Abrir expediente de ${x.name}`}
											onClick={() => onStudent(x.id)}
										>
											Abrir expediente
										</button>
									</td>
								</tr>
							))}
							{!scoped.students.length && (
								<EmptyTableRow columns={4}>
									Sin alumnos. Inscribe un registro existente o registra uno
									nuevo en este grupo.
								</EmptyTableRow>
							)}
						</tbody>
					</DataTable>
				</section>
			)}
			{tab === "Horario" && (
				<ScheduleCalendar s={s} groupId={groupId} open={contextualOpen} />
			)}
			{tab === "Asistencia" && (
				<GroupAttendanceTable
					key={groupId}
					s={s}
					groupId={groupId}
					open={contextualOpen}
				/>
			)}
			{tab === "Calificaciones" && (
				<GroupGradesTable
					key={groupId}
					s={s}
					groupId={groupId}
					open={contextualOpen}
				/>
			)}
		</>
	);
}
export function GroupDirectory({
	s,
	open,
	onSelect,
}: Pick<ViewProps, "s" | "open"> & { onSelect: (id: string) => void }) {
	const [cycle, setCycle] = useState("");
	const [grade, setGrade] = useState("");
	const [shift, setShift] = useState("");
	const list = s.groups.filter(
		(g) =>
			(!cycle || g.cycle === cycle) &&
			(!grade || g.grade === grade) &&
			(!shift || g.shift === shift),
	);
	return (
		<section className="group-directory" aria-label="Grupos de la escuela">
			<header className="group-directory-header">
				<div>
					<h2>Grupos de la escuela</h2>
					<p>
						{list.length} {list.length === 1 ? "grupo" : "grupos"} · Alumnos con
						inscripción activa en cada ciclo
					</p>
				</div>
				<button
					className="primary"
					type="button"
					onClick={() =>
						open(
							"group",
							"Crear grupo",
							[
								field("name", "Nombre del grupo"),
								options("cycle", "Ciclo", s.cycles),
								field("grade", "Grado"),
								field("shift", "Turno"),
							],
							{ cycle, shift: s.school.shift },
						)
					}
				>
					<Icon name="plus" size={18} />
					Crear grupo
				</button>
			</header>
			<div className="group-filters">
				<label>
					Ciclo
					<select value={cycle} onChange={(e) => setCycle(e.target.value)}>
						<option value="">Todos</option>
						{s.cycles.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Grado
					<select value={grade} onChange={(e) => setGrade(e.target.value)}>
						<option value="">Todos</option>
						{[...new Set(s.groups.map((g) => g.grade).filter(Boolean))].map(
							(x) => (
								<option key={x}>{x}</option>
							),
						)}
					</select>
				</label>
				<label>
					Turno
					<select value={shift} onChange={(e) => setShift(e.target.value)}>
						<option value="">Todos</option>
						{[...new Set(s.groups.map((g) => g.shift).filter(Boolean))].map(
							(x) => (
								<option key={x}>{x}</option>
							),
						)}
					</select>
				</label>
			</div>
			<DataTable caption="Directorio de grupos" variant="card">
				<thead>
					<tr>
						<th scope="col">Grupo</th>
						<th scope="col">Ciclo</th>
						<th scope="col">Grado</th>
						<th scope="col">Turno</th>
						<th scope="col">Alumnos activos</th>
						<th scope="col">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{list.map((g) => (
						<tr key={g.id}>
							<th scope="row">{g.name}</th>
							<td>
								{s.cycles.find((c) => c.id === g.cycle)?.name ||
									"Ciclo no definido"}
							</td>
							<td>{g.grade || "Grado no definido"}</td>
							<td>{g.shift || "Turno no definido"}</td>
							<td>
								{
									s.students.filter(
										(student) => activeGroup(s, student.id, g.cycle) === g.id,
									).length
								}
							</td>
							<td>
								<button
									type="button"
									className="group-open"
									aria-label={`Abrir grupo ${g.name}`}
									onClick={() => onSelect(g.id)}
								>
									Abrir grupo
								</button>
							</td>
						</tr>
					))}
					{!list.length && (
						<EmptyTableRow columns={6}>
							No hay grupos para estos filtros.
						</EmptyTableRow>
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
