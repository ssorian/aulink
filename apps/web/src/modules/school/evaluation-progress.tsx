import {
	buildPeriodProgress,
	type PeriodFilters,
	type ProgressCell,
} from "./evaluation-operations";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";

function Cell({
	cell,
	onOpenGroup,
}: {
	cell: ProgressCell;
	onOpenGroup: (id: string) => void;
}) {
	const label =
		cell.missing === cell.expected && cell.expected > 0
			? "Sin captura"
			: cell.missing > 0
				? `Faltan ${cell.missing}`
				: cell.draft > 0
					? `${cell.draft} por publicar`
					: cell.expected === 0
						? "Sin alumnos"
						: "Publicada";
	return (
		<button
			type="button"
			className="evaluation-progress-cell"
			aria-label={`${cell.groupName}, ${cell.subject}: ${cell.published} publicadas, ${cell.draft} en borrador, ${cell.missing} sin capturar de ${cell.expected}. Abrir grupo`}
			onClick={() => onOpenGroup(cell.groupId)}
		>
			<strong>{label}</strong>
			<span>
				{cell.published}/{cell.expected}
			</span>
			<span className="evaluation-cell-meter" aria-hidden="true">
				<span
					style={{
						width: `${cell.expected ? (cell.published / cell.expected) * 100 : 0}%`,
					}}
				/>
			</span>
			<small>{cell.teacher}</small>
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
	const report = buildPeriodProgress(s, filters);
	const { totals, draftIds } = report;
	const pending = report.teachers.filter((t) => t.draft + t.missing > 0);
	const scope = [
		filters.groupId
			? s.groups.find((g) => g.id === filters.groupId)?.name
			: "Todos los grupos",
		filters.subject || "Todas las materias",
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
								"Publica los borradores de la selección.",
							)
						}
					>
						Publicar {draftIds.length} borradores
					</button>
					{(!draftIds.length || !open) && (
						<small>
							{!draftIds.length
								? "No hay borradores para publicar."
								: "La publicación no está disponible."}
						</small>
					)}
				</div>
			</div>
			<div className="evaluation-progress-bar" aria-hidden="true">
				{(["published", "draft", "missing"] as const).map((k) => (
					<span
						key={k}
						className={`evaluation-bar-${k}`}
						style={{
							width: `${totals.expected ? (totals[k] / totals.expected) * 100 : 0}%`,
						}}
					/>
				))}
			</div>
			<p className="evaluation-progress-legend">
				{totals.published} publicadas · {totals.draft} en borrador ·{" "}
				{totals.missing} sin capturar
			</p>
			{!report.subjects.length ? (
				<div className="evaluation-empty">
					<h3>Sin asignaciones para este periodo</h3>
					<p>Revisa el periodo o los filtros seleccionados.</p>
				</div>
			) : (
				<>
					<section
						className="evaluation-progress-table evaluation-table-scroll"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable matrix needs keyboard access.
						tabIndex={0}
						aria-label="Avance por grupo y materia"
					>
						<table>
							<thead>
								<tr>
									<th scope="col">Grupo</th>
									{report.subjects.map((subject) => (
										<th key={subject} scope="col">
											{subject}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{report.groups.map((group) => (
									<tr key={group.id}>
										<th scope="row">{group.name}</th>
										{report.subjects.map((subject) => (
											<td key={subject}>
												{(() => {
													const cell = group.cells.get(subject);
													return cell ? (
														<Cell cell={cell} onOpenGroup={onOpenGroup} />
													) : (
														"—"
													);
												})()}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</section>
					<div className="evaluation-progress-mobile">
						{report.groups
							.filter((g) => g.cells.size)
							.map((group) => (
								<section key={group.id}>
									<h3>{group.name}</h3>
									{[...group.cells.values()].map((cell) => (
										<div key={cell.subject}>
											<span>{cell.subject}</span>
											<Cell cell={cell} onOpenGroup={onOpenGroup} />
										</div>
									))}
								</section>
							))}
					</div>
				</>
			)}
			<section className="evaluation-pending">
				<h3>Pendientes por docente</h3>
				{pending.length ? (
					<ul>
						{pending.map((t) => (
							<li key={t.teacher}>
								<strong>{t.teacher}</strong>
								<p>
									{t.draft} por publicar · {t.missing} sin capturar
								</p>
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
							</li>
						))}
					</ul>
				) : (
					<p>No hay pendientes por docente.</p>
				)}
			</section>
			<p className="evaluation-workspace-note">
				La captura y corrección se realizan dentro de cada grupo.
			</p>
		</section>
	);
}
