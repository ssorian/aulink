import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardTitle } from "../../../components/ui/card";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Legend } from "../../../components/ui/legend";
import { Stat, StatGrid } from "../../../components/ui/stat";
import { type Tone, toneFill } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import { enrolledStudents } from "../groups/group-context";
import { attendanceStatus, gradeAverage } from "../groups/group-table-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import {
	buildPeriodProgress,
	groupProgress,
	type PeriodFilters,
	type ProgressCounts,
} from "./evaluation-operations";
import {
	ActionNote,
	filterFieldClass,
	filterRowClass,
	layoutClass,
	SectionHeading,
	sideClass,
	statClass,
	tableScroll,
} from "./evaluation-parts";

/** Kept for the other modules that still import it from here. */
export { Select };

type Filter = "period" | "groupId" | "subject" | "grade";
const legend: { tone: Tone; label: string }[] = [
	{ tone: "success", label: "Publicado" },
	{ tone: "mustard", label: "Borrador" },
	{ tone: "neutral", label: "Sin captura" },
];
const number = (value: number) =>
	value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
const teacherTones: Tone[] = [
	"lilac",
	"sky",
	"peach",
	"teal",
	"lemon",
	"brown",
];
const stateTone = {
	published: "success",
	draft: "mustard",
	missing: "brick",
} as const;
const gradeDot = {
	published: "before:bg-success",
	draft: "before:bg-mustard",
	missing: "before:ring-1 before:ring-input before:ring-inset",
} as const;
const accessLevel = {
	ok: { ink: "text-success", fill: toneFill.success },
	warn: { ink: "text-mustard-ink", fill: toneFill.mustard },
	low: { ink: "text-brick-ink", fill: toneFill.brick },
} as const;

/** One stacked bar for published / draft / missing; the figures above carry the text. */
function Stack({ counts }: { counts: ProgressCounts }) {
	return (
		<div
			data-slot="progress-stack"
			aria-hidden="true"
			className="flex h-2.5 min-w-0 overflow-hidden rounded-full bg-muted"
		>
			{(["published", "draft", "missing"] as const).map((key) => (
				<span
					key={key}
					data-state={key}
					className={toneFill[stateTone[key]]}
					style={{
						width: `${counts.expected ? (counts[key] / counts.expected) * 100 : 0}%`,
					}}
				/>
			))}
		</div>
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
		<section data-slot="evaluation-progress" className="mt-2">
			<div className={layoutClass}>
				<div className="min-w-0">
					<SectionHeading
						title={`Avance de ${requested.period || "periodo"}`}
						description={scope}
					>
						<div>
							<Button
								variant="primary"
								size="sm"
								className="rounded-sm px-3 py-2"
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
							</Button>
							{draftIds.length > 0 && !open && (
								<ActionNote>La publicación no está disponible.</ActionNote>
							)}
						</div>
					</SectionHeading>
					<Card
						data-slot="progress-stats"
						aria-label="Resumen de avance"
						className="px-5.5 py-5"
						padding="none"
					>
						<p className="mb-2.5 max-w-none text-[15px] leading-[1.6] text-foreground">
							<strong className="text-lg">{totals.published}</strong> de{" "}
							{totals.expected} calificaciones publicadas
						</p>
						<Stack counts={totals} />
						<StatGrid className="mt-[18px]">
							{stats.map(([key, label, value]) => (
								<Stat
									key={key}
									state={key}
									label={label}
									value={value}
									caption={`${percentOf(value)}%`}
									className={statClass}
								/>
							))}
							<Stat
								state="groups"
								label="Grupos completos"
								value={groups.filter((g) => groupProgress(g).complete).length}
								caption={`de ${groups.length}`}
								className={statClass}
							/>
						</StatGrid>
					</Card>
					<FilterBar label="Filtros de avance" className={filterRowClass}>
						<Select
							id="progress-grade"
							label="Grado"
							className={filterFieldClass}
							value={requested.grade || ""}
							all="Todos"
							items={options.grades.map((g) => ({ value: g, label: g }))}
							onChange={(v) => onFilter("grade", v)}
						/>
						<Select
							id="progress-group"
							label="Grupo"
							className={filterFieldClass}
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
							className={filterFieldClass}
							value={requested.period}
							items={options.periods.map((p) => ({ value: p, label: p }))}
							onChange={(v) => onFilter("period", v)}
						/>
						<Select
							id="progress-subject"
							label="Materia"
							className={filterFieldClass}
							value={subject}
							items={subjects.map((x) => ({ value: x, label: x }))}
							onChange={(v) => onFilter("subject", v)}
						/>
					</FilterBar>
					<div data-slot="progress-table" className="min-w-0">
						<div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
							{group && (
								<Button
									variant="link"
									className="min-h-9 text-sm font-[650]"
									onClick={() => onOpenGroup(group.id)}
								>
									Abrir {group.name}
								</Button>
							)}
							<Legend
								label="Estado de las calificaciones"
								items={legend}
								className="gap-x-4.5 text-[13px]"
							/>
						</div>
						<DataTable
							caption={group ? `${group.name} · ${subject}` : "Sin grupo"}
							variant="card"
							scrollClassName={tableScroll(
								"max-h-[70vh]",
								"[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-3 [&_thead_th:first-child]:z-4",
								"[&_thead_th:not(:first-child)]:text-center [&_td]:text-center",
								"[&_td[data-current=true]]:bg-teal-bg/70 [&_thead_th[data-current=true]]:bg-teal-bg [&_thead_th[data-current=true]]:text-teal-ink",
							)}
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
										const level =
											access.percent === null
												? null
												: access.percent >= 90
													? "ok"
													: access.percent >= 80
														? "warn"
														: "low";
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
													const key = grade
														? grade.published
															? "published"
															: "draft"
														: "missing";
													return (
														<td
															key={a.id}
															data-current={
																a.period === requested.period || undefined
															}
															aria-label={`${grade ? number(grade.value) : ""} ${state}`.trim()}
														>
															<span
																data-slot="grade-value"
																data-state={key}
																title={state}
																className={cn(
																	"inline-flex items-center gap-2 text-[15px] font-semibold before:size-2 before:shrink-0 before:rounded-full",
																	gradeDot[key],
																	key === "missing" &&
																		"font-normal text-muted-foreground",
																)}
															>
																{grade ? number(grade.value) : "—"}
															</span>
														</td>
													);
												})}
												<td title={avg.partial ? "Parcial" : undefined}>
													<strong className="text-[15px]">
														{avg.value === null ? "—" : number(avg.value)}
													</strong>
												</td>
												<td
													title={`${access.present} días con entrada · ${access.absent} inasistencias · ${access.review} por revisar`}
												>
													{level === null ? (
														<span className="text-[13px] text-muted-foreground">
															Sin registros
														</span>
													) : (
														<span
															data-slot="campus-access"
															data-level={level}
															className={cn(
																"inline-flex items-center gap-2 text-sm font-semibold",
																accessLevel[level].ink,
															)}
														>
															<span
																aria-hidden="true"
																className="block h-1.5 w-14 overflow-hidden rounded-full bg-muted"
															>
																<span
																	className={cn(
																		"block h-full rounded-[inherit]",
																		accessLevel[level].fill,
																	)}
																	style={{ width: `${access.percent}%` }}
																/>
															</span>
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
				<aside className={sideClass}>
					<Card
						data-slot="progress-pending"
						aria-labelledby="progress-pending-title"
						className="max-h-[calc(100vh-32px)] overflow-y-auto px-[18px] pt-[18px] pb-2 max-[1180px]:max-h-none"
						padding="none"
					>
						<CardTitle
							id="progress-pending-title"
							className="text-base font-[650] tracking-normal"
						>
							Pendientes por docente
						</CardTitle>
						{pending.length ? (
							<CardContent>
								<ul className="m-0 list-none p-0">
									{pending.map((t, index) => (
										<li
											key={t.teacher}
											className="border-border not-first:border-t"
										>
											<details className="group">
												<summary className="flex cursor-pointer list-none items-center gap-3 py-3 text-foreground after:text-base after:text-muted-foreground after:content-['+'] group-open:after:content-['−'] [&::-webkit-details-marker]:hidden">
													<span aria-hidden="true" className="inline-flex">
														<Avatar
															name={t.teacher}
															tone={teacherTones[index % teacherTones.length]}
															className="size-9 font-bold"
														/>
													</span>
													<span className="grid min-w-0 flex-1 gap-1">
														<strong className="text-sm leading-[1.5] font-semibold text-foreground">
															{t.teacher}
														</strong>
														<span className="flex flex-wrap gap-1">
															{t.draft > 0 && (
																<Badge
																	tone="mustard"
																	className="px-2 py-px leading-[1.5]"
																>
																	{t.draft} por publicar
																</Badge>
															)}
															{t.missing > 0 && (
																<Badge
																	tone="brick"
																	className="px-2 py-px leading-[1.5]"
																>
																	{t.missing} sin capturar
																</Badge>
															)}
														</span>
													</span>
												</summary>
												<ul className="m-0 list-none p-0 pb-3 pl-12">
													{t.cells
														.filter((c) => c.draft + c.missing > 0)
														.map((c) => (
															<li
																key={`${c.groupId}-${c.subject}`}
																className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-muted-foreground"
															>
																<Button
																	variant="link"
																	className="min-h-8 text-[13px]"
																	onClick={() => onOpenGroup(c.groupId)}
																>
																	{c.groupName} · {c.subject}
																</Button>
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
							</CardContent>
						) : (
							<p className="text-sm">No hay pendientes por docente.</p>
						)}
					</Card>
				</aside>
			</div>
		</section>
	);
}
