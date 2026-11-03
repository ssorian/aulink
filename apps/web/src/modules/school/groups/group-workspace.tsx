import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Icon } from "../../../components/ui/icon";
import { WorkspaceTabs } from "../../../components/ui/workspace-tabs";
import { GroupGradesTable } from "../grades/group-grades-table";
import { ScheduleCalendar } from "../schedule/schedule-calendar";
import { field, options, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { activeGroup } from "../shared/workflows";
import { GroupAttendanceTable } from "./group-attendance-table";
import { groupScope, registrationContext } from "./group-context";
import { tableCells } from "./group-table-ui";

/** Directory and student tables: auto layout, 800px minimum so columns stay readable. */
const listTable = `${tableCells} [&_table]:min-w-[800px] [&_th:last-child]:w-px`;
const heading = "m-0 mb-1 text-xl font-semibold tracking-tight";
const subheading = "m-0 text-[13px] tabular-nums text-muted-foreground";
const sectionHeader =
	"mb-5 flex flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch";
const tabs = ["Alumnos", "Horario", "Asistencia", "Calificaciones"];
export function GroupWorkspace({
	s,
	open,
	run,
	groupId,
	onStudent,
	onNotice,
	tab,
	setTab,
}: Pick<ViewProps, "s" | "open"> & {
	/** Applies and persists a command at once; throws with a user-facing message. */
	run?: (kind: string, data: Record<string, string>) => void;
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
			<section
				data-slot="workspace-heading"
				className="my-6 flex items-center justify-between gap-5 max-md:flex-col max-md:items-start max-md:gap-3.5"
			>
				<div>
					<h2 className="m-0 text-[28px] leading-normal max-md:text-2xl">
						{g.name}
					</h2>
					<p className="text-sm leading-[1.7] text-muted-foreground">
						{g.grade || "Grado sin configurar"} ·{" "}
						{g.shift || "Turno sin configurar"} · {cycle}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
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
					</Button>
					<Button onClick={() => onNotice(g.id)}>
						Crear comunicado del grupo
					</Button>
				</div>
			</section>
			<WorkspaceTabs
				label="Espacio de grupo"
				items={tabs}
				value={tab}
				onChange={setTab}
			/>
			{tab === "Alumnos" && (
				<section
					data-slot="group-students"
					aria-label="Alumnos del grupo"
					className="mt-6 max-w-full min-w-0"
				>
					<header className={sectionHeader}>
						<div>
							<h3 className={heading}>Alumnos de este grupo y ciclo</h3>
							<p className={subheading}>
								{scoped.students.length}{" "}
								{scoped.students.length === 1 ? "alumno" : "alumnos"} en {cycle}
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="primary"
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
							</Button>
							<Button
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
							</Button>
							<Button
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
							</Button>
						</div>
					</header>
					<DataTable
						caption={`Alumnos de ${context}`}
						variant="card"
						scrollLabel="Alumnos del grupo, desplazamiento horizontal"
						scrollClassName={listTable}
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
										<Button
											id={`group-${groupId}-student-${x.id}`}
											variant="ghost"
											size="sm"
											className="whitespace-nowrap"
											aria-label={`Abrir expediente de ${x.name}`}
											onClick={() => onStudent(x.id)}
										>
											Abrir expediente
										</Button>
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
				<ScheduleCalendar
					s={s}
					groupId={groupId}
					open={contextualOpen}
					run={run}
				/>
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
const distinct = (values: (string | undefined)[]) =>
	[...new Set(values.filter(Boolean) as string[])].map((value) => ({
		value,
		label: value,
	}));
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
		<section
			data-slot="group-directory"
			aria-label="Grupos de la escuela"
			className="max-w-full min-w-0"
		>
			<header className={sectionHeader}>
				<div>
					<h2 className={heading}>Grupos de la escuela</h2>
					<p className={subheading}>
						{list.length} {list.length === 1 ? "grupo" : "grupos"} · Alumnos con
						inscripción activa en cada ciclo
					</p>
				</div>
				<Button
					variant="primary"
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
				</Button>
			</header>
			<FilterBar
				label="Filtros de grupos"
				className="mt-0 mb-4 border-b border-border pb-5 max-md:flex-col"
			>
				<Select
					id="group-filter-cycle"
					label="Ciclo"
					value={cycle}
					all="Todos"
					items={s.cycles.map((c) => ({ value: c.id, label: c.name }))}
					onChange={setCycle}
					className="md:flex-[2_1_280px]"
				/>
				<Select
					id="group-filter-grade"
					label="Grado"
					value={grade}
					all="Todos"
					items={distinct(s.groups.map((g) => g.grade))}
					onChange={setGrade}
				/>
				<Select
					id="group-filter-shift"
					label="Turno"
					value={shift}
					all="Todos"
					items={distinct(s.groups.map((g) => g.shift))}
					onChange={setShift}
				/>
			</FilterBar>
			<DataTable
				caption="Directorio de grupos"
				variant="card"
				scrollClassName={listTable}
			>
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
								<Button
									variant="ghost"
									size="sm"
									className="whitespace-nowrap"
									aria-label={`Abrir grupo ${g.name}`}
									onClick={() => onSelect(g.id)}
								>
									Abrir grupo
								</Button>
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
