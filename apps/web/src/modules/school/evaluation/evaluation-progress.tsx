import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import {
	buildPeriodProgress,
	groupProgress,
	type PeriodFilters,
	type ProgressCounts,
} from "./evaluation-operations";
import { enrolledStudents } from "../groups/group-context";
import { attendanceStatus, gradeAverage } from "../groups/group-table-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import "../shared/group-tables.css";
import "../schedule/schedule-calendar.css";

type Filter = "period" | "groupId" | "subject" | "grade";
const legend = [
	["published", "Publicado"],
	["draft", "Borrador"],
	["missing", "Sin captura"],
] as const;
const number = (value: number) =>
	value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
const initials = (name: string) =>
	name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

function Meter({ counts }: { counts: ProgressCounts }) {
	return (
		<div className="evaluation-stack progress-stack" aria-hidden="true">
			{(["published", "draft", "missing"] as const).map((key) => (
				<span
					key={key}
					data-state={key}
					style={{
						width: `${counts.expected ? (counts[key] / counts.expected) * 100 : 0}%`,
					}}
				/>
			))}
		</div>
	);
}

export function Select({
	id,
	label,
	value,
	all,
	items,
	onChange,
}: {
	id: string;
	label: string;
	value: string;
	all?: string;
	items: { value: string; label: string }[];
	onChange: (value: string) => void;
}) {
	return (
		<label htmlFor={id} className="progress-filter">
			<span>{label}</span>
			<select
				id={id}
				value={value}
				disabled={!items.length}
				onChange={(e) => onChange(e.target.value)}
			>
				{all !== undefined && <option value="">{all}</option>}
				{!items.length && all === undefined && (
					<option value="">Sin opciones</option>
				)}
				{items.map((item) => (
					<option key={item.value} value={item.value}>
						{item.label}
					</option>
				))}
			</select>
		</label>
	);
}

/** Campus entries over the cycle: never merged with class attendance, and no record is not an absence. */
function campusAccess(
	s: State,
	cycleId: string,
	groupId: string,
	student: string,
) {
	const excluded = new Set(s.exceptions.map((e) => e.date));
	const byDay = new Map<string, State["events"]>();
	for (const event of s.events)
		if (
			event.student === student &&
			(!event.cycle || event.cycle === cycleId) &&
			(!event.group || event.group === groupId) &&
			!excluded.has(event.date)
		)
			byDay.set(event.date, [...(byDay.get(event.date) || []), event]);
	let present = 0;
	let absent = 0;
	let review = 0;
	for (const events of byDay.values()) {
		const status = attendanceStatus(events);
		if (status === "Entrada y salida" || status === "Entrada sin salida")
			present++;
		else if (status === "Inasistencia explícita") absent++;
		else review++;
	}
	const confirmed = present + absent;
	return {
		present,
		absent,
		review,
		percent: confirmed ? Math.floor((present * 100) / confirmed) : null,
	};
}

export function EvaluationProgress({
	s,
	filters: requested,
	options,
	onFilter,
	onOpenGroup,
	open,
}: {
	s: State;
	filters: PeriodFilters;
	options: {
		periods: string[];
		grades: string[];
		groups: State["groups"];
	};
	onFilter: (field: Filter, value: string) => void;
	onOpenGroup: (id: string) => void;
	open?: ViewProps["open"];
}) {
	// Grade and term set the scope of the stats; group and subject pick the table.
	const scopeFilters: PeriodFilters = {
		cycleId: requested.cycleId,
		period: requested.period,
		grade: requested.grade,
	};
	const report = buildPeriodProgress(s, scopeFilters);
	const { totals, draftIds } = report;
	const pending = report.teachers.filter((t) => t.draft + t.missing > 0);
	const groups = report.groups.filter((g) => g.cells.size);
	const scope = requested.grade
		? `${requested.grade} grado`
		: "Toda la escuela";

	const group =
		options.groups.find((g) => g.id === requested.groupId) || options.groups[0];
	const groupAssignments = s.assignments.filter((a) => a.group === group?.id);
	const subjects = [...new Set(groupAssignments.map((a) => a.subject))].sort(
		(a, b) => a.localeCompare(b, "es"),
	);
	const subject = subjects.includes(requested.subject || "")
		? requested.subject || ""
		: subjects[0] || "";
	const assignments = groupAssignments.filter((a) => a.subject === subject);
	const students = group ? enrolledStudents(s, group.id) : [];
	const columns = assignments.length + 3;
	const percentOf = (value: number) =>
		totals.expected ? Math.round((value / totals.expected) * 100) : 0;
	const stats = [
		["published", "Publicadas", totals.published],
		["draft", "En borrador", totals.draft],
		["missing", "Sin capturar", totals.missing],
	] as const;
	return (
		<section className="evaluation-progress">
			<div className="progress-layout">
				<div className="progress-main">
					<header className="progress-heading">
						<div>
							<h2>Avance de {requested.period || "periodo"}</h2>
							<p>{scope}</p>
						</div>
						<div className="progress-publish">
							<button
								type="button"
								className="evaluation-publish"
								disabled={!draftIds.length || !open}
								onClick={() =>
									open?.(
										"grade-publish-batch",
										"Publicar borradores",
										[],
										{ ids: draftIds.join(",") },
										[
											`${draftIds.length} borradores · ${requested.period}`,
											scope,
											"Las familias verán las calificaciones publicadas.",
											"Las calificaciones sin capturar no se modifican.",
										],
										`Se publicarán ${draftIds.length} calificaciones en borrador de ${requested.period} (${scope}). Las familias podrán consultarlas; las calificaciones sin capturar no cambian.`,
									)
								}
							>
								{draftIds.length
									? `Publicar ${draftIds.length} ${draftIds.length === 1 ? "borrador" : "borradores"}`
									: "Sin borradores por publicar"}
							</button>
							{draftIds.length > 0 && !open && (
								<small>La publicación no está disponible.</small>
							)}
						</div>
					</header>
					<section
						className="progress-card progress-stats"
						aria-label="Resumen de avance"
					>
						<p className="progress-stats-total">
							<strong>{totals.published}</strong> de {totals.expected}{" "}
							calificaciones publicadas
						</p>
						<Meter counts={totals} />
						<dl>
							{stats.map(([key, label, value]) => (
								<div key={key} data-state={key}>
									<dt>{label}</dt>
									<dd>
										<strong>{value}</strong>
										<span>{percentOf(value)}%</span>
									</dd>
								</div>
							))}
							<div data-state="groups">
								<dt>Grupos completos</dt>
								<dd>
									<strong>
										{groups.filter((g) => groupProgress(g).complete).length}
									</strong>
									<span>de {groups.length}</span>
								</dd>
							</div>
						</dl>
					</section>
					<div className="progress-filters">
						<Select
							id="progress-grade"
							label="Grado"
							value={requested.grade || ""}
							all="Todos"
							items={options.grades.map((g) => ({ value: g, label: g }))}
							onChange={(v) => onFilter("grade", v)}
						/>
						<Select
							id="progress-group"
							label="Grupo"
							value={group?.id || ""}
							items={options.groups.map((g) => ({
								value: g.id,
								label: g.name,
							}))}
							onChange={(v) => onFilter("groupId", v)}
						/>
						<Select
							id="progress-period"
							label="Trimestre"
							value={requested.period}
							items={options.periods.map((p) => ({ value: p, label: p }))}
							onChange={(v) => onFilter("period", v)}
						/>
						<Select
							id="progress-subject"
							label="Materia"
							value={subject}
							items={subjects.map((x) => ({ value: x, label: x }))}
							onChange={(v) => onFilter("subject", v)}
						/>
					</div>
					<div className="group-grades progress-table">
						<div className="progress-table-head">
							{group && (
								<button
									type="button"
									className="progress-group-link"
									onClick={() => onOpenGroup(group.id)}
								>
									Abrir {group.name}
								</button>
							)}
							<ul
								className="grades-legend"
								aria-label="Estado de las calificaciones"
							>
								{legend.map(([state, word]) => (
									<li key={state} data-state={state}>
										{word}
									</li>
								))}
							</ul>
						</div>
						<DataTable
							caption={group ? `${group.name} · ${subject}` : "Sin grupo"}
							variant="card"
							scrollClassName="grades-scroll progress-scroll"
							scrollLabel="Calificaciones por alumno"
						>
							<thead>
								<tr>
									<th scope="col">Alumno</th>
									{assignments.map((a) => (
										<th
											scope="col"
											key={a.id}
											data-current={a.period === requested.period || undefined}
										>
											{a.period}
										</th>
									))}
									<th scope="col">Promedio</th>
									<th scope="col">Acceso al plantel</th>
								</tr>
							</thead>
							<tbody>
								{!assignments.length && (
									<EmptyTableRow columns={columns}>
										Este grupo no tiene materias en el ciclo.
									</EmptyTableRow>
								)}
								{assignments.length > 0 &&
									students.map((student) => {
										const avg = gradeAverage(assignments, s.grades, student.id);
										const access = campusAccess(
											s,
											requested.cycleId,
											group?.id || "",
											student.id,
										);
										return (
											<tr key={student.id}>
												<th scope="row">{student.name}</th>
												{assignments.map((a) => {
													const grade = s.grades.find(
														(g) =>
															g.student === student.id && g.assignment === a.id,
													);
													const state = grade
														? grade.published
															? "Publicado"
															: "Borrador"
														: "Sin captura";
													return (
														<td
															key={a.id}
															data-current={
																a.period === requested.period || undefined
															}
															aria-label={`${grade ? number(grade.value) : ""} ${state}`.trim()}
														>
															<span
																className="grade-value"
																data-state={
																	grade
																		? grade.published
																			? "published"
																			: "draft"
																		: "missing"
																}
																title={state}
															>
																{grade ? number(grade.value) : "—"}
															</span>
														</td>
													);
												})}
												<td
													className="grades-average"
													title={avg.partial ? "Parcial" : undefined}
												>
													<strong>
														{avg.value === null ? "—" : number(avg.value)}
													</strong>
												</td>
												<td
													className="progress-access"
													title={`${access.present} días con entrada · ${access.absent} inasistencias · ${access.review} por revisar`}
												>
													{access.percent === null ? (
														<span className="progress-access-none">
															Sin registros
														</span>
													) : (
														<span
															className="progress-access-value"
															data-level={
																access.percent >= 90
																	? "ok"
																	: access.percent >= 80
																		? "warn"
																		: "low"
															}
														>
															<i
																style={{
																	["--w" as string]: `${access.percent}%`,
																}}
															/>
															{access.percent}%
														</span>
													)}
												</td>
											</tr>
										);
									})}
								{assignments.length > 0 && !students.length && (
									<EmptyTableRow columns={columns}>
										Sin alumnos inscritos en este grupo.
									</EmptyTableRow>
								)}
							</tbody>
						</DataTable>
					</div>
				</div>
				<aside
					className="progress-card progress-pending"
					aria-labelledby="progress-pending-title"
				>
					<h3 id="progress-pending-title">Pendientes por docente</h3>
					{pending.length ? (
						<ul>
							{pending.map((t, index) => (
								<li key={t.teacher}>
									<details>
										<summary>
											<span
												className="progress-avatar"
												data-tone={index % 6}
												aria-hidden="true"
											>
												{initials(t.teacher)}
											</span>
											<span className="evaluation-teacher-content">
												<strong>{t.teacher}</strong>
												<span className="progress-counts">
													{t.draft > 0 && (
														<span data-state="draft">
															{t.draft} por publicar
														</span>
													)}
													{t.missing > 0 && (
														<span data-state="missing">
															{t.missing} sin capturar
														</span>
													)}
												</span>
											</span>
										</summary>
										<ul>
											{t.cells
												.filter((c) => c.draft + c.missing > 0)
												.map((c) => (
													<li key={`${c.groupId}-${c.subject}`}>
														<button
															type="button"
															onClick={() => onOpenGroup(c.groupId)}
														>
															{c.groupName} · {c.subject}
														</button>
														<span>
															{[
																c.missing ? `faltan ${c.missing}` : "",
																c.draft ? `${c.draft} por publicar` : "",
															]
																.filter(Boolean)
																.join(" · ")}
														</span>
													</li>
												))}
										</ul>
									</details>
								</li>
							))}
						</ul>
					) : (
						<p>No hay pendientes por docente.</p>
					)}
				</aside>
			</div>
		</section>
	);
}
