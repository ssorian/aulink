import { useState } from "react";
import {
	buildPeriodProgress,
	groupProgress,
	type PeriodFilters,
	type ProgressCell,
	type ProgressCounts,
} from "./evaluation-operations";
import { educationLevel } from "./evaluation-results";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";

type Level = "Todos" | "Secundaria" | "Media superior";
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
function Cell({
	cell,
	onOpenGroup,
}: {
	cell: ProgressCell;
	onOpenGroup: (id: string) => void;
}) {
	const status =
		cell.expected === 0 || cell.missing === cell.expected
			? "sin capturar"
			: cell.missing
				? "incompleta"
				: cell.draft
					? "borrador"
					: "publicada";
	const tone =
		status === "publicada"
			? "success"
			: status === "borrador"
				? "warning"
				: status === "incompleta"
					? "danger"
					: "neutral";
	return (
		<button
			type="button"
			className={`evaluation-subject-chip eval-pill eval-pill--${tone}`}
			title={`${cell.subject} · ${status}`}
			aria-label={`${cell.groupName}, ${cell.subject}, ${cell.teacher}: ${cell.published} publicadas, ${cell.draft} en borrador, ${cell.missing} sin capturar de ${cell.expected}. Abrir grupo`}
			onClick={() => onOpenGroup(cell.groupId)}
		>
			{cell.subject}
		</button>
	);
}
export function EvaluationProgress({
	s,
	filters,
	onOpenGroup,
	open,
}: {
	s: State;
	filters: PeriodFilters;
	onOpenGroup: (id: string) => void;
	open?: ViewProps["open"];
}) {
	const [selectedLevel, setSelectedLevel] = useState<Level>("Todos");
	const base = buildPeriodProgress(s, filters);
	const levels = [
		...new Set(
			base.groups
				.filter((g) => g.cells.size)
				.map((g) =>
					educationLevel(s.groups.find((item) => item.id === g.id)?.grade),
				),
		),
	];
	const level =
		levels.length > 1 &&
		levels.includes(selectedLevel as Exclude<Level, "Todos">)
			? selectedLevel
			: "Todos";
	const report =
		level === "Todos" ? base : buildPeriodProgress(s, { ...filters, level });
	const { totals, draftIds } = report;
	const pending = report.teachers.filter((t) => t.draft + t.missing > 0);
	const groups = report.groups.filter((g) => g.cells.size);
	const scope = [
		filters.groupId
			? s.groups.find((g) => g.id === filters.groupId)?.name
			: "Todos los grupos",
		filters.subject || "Todas las materias",
		...(level === "Todos" ? [] : [level]),
	].join(" · ");
	return (
		<section className="evaluation-progress">
			<div className="evaluation-section-heading">
				<div>
					<h2>Avance de {filters.period || "periodo"}</h2>
					<p>
						{totals.published} de {totals.expected} calificaciones publicadas
					</p>
				</div>
				<div className="evaluation-heading-controls">
					{levels.length > 1 && ( // biome-ignore lint/a11y/useSemanticElements: Pressed buttons form a compact segmented control.
						<div
							className="results-segment"
							role="group"
							aria-label="Nivel educativo"
						>
							{(["Todos", "Secundaria", "Media superior"] as Level[]).map(
								(item) => (
									<button
										type="button"
										key={item}
										aria-pressed={level === item}
										onClick={() => setSelectedLevel(item)}
									>
										{item}
									</button>
								),
							)}
						</div>
					)}
					<div>
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
			</div>
			<dl
				className="results-kpis evaluation-operation-kpis"
				aria-label="Resumen de avance"
			>
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
						<div key={key}>
							<dt>{label}</dt>
							<dd>
								<strong>{totals[key]}</strong>
								<small>{percentage}% del total esperado</small>
								<div className="eval-meter" aria-hidden="true">
									<span
										className={`evaluation-bar-${key}`}
										style={{ width: `${percentage}%` }}
									/>
								</div>
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
			<div className="evaluation-progress-layout">
				<section
					className="eval-panel evaluation-group-panel"
					aria-label="Avance por grupo y materia"
				>
					<div className="evaluation-group-panel-heading">
						<h3>Avance por grupo</h3>
						<ul
							className="evaluation-chip-legend"
							aria-label="Estado de cada materia"
						>
							<li className="eval-pill eval-pill--success">Publicada</li>
							<li className="eval-pill eval-pill--warning">En borrador</li>
							<li className="eval-pill eval-pill--danger">Incompleta</li>
							<li className="eval-pill eval-pill--neutral">Sin capturar</li>
						</ul>
					</div>
					{groups.length ? (
						(levels.length > 1 && level === "Todos"
							? ["Secundaria", "Media superior"]
							: [level]
						).map((section) => {
							const sectionGroups = groups.filter(
								(g) =>
									section === "Todos" ||
									educationLevel(
										s.groups.find((item) => item.id === g.id)?.grade,
									) === section,
							);
							return sectionGroups.length ? (
								<div key={section}>
									{levels.length > 1 && level === "Todos" && <h4>{section}</h4>}
									{sectionGroups.map((group) => {
										const counts = groupProgress(group);
										return (
											<div className="evaluation-group-row" key={group.id}>
												<div className="evaluation-group-line">
													<button
														type="button"
														className="evaluation-group-name"
														onClick={() => onOpenGroup(group.id)}
													>
														{group.name}
													</button>
													<Meter counts={counts} />
													<span>
														{counts.published}/{counts.expected}
													</span>
												</div>
												<div className="evaluation-subject-chips">
													{[...group.cells.values()].map((cell) => (
														<Cell
															key={cell.subject}
															cell={cell}
															onOpenGroup={onOpenGroup}
														/>
													))}
												</div>
											</div>
										);
									})}
								</div>
							) : null;
						})
					) : (
						<div className="evaluation-empty">
							<h3>Sin asignaciones para este periodo</h3>
							<p>Revisa el periodo o los filtros seleccionados.</p>
						</div>
					)}
				</section>
				<section className="eval-panel evaluation-pending">
					<h3>Pendientes por docente</h3>
					{pending.length ? (
						<ul>
							{pending.map((t) => (
								<li key={t.teacher}>
									<details>
										<summary>
											<span className="evaluation-avatar" aria-hidden="true">
												{t.teacher
													.split(" ")
													.filter(Boolean)
													.slice(0, 2)
													.map((part) => part[0])
													.join("")
													.toUpperCase()}
											</span>
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
