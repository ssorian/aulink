import { useState } from "react";
import type { EvaluationRules } from "./evaluation-operations";
import {
	buildEvaluationMatrix,
	type EvaluationData,
	educationLevel,
	filterEvaluationLevel,
	gradeHistogram,
	subjectStatistics,
	summarizeEvaluation,
} from "./evaluation-results";
import "./evaluation-results-view.css";

type Props = {
	data: EvaluationData;
	cycleId: string;
	cycleName: string;
	period: string;
	subject: string;
	groupId: string;
	rules: EvaluationRules;
	onOpenGroup: (id: string) => void;
};
type Level = "Todos" | "Secundaria" | "Media superior";
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("es-MX", {
	style: "percent",
	maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-MX", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 2,
});
const fmt = (value: number | null | undefined) =>
	value == null ? "—" : decimal.format(value);
const countLabel = (count: number) =>
	`${count} ${count === 1 ? "calificación publicada" : "calificaciones publicadas"}`;
const signed = (value: number | null) =>
	value == null
		? "—"
		: `${Math.abs(value) < 0.005 ? "±" : value > 0 ? "+" : "−"}${decimal.format(Math.abs(value))}`;

export function EvaluationResultsView({
	data,
	cycleId,
	cycleName,
	period,
	subject,
	groupId,
	rules,
	onOpenGroup,
}: Props) {
	const [selectedScale, setSelectedScale] = useState("");
	const [selectedLevel, setSelectedLevel] = useState<Level>("Todos");
	const [sort, setSort] = useState("lowest");
	const scales = data.scales.filter((scale) =>
		data.assignments.some(
			(a) => a.cycleId === cycleId && a.scaleKey === scale.key,
		),
	);
	const scale = scales.find((item) => item.key === selectedScale) || scales[0];
	const scaleKey = scale?.key || "";
	const filters = { cycleId, scaleKey, period, subject, groupId };
	const matches = (a: EvaluationData["assignments"][number]) =>
		a.cycleId === cycleId &&
		a.scaleKey === scaleKey &&
		(!period || a.period === period) &&
		(!subject || a.subject === subject) &&
		(!groupId || a.groupId === groupId);
	const levels = [
		...new Set(
			data.assignments.filter(matches).map((a) => educationLevel(a.grade)),
		),
	];
	const level =
		levels.length > 1 &&
		levels.includes(selectedLevel as Exclude<Level, "Todos">)
			? selectedLevel
			: "Todos";
	const scoped = filterEvaluationLevel(data, level);
	const report = summarizeEvaluation(scoped, filters);
	const records = scoped.records.filter(matches);
	const failureCount = records.filter((r) => r.value < rules.passing).length;
	const rate = records.length ? failureCount / records.length : null;
	const subjectRows = subjectStatistics(report, records, rules.passing).sort(
		(a, b) => {
			if (sort === "name") return a.subject.localeCompare(b.subject, "es");
			const av = sort === "failure" ? a.failureRate : a.mean;
			const bv = sort === "failure" ? b.failureRate : b.mean;
			if (av == null) return bv == null ? 0 : 1;
			if (bv == null) return -1;
			return sort === "failure" ? bv - av : av - bv;
		},
	);
	const ranked = subjectRows
		.filter((row) => row.mean != null)
		.sort((a, b) => (a.mean ?? 0) - (b.mean ?? 0));
	const lowest = ranked[0];
	const highest = ranked[ranked.length - 1];
	const bins = gradeHistogram(
		records.map((r) => r.value),
		rules.passing,
	);
	const maxBin = Math.max(1, ...bins.map((bin) => bin.count));
	const evolution = report.byPeriod.filter((p) => p.mean != null);
	const means = evolution.map((p) => p.mean ?? 0);
	const low = Math.min(...means) - 0.5;
	const high = Math.max(...means) + 0.5;
	const span = high - low || 1;
	const truncated =
		scale?.min === 0 &&
		scale.max === 10 &&
		ranked.length > 0 &&
		ranked.every((row) => (row.mean ?? 0) >= 5);
	const axisMin = truncated ? 5 : (scale?.min ?? 0);
	const axisMax = scale?.max ?? 10;
	const position = (value: number) =>
		Math.max(0, Math.min(100, ((value - axisMin) / (axisMax - axisMin)) * 100));
	const totalPosition = (value: number) =>
		scale
			? Math.max(
					0,
					Math.min(100, ((value - scale.min) / (scale.max - scale.min)) * 100),
				)
			: 0;
	const ticks = truncated ? [5, 6, 7, 8, 9, 10] : [axisMin, axisMax];
	return (
		<section
			className="evaluation-results results-new"
			aria-label="Resultados publicados"
		>
			<header className="results-header">
				<div>
					<h2>Resultados publicados</h2>
					<p>
						Lo mismo que consultan las familias. Los borradores no se incluyen.
					</p>
				</div>
				<div className="results-controls">
					{scales.length > 1 && (
						<label htmlFor="evaluation-scale">
							Escala{" "}
							<select
								id="evaluation-scale"
								value={scaleKey}
								onChange={(event) => setSelectedScale(event.target.value)}
							>
								{scales.map((item) => (
									<option key={item.key} value={item.key}>
										{item.label}
									</option>
								))}
							</select>
						</label>
					)}
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
				</div>
			</header>
			<dl
				className="results-kpis"
				aria-label="Resumen de resultados"
				aria-live="polite"
			>
				<div>
					<dt>Promedio general</dt>
					<dd>
						<strong className="evaluation-mean">{fmt(report.mean)}</strong>
						<small>
							{scale?.label || "Sin escala disponible"} ·{" "}
							{countLabel(report.count)}
						</small>
					</dd>
				</div>
				<div>
					<dt>Aprobación</dt>
					<dd>
						<strong>{rate == null ? "—" : percent.format(1 - rate)}</strong>
						<small>
							Calificaciones de {number.format(rules.passing)} o más
						</small>
					</dd>
				</div>
				<div>
					<dt>Calificaciones reprobatorias</dt>
					<dd>
						<strong>{report.count ? failureCount : "—"}</strong>
						<small>
							{rate == null ? "—" : percent.format(rate)} por debajo de{" "}
							{number.format(rules.passing)}
						</small>
					</dd>
				</div>
				<div>
					<dt>Brecha entre materias</dt>
					<dd>
						<strong>
							{lowest && highest
								? fmt((highest.mean ?? 0) - (lowest.mean ?? 0))
								: "—"}
						</strong>
						<small>
							{lowest && highest
								? `${lowest.subject} – ${highest.subject}`
								: "Sin resultados publicados"}
						</small>
					</dd>
				</div>
			</dl>
			{report.count === 0 && (
				<div className="evaluation-empty" aria-live="polite">
					<h3>Sin resultados publicados</h3>
					<p>
						{data.records.some(
							(r) => r.cycleId === cycleId && r.scaleKey === scaleKey,
						)
							? "No hay calificaciones publicadas con estos filtros. Prueba con otro periodo, materia o grupo."
							: "Publica calificaciones desde el espacio de un grupo para consultar sus resultados aquí."}
					</p>
				</div>
			)}
			<div className="results-columns">
				<section
					className="results-panel results-subjects"
					aria-labelledby="results-subject-title"
				>
					<header>
						<div>
							<h3 id="results-subject-title">Materias</h3>
							<p>
								Promedio y rango entre grupos · línea punteada: aprobatoria{" "}
								{number.format(rules.passing)}
							</p>
						</div>
						<label>
							Ordenar{" "}
							<select
								value={sort}
								onChange={(event) => setSort(event.target.value)}
							>
								<option value="lowest">Menor promedio</option>
								<option value="failure">Mayor reprobación</option>
								<option value="name">Nombre</option>
							</select>
						</label>
					</header>
					<p className="results-axis-label">
						Eje de {number.format(axisMin)} a {number.format(axisMax)}
						{truncated ? " (rango fuera del eje recortado)" : ""} · Δ vs
						promedio general · % reprobación
					</p>
					<div className="results-axis-row" aria-hidden="true">
						<span />
						<div className="results-axis-ticks">
							{ticks.map((tick) => (
								<span key={tick} style={{ left: `${position(tick)}%` }}>
									{number.format(tick)}
								</span>
							))}
						</div>
						<span />
						<span />
						<span />
					</div>
					<div className="results-subject-list">
						{subjectRows.map((row) => {
							const subjectLevels = [
								...new Set(
									scoped.assignments
										.filter((a) => matches(a) && a.subject === row.subject)
										.map((a) => educationLevel(a.grade)),
								),
							];
							return (
								<div className="results-subject-row" key={row.subject}>
									<div className="results-subject-name">
										<strong>{row.subject}</strong>
										{levels.length > 1 && level === "Todos" && (
											<small>{subjectLevels.join(" · ")}</small>
										)}
									</div>
									<div
										className="results-plot"
										role="img"
										aria-label={`Promedio ${fmt(row.mean)}, rango entre grupos ${fmt(row.minGroupMean)} a ${fmt(row.maxGroupMean)}`}
									>
										<span
											className="results-threshold"
											style={{ left: `${position(rules.passing)}%` }}
										/>
										{row.minGroupMean != null && row.maxGroupMean != null && (
											<span
												className="results-range"
												style={{
													left: `${position(row.minGroupMean)}%`,
													width: `${position(row.maxGroupMean) - position(row.minGroupMean)}%`,
												}}
											/>
										)}
										{row.mean != null && (
											<span
												className="results-dot"
												style={{ left: `${position(row.mean)}%` }}
											/>
										)}
									</div>
									<strong>{fmt(row.mean)}</strong>
									<span
										className={
											row.delta == null || Math.abs(row.delta) < 0.25
												? "results-neutral"
												: row.delta < 0
													? "results-negative"
													: "results-positive"
										}
									>
										{signed(row.delta)}
									</span>
									<span>
										{row.failureRate == null
											? "—"
											: percent.format(row.failureRate)}
									</span>
								</div>
							);
						})}
					</div>
				</section>
				<div className="results-side">
					<section className="results-panel">
						<h3>Distribución de calificaciones</h3>
						<p>
							Intervalos enteros · rojo cuando todo el intervalo está por debajo
							de {number.format(rules.passing)}
						</p>
						<div className="results-histogram">
							{bins.map((bin) => (
								<div
									key={bin.value}
									title={`${bin.value}–${bin.value + 1}: ${bin.count}`}
								>
									<strong>{bin.count}</strong>
									<span
										className={bin.failing ? "failing" : ""}
										style={{
											height: `${Math.max(3, (bin.count / maxBin) * 100)}%`,
										}}
									/>
									<small>{bin.value}</small>
								</div>
							))}
						</div>
					</section>
					{!period && evolution.length > 1 && (
						<section className="results-panel results-evolution">
							<h3>Evolución por periodo</h3>
							<p>
								Eje de {fmt(low)} a {fmt(high)}
							</p>
							<svg
								viewBox="0 0 300 80"
								role="img"
								aria-label="Evolución de promedios publicados por periodo"
							>
								<polyline
									fill="none"
									stroke="var(--action)"
									strokeWidth="2"
									points={evolution
										.map(
											(p, i) =>
												`${25 + (i * 250) / (evolution.length - 1)},${65 - (((p.mean ?? 0) - low) / span) * 45}`,
										)
										.join(" ")}
								/>
								{evolution.map((p, i) => {
									const x = 25 + (i * 250) / (evolution.length - 1);
									const y = 65 - (((p.mean ?? 0) - low) / span) * 45;
									return (
										<g key={p.key}>
											<circle cx={x} cy={y} r="3" fill="var(--action)" />
											<text
												x={x}
												y={y - 8}
												textAnchor="middle"
												fontSize="11"
												fill="var(--ink)"
											>
												{fmt(p.mean)}
											</text>
										</g>
									);
								})}
							</svg>
							<ol>
								{evolution.map((p, i) => (
									<li key={p.key}>
										<span>{p.label}</span>
										<strong>{fmt(p.mean)}</strong>
										<small>
											{i > 0
												? `${signed((p.mean ?? 0) - (evolution[i - 1].mean ?? 0))} frente al periodo anterior`
												: countLabel(p.count)}
										</small>
									</li>
								))}
							</ol>
						</section>
					)}
				</div>
			</div>
			<section className="results-panel results-map">
				<h3>Mapa por grupo</h3>
				<p>Promedios publicados · {cycleName}</p>
				<ul className="results-legend" aria-label="Leyenda del mapa">
					<li>
						<span className="results-swatch fail" aria-hidden="true" />
						Reprobatorio (&lt; {number.format(rules.passing)})
					</li>
					<li>
						<span className="results-swatch near" aria-hidden="true" />
						Cerca del mínimo (&lt; {number.format(rules.passing + 1)})
					</li>
					<li>
						<span className="results-swatch good" aria-hidden="true" />
						Aprobado
					</li>
					<li>· No se imparte</li>
					<li>— Sin publicar</li>
				</ul>
				{levels
					.filter((item) => level === "Todos" || level === item)
					.map((item) => {
						const levelData = filterEvaluationLevel(scoped, item);
						const matrix = buildEvaluationMatrix(
							summarizeEvaluation(levelData, filters),
						);
						return (
							<div key={item} className="results-map-block">
								{levels.length > 1 && <h4>{item}</h4>}
								<section
									className="results-map-scroll"
									// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable matrix needs keyboard access.
									tabIndex={0}
									aria-label={`Mapa por grupo ${item}, tabla con desplazamiento horizontal`}
								>
									<table>
										<thead>
											<tr>
												<th scope="col">Grupo</th>
												{matrix.subjects.map((name) => (
													<th scope="col" key={name}>
														{name}
													</th>
												))}
												<th scope="col">Promedio</th>
											</tr>
										</thead>
										<tbody>
											{matrix.groups.map((group) => (
												<tr key={group.key}>
													<th scope="row">
														<button
															type="button"
															className="evaluation-group-link"
															aria-label={`Abrir grupo ${group.label}`}
															onClick={() => onOpenGroup(group.key)}
														>
															{group.label}
														</button>
													</th>
													{matrix.subjects.map((name) => {
														const cell = group.cells.get(name);
														const tone =
															cell?.mean == null
																? "missing"
																: cell.mean < rules.passing
																	? "fail"
																	: cell.mean < rules.passing + 1
																		? "near"
																		: "good";
														return (
															<td
																key={name}
																className={`results-cell ${tone}`}
																title={
																	cell
																		? countLabel(cell.count)
																		: "No se imparte"
																}
																aria-label={
																	cell
																		? `${name}: ${fmt(cell.mean)}, ${countLabel(cell.count)}`
																		: `${name}: No se imparte`
																}
															>
																{cell ? (
																	fmt(cell.mean)
																) : (
																	<>
																		<span aria-hidden="true">·</span>
																		<span className="evaluation-sr-only">
																			No se imparte
																		</span>
																	</>
																)}
															</td>
														);
													})}
													<td className="results-total">
														<strong>{fmt(group.mean)}</strong>
														{group.mean != null && (
															<span>
																<i
																	style={{
																		width: `${totalPosition(group.mean)}%`,
																	}}
																/>
															</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</section>
							</div>
						);
					})}
			</section>
			<details className="evaluation-method">
				<summary>Cómo se calculan los resultados</summary>
				<p>
					Cada calificación publicada tiene el mismo peso en el promedio; no se
					promedian los promedios de los grupos. Se usa su valor actual, no su
					historial de cambios.
				</p>
				<p>
					Las calificaciones faltantes no se convierten en cero. Los borradores
					quedan fuera y las escalas y los ciclos nunca se mezclan. Los conteos
					son registros de calificaciones: no representan alumnos ni cobertura.
				</p>
				<p>
					La aprobación es la proporción de calificaciones publicadas iguales o
					mayores a la calificación aprobatoria configurada en el criterio de
					riesgo.
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
	);
}
