import { Fragment } from "react";
import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import {
	buildPeriodProgress,
	groupProgress,
	type PeriodFilters,
	type ProgressCounts,
} from "./evaluation-operations";
import { enrolledStudents } from "./group-context";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";
import "./group-tables.css";
import "./schedule-calendar.css";

type Filter = "period" | "groupId" | "subject" | "grade";
const legend = [
	["published", "Publicado"],
	["draft", "Borrador"],
	["missing", "Sin captura"],
] as const;
const number = (value: number) =>
	value.toLocaleString("es-MX", { maximumFractionDigits: 2 });

function Meter({ counts }: { counts: ProgressCounts }) {
	return (
		<div className="evaluation-stack" aria-hidden="true">
			{(["published", "draft", "missing"] as const).map((key) => (
				<span
					key={key}
					className={`evaluation-bar-${key}`}
					style={{
						width: `${counts.expected ? (counts[key] / counts.expected) * 100 : 0}%`,
					}}
				/>
			))}
		</div>
	);
}

function Select({
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
		subjects: string[];
	};
	onFilter: (field: Filter, value: string) => void;
	onOpenGroup: (id: string) => void;
	open?: ViewProps["open"];
}) {
	const filters: PeriodFilters = {
		...requested,
		groupId: options.groups.some((g) => g.id === requested.groupId)
			? requested.groupId
			: "",
		subject: options.subjects.includes(requested.subject || "")
			? requested.subject
			: "",
	};
	const report = buildPeriodProgress(s, filters);
	const { totals, draftIds } = report;
	const pending = report.teachers.filter((t) => t.draft + t.missing > 0);
	const groups = report.groups.filter((g) => g.cells.size);
	const subjects = report.subjects;
	const scope = [
		filters.grade ? `${filters.grade} grado` : "",
		filters.groupId
			? s.groups.find((g) => g.id === filters.groupId)?.name
			: "Todos los grupos",
		filters.subject || "Todas las materias",
	]
		.filter(Boolean)
		.join(" · ");
	const gradeOf = (
		assignmentGroup: string,
		subject: string,
		student: string,
	) => {
		const assignment = s.assignments.find(
			(a) =>
				a.group === assignmentGroup &&
				a.period === filters.period &&
				a.subject === subject,
		);
		if (!assignment) return undefined;
		return {
			grade: s.grades.find(
				(g) => g.assignment === assignment.id && g.student === student,
			),
		};
	};
	const many = groups.length > 1;
	return (
		<section className="evaluation-progress">
			<div className="progress-filters">
				<Select
					id="progress-grade"
					label="Grado"
					value={filters.grade || ""}
					all="Todos"
					items={options.grades.map((g) => ({ value: g, label: g }))}
					onChange={(v) => onFilter("grade", v)}
				/>
				<Select
					id="progress-group"
					label="Grupo"
					value={filters.groupId || ""}
					all="Todos"
					items={options.groups.map((g) => ({ value: g.id, label: g.name }))}
					onChange={(v) => onFilter("groupId", v)}
				/>
				<Select
					id="progress-period"
					label="Trimestre"
					value={filters.period}
					items={options.periods.map((p) => ({ value: p, label: p }))}
					onChange={(v) => onFilter("period", v)}
				/>
				<Select
					id="progress-subject"
					label="Materia"
					value={filters.subject || ""}
					all="Todas"
					items={options.subjects.map((x) => ({ value: x, label: x }))}
					onChange={(v) => onFilter("subject", v)}
				/>
			</div>
			<div className="progress-heading">
				<div>
					<h2>Avance de {filters.period || "periodo"}</h2>
					<p>
						{totals.published} de {totals.expected} calificaciones publicadas ·{" "}
						{scope}
					</p>
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
									`${draftIds.length} borradores · ${filters.period}`,
									scope,
									"Las familias verán las calificaciones publicadas.",
									"Las calificaciones sin capturar no se modifican.",
								],
								`Se publicarán ${draftIds.length} calificaciones en borrador de ${filters.period} (${scope}). Las familias podrán consultarlas; las calificaciones sin capturar no cambian.`,
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
			</div>
			<dl className="progress-kpis" aria-label="Resumen de avance">
				{(
					[
						["published", "Publicadas"],
						["draft", "En borrador"],
						["missing", "Sin capturar"],
					] as const
				).map(([key, label]) => {
					const percentage = totals.expected
						? Math.round((totals[key] / totals.expected) * 100)
						: 0;
					return (
						<div key={key} data-state={key}>
							<dt>{label}</dt>
							<dd>
								<strong>{totals[key]}</strong>
								<small>{percentage}% del total</small>
							</dd>
						</div>
					);
				})}
				<div>
					<dt>Grupos completos</dt>
					<dd>
						<strong>
							{groups.filter((g) => groupProgress(g).complete).length}/
							{groups.length}
						</strong>
						<small>Todas sus materias publicadas</small>
					</dd>
				</div>
			</dl>
			<div className="progress-meter">
				<Meter counts={totals} />
			</div>
			<div className="progress-layout">
				<section
					className="group-grades progress-table"
					aria-label="Calificaciones por alumno"
				>
					<ul
						className="grades-legend"
						aria-label="Estado de las calificaciones"
					>
						{legend.map(([state, word]) => (
							<li key={state} data-state={state}>
								{word}
							</li>
						))}
						<li className="grades-note">Los faltantes no cuentan como cero</li>
					</ul>
					<DataTable
						caption={`Calificaciones de ${filters.period} · ${scope}`}
						variant="card"
						scrollClassName="grades-scroll progress-scroll"
						scrollLabel="Calificaciones por alumno"
					>
						<thead>
							<tr>
								<th scope="col">Alumno</th>
								{subjects.map((subject) => (
									<th scope="col" key={subject}>
										{subject}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{!groups.length && (
								<EmptyTableRow columns={subjects.length + 1}>
									Sin materias para este trimestre con los filtros elegidos.
								</EmptyTableRow>
							)}
							{groups.map((group) => {
								const counts = groupProgress(group);
								return (
									<Fragment key={group.id}>
										{many && (
											<tr className="grades-group-row">
												<th scope="colgroup" colSpan={subjects.length + 1}>
													<button
														type="button"
														className="progress-group-link"
														onClick={() => onOpenGroup(group.id)}
													>
														{group.name}
													</button>
													<span>
														{counts.published} de {counts.expected} publicadas
													</span>
												</th>
											</tr>
										)}
										{enrolledStudents(s, group.id).map((student) => (
											<tr key={`${group.id}-${student.id}`}>
												<th scope="row">
													{student.name}
													<small>
														{many ? `${group.name} · ` : ""}
														{student.matricula}
													</small>
												</th>
												{subjects.map((subject) => {
													const found = gradeOf(group.id, subject, student.id);
													if (!found)
														return (
															<td key={subject} aria-label="No se imparte">
																<span className="grade-none" />
															</td>
														);
													const { grade } = found;
													const state = grade
														? grade.published
															? "Publicado"
															: "Borrador"
														: "Sin captura";
													return (
														<td
															key={subject}
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
											</tr>
										))}
									</Fragment>
								);
							})}
						</tbody>
					</DataTable>
				</section>
				<section
					className="progress-pending"
					aria-labelledby="progress-pending-title"
				>
					<h3 id="progress-pending-title">Pendientes por docente</h3>
					{pending.length ? (
						<ul>
							{pending.map((t) => (
								<li key={t.teacher}>
									<details>
										<summary>
											<span className="evaluation-teacher-content">
												<strong>{t.teacher}</strong>
												<Meter counts={t} />
												<small>
													{t.draft} por publicar · {t.missing} sin capturar
												</small>
											</span>
										</summary>
										<ul>
											{t.cells
												.filter((c) => c.draft + c.missing > 0)
												.map((c) => (
													<li key={`${c.groupId}-${c.subject}`}>
														{c.groupName} · {c.subject} —{" "}
														{c.missing > 0 && `faltan ${c.missing}`}
														{c.missing > 0 && c.draft > 0 && "; "}
														{c.draft > 0 && `${c.draft} por publicar`}
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
				</section>
			</div>
			<p className="evaluation-workspace-note">
				La captura y corrección se realizan dentro de cada grupo.
			</p>
		</section>
	);
}
