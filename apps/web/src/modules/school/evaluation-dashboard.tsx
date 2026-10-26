import { useMemo, useState } from "react";
import { buildEvaluationData, summarizeEvaluation } from "./evaluation-results";
import type { State } from "./workflows";
import "./evaluation-dashboard.css";

type Props = {
	s: State;
	cycleId: string;
	onCycleChange: (id: string) => void;
	onOpenGroup: (id: string) => void;
};
type Scale = ReturnType<typeof buildEvaluationData>["scales"][number];
type Bucket = ReturnType<typeof summarizeEvaluation>["byGroup"][number];
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const average = (value: number | null) =>
	value === null ? "Sin resultados publicados" : number.format(value);
const countLabel = (count: number) =>
	`${count} ${count === 1 ? "calificación publicada" : "calificaciones publicadas"}`;

function MeanTrack({ mean, scale }: { mean: number; scale: Scale }) {
	const width = Math.max(
		0,
		Math.min(100, ((mean - scale.min) / (scale.max - scale.min)) * 100),
	);
	return (
		<div className="evaluation-track" aria-hidden="true">
			<span style={{ width: `${width}%` }} />
		</div>
	);
}

function ScaleAxis({ scale }: { scale: Scale }) {
	return (
		<div className="evaluation-axis">
			<span>Mínimo {number.format(scale.min)}</span>
			<span>Máximo {number.format(scale.max)}</span>
		</div>
	);
}

function MeanBars({
	buckets,
	scale,
	title,
	id,
	onOpenGroup,
}: {
	buckets: Bucket[];
	scale: Scale | undefined;
	title: string;
	id: string;
	onOpenGroup?: (id: string) => void;
}) {
	const scrollable = buckets.length > 8;
	return (
		<figure className="evaluation-chart" aria-labelledby={id}>
			<figcaption>
				<h3 id={id}>{title}</h3>
				<p>
					Promedios en la escala original ·{" "}
					{scale?.label || "Sin escala disponible"}
				</p>
				{scrollable && (
					<p>{buckets.length} resultados · Desplaza para ver todos</p>
				)}
			</figcaption>
			{scale && <ScaleAxis scale={scale} />}
			{buckets.length ? (
				<section
					className={
						scrollable ? "evaluation-chart-scroll" : "evaluation-chart-list"
					}
					tabIndex={scrollable ? 0 : undefined}
					aria-label={`${title}${scrollable ? ", lista desplazable" : ", resultados"}`}
				>
					<ul className="evaluation-bars">
						{buckets.map((bucket) => (
							<li key={bucket.key}>
								<div className="evaluation-bar-label">
									{onOpenGroup ? (
										<button
											type="button"
											onClick={() => onOpenGroup(bucket.key)}
											aria-label={`Abrir grupo ${bucket.label}`}
										>
											{bucket.label}
										</button>
									) : (
										<span>{bucket.label}</span>
									)}
								</div>
								<div className="evaluation-bar-data">
									<div className="evaluation-bar-value">
										{scale && bucket.mean !== null && (
											<MeanTrack mean={bucket.mean} scale={scale} />
										)}
										<strong>{average(bucket.mean)}</strong>
									</div>
									<span className="evaluation-bar-detail">
										{countLabel(bucket.count)}
									</span>
								</div>
							</li>
						))}
					</ul>
				</section>
			) : (
				<p className="evaluation-chart-empty">Sin resultados publicados</p>
			)}
		</figure>
	);
}

export function EvaluationDashboard({
	s,
	cycleId,
	onCycleChange,
	onOpenGroup,
}: Props) {
	const data = useMemo(() => buildEvaluationData(s), [s]);
	const [selection, setSelection] = useState({
		cycle: cycleId,
		scale: "",
		period: "",
		subject: "",
	});
	const cycleAssignments = data.assignments.filter(
		(a) => a.cycleId === cycleId,
	);
	const scales = data.scales.filter((scale) =>
		cycleAssignments.some((a) => a.scaleKey === scale.key),
	);
	const scale =
		scales.find(
			(item) => selection.cycle === cycleId && item.key === selection.scale,
		) || scales[0];
	const scaleKey = scale?.key || "";
	const assignments = cycleAssignments.filter((a) => a.scaleKey === scaleKey);
	const choices = (field: "period" | "subject") =>
		[...new Set(assignments.map((a) => a[field]))].sort((a, b) =>
			a.localeCompare(b, "es", { numeric: true }),
		);
	const periods = choices("period");
	const subjects = choices("subject");
	const current = selection.cycle === cycleId && selection.scale === scaleKey;
	const period =
		current && periods.includes(selection.period) ? selection.period : "";
	const subject =
		current && subjects.includes(selection.subject) ? selection.subject : "";
	const report = summarizeEvaluation(data, {
		cycleId,
		scaleKey,
		period,
		subject,
	});
	const cycleName =
		s.cycles.find((cycle) => cycle.id === cycleId)?.name ||
		"Sin ciclo disponible";
	const emptyGroup = s.groups.find((group) => group.cycle === cycleId);
	function changeFilter(field: "period" | "subject", value: string) {
		setSelection({
			cycle: cycleId,
			scale: scaleKey,
			period,
			subject,
			[field]: value,
		});
	}
	return (
		<section
			className="evaluation-dashboard"
			aria-label="Resultados académicos"
		>
			<header className="evaluation-header">
				<h2>Resultados académicos</h2>
				<p>
					Consulta únicamente calificaciones publicadas, un ciclo y una escala a
					la vez.
				</p>
			</header>
			<div className="evaluation-filters">
				<label htmlFor="evaluation-cycle">
					Ciclo escolar
					<select
						id="evaluation-cycle"
						value={cycleId}
						disabled={!s.cycles.length}
						onChange={(event) => {
							setSelection({
								cycle: event.target.value,
								scale: "",
								period: "",
								subject: "",
							});
							onCycleChange(event.target.value);
						}}
					>
						{!s.cycles.length && (
							<option value="">Sin ciclos disponibles</option>
						)}
						{s.cycles.map((cycle) => (
							<option key={cycle.id} value={cycle.id}>
								{cycle.name}
							</option>
						))}
					</select>
				</label>
				<label htmlFor="evaluation-scale">
					Escala
					<select
						id="evaluation-scale"
						value={scaleKey}
						disabled={!scales.length}
						onChange={(event) =>
							setSelection({
								cycle: cycleId,
								scale: event.target.value,
								period: "",
								subject: "",
							})
						}
					>
						{!scales.length && (
							<option value="">Sin escalas disponibles</option>
						)}
						{scales.map((item) => (
							<option key={item.key} value={item.key}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label htmlFor="evaluation-period">
					Evaluación
					<select
						id="evaluation-period"
						value={period}
						disabled={!periods.length}
						onChange={(event) => changeFilter("period", event.target.value)}
					>
						<option value="">Todas</option>
						{periods.map((item) => (
							<option key={item}>{item}</option>
						))}
					</select>
				</label>
				<label htmlFor="evaluation-subject">
					Materia
					<select
						id="evaluation-subject"
						value={subject}
						disabled={!subjects.length}
						onChange={(event) => changeFilter("subject", event.target.value)}
					>
						<option value="">Todas</option>
						{subjects.map((item) => (
							<option key={item}>{item}</option>
						))}
					</select>
				</label>
			</div>
			<section
				className="evaluation-overview"
				aria-label="Gráficas de resultados publicados"
			>
				<figure
					className="evaluation-school-mean"
					aria-live="polite"
					aria-labelledby="evaluation-school-chart"
				>
					<figcaption>
						<h3 id="evaluation-school-chart">Promedio escolar</h3>
						<p>
							{cycleName} · {scale?.label || "Sin escala disponible"}
						</p>
					</figcaption>
					<div className="evaluation-school-plot">
						<strong className="evaluation-mean">{average(report.mean)}</strong>
						{scale && report.mean !== null && (
							<>
								<MeanTrack mean={report.mean} scale={scale} />
								<ScaleAxis scale={scale} />
							</>
						)}
					</div>
					<p>
						{countLabel(report.count)}
						<br />
						{period ||
							(report.byPeriod.length === 1
								? report.byPeriod[0].label
								: "Todas las evaluaciones")}{" "}
						· {subject || "Todas las materias"}
					</p>
				</figure>
				<div
					className={
						report.byPeriod.length > 1
							? "evaluation-chart-pair"
							: "evaluation-chart-single"
					}
				>
					{report.byPeriod.length > 1 && (
						<MeanBars
							buckets={report.byPeriod}
							scale={scale}
							title="Promedio por evaluación"
							id="evaluation-period-chart"
						/>
					)}
					<MeanBars
						buckets={report.byGroup}
						scale={scale}
						title="Comparación por grupo"
						id="evaluation-group-chart"
						onOpenGroup={onOpenGroup}
					/>
				</div>
				{report.count === 0 && (
					<div className="evaluation-empty">
						<h3>Sin resultados publicados</h3>
						<p>
							Publica calificaciones desde el espacio de un grupo para consultar
							sus resultados aquí. Si ya existen, revisa el ciclo, la escala y
							los filtros seleccionados.
						</p>
						{emptyGroup && (
							<button type="button" onClick={() => onOpenGroup(emptyGroup.id)}>
								Abrir grupo {emptyGroup.name}
							</button>
						)}
					</div>
				)}
			</section>
			<section
				className="evaluation-results"
				aria-labelledby="evaluation-results-heading"
			>
				<h3 id="evaluation-results-heading">
					Resultados por grupo, evaluación y materia
				</h3>
				<p>
					{cycleName} · {scale?.label || "Sin escala disponible"} ·{" "}
					{report.rows.length} resultados
				</p>
				<p className="evaluation-scroll-hint">
					Desplaza la tabla horizontalmente para consultar todas las columnas.
				</p>
				<section
					className="evaluation-table-scroll"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable results need keyboard access.
					tabIndex={0}
					aria-label="Resultados por grupo, tabla con desplazamiento horizontal"
				>
					<table>
						<caption>
							Promedios publicados · {cycleName} ·{" "}
							{scale?.label || "Sin escala disponible"}
						</caption>
						<thead>
							<tr>
								{[
									"Grupo",
									"Evaluación",
									"Materia",
									"Promedio",
									"Calificaciones",
									"Acción",
								].map((heading) => (
									<th scope="col" key={heading}>
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{report.rows.map((row) => (
								<tr key={row.key}>
									<th scope="row">{row.groupName}</th>
									<td>{row.period}</td>
									<td>{row.subject}</td>
									<td className="evaluation-number">{average(row.mean)}</td>
									<td className="evaluation-number">{row.count}</td>
									<td>
										<button
											type="button"
											onClick={() => onOpenGroup(row.groupId)}
											aria-label={`Abrir grupo ${row.groupName} · ${row.subject} · ${row.period}`}
										>
											Abrir grupo
										</button>
									</td>
								</tr>
							))}
							{!report.rows.length && (
								<tr>
									<td colSpan={6}>No hay asignaciones para esta selección.</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
				<details className="evaluation-method">
					<summary>Cómo se calculan los resultados</summary>
					<p>
						Cada calificación publicada tiene el mismo peso en el promedio
						escolar; no se promedian los promedios de los grupos. Se usa su
						valor actual, no su historial de cambios.
					</p>
					<p>
						Las calificaciones faltantes no se convierten en cero. Los
						borradores quedan fuera y las escalas y los ciclos nunca se mezclan.
						Los conteos son registros de calificaciones: no representan alumnos
						ni cobertura.
					</p>
					<p>
						Los filtros se aplican a todas las gráficas y a la tabla. Abrir un
						grupo lleva a su sección de calificaciones, no a una materia o
						evaluación específica.
					</p>
				</details>
				{(data.diagnostics.excluded > 0 || data.diagnostics.duplicates > 0) && (
					<p className="evaluation-diagnostics">
						Diagnóstico global de los datos guardados (todos los ciclos y
						escalas): {data.diagnostics.excluded} registros publicados excluidos
						por datos inválidos o referencias incompletas;{" "}
						{data.diagnostics.duplicates} duplicados válidos contados por
						separado.
					</p>
				)}
			</section>
		</section>
	);
}
