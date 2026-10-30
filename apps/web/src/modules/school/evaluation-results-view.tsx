import { useState } from "react";
import { EvaluationCharts } from "./evaluation-charts";
import type { EvaluationRules } from "./evaluation-operations";
import {
	buildEvaluationMatrix,
	type EvaluationData,
	summarizeEvaluation,
} from "./evaluation-results";

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
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("es-MX", {
	style: "percent",
	maximumFractionDigits: 0,
});
const countLabel = (count: number) =>
	`${count} ${count === 1 ? "calificación publicada" : "calificaciones publicadas"}`;
function ResultValue({ value }: { value: number | null | undefined }) {
	return value == null ? (
		<span>
			<span aria-hidden="true">—</span>
			<span className="evaluation-sr-only">Sin resultados publicados</span>
		</span>
	) : (
		number.format(value)
	);
}

/** Published results only: this is the same information families can consult. */
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
	const [sort, setSort] = useState("group");
	const scales = data.scales.filter((scale) =>
		data.assignments.some(
			(a) => a.cycleId === cycleId && a.scaleKey === scale.key,
		),
	);
	const scale = scales.find((item) => item.key === selectedScale) || scales[0];
	const scaleKey = scale?.key || "";
	const filters = { cycleId, scaleKey, period, subject, groupId };
	const report = summarizeEvaluation(data, filters);
	const matrix = buildEvaluationMatrix(report);
	const records = data.records.filter(
		(r) =>
			r.cycleId === cycleId &&
			r.scaleKey === scaleKey &&
			(!period || r.period === period) &&
			(!subject || r.subject === subject) &&
			(!groupId || r.groupId === groupId),
	);
	const passRate = (groupKey?: string) => {
		const scoped = records.filter((r) => !groupKey || r.groupId === groupKey);
		return scoped.length
			? scoped.filter((r) => r.value >= rules.passing).length / scoped.length
			: null;
	};
	const sortedGroups = [...matrix.groups].sort((a, b) => {
		if (sort === "group") return 0;
		if (a.mean === null) return b.mean === null ? 0 : 1;
		if (b.mean === null) return -1;
		return sort === "highest" ? b.mean - a.mean : a.mean - b.mean;
	});
	const publishedPeriods = [
		...new Set(
			data.records
				.filter(
					(r) =>
						r.cycleId === cycleId &&
						r.scaleKey === scaleKey &&
						(!subject || r.subject === subject) &&
						(!groupId || r.groupId === groupId),
				)
				.map((r) => r.period),
		),
	];
	const evolution = report.byPeriod.filter((item) => item.count > 0);
	const overallPass = passRate();
	return (
		<section className="evaluation-results" aria-label="Resultados publicados">
			<header className="evaluation-section-heading">
				<div>
					<h2>Resultados publicados</h2>
					<p>
						Lo mismo que consultan las familias. Los borradores no se incluyen.
					</p>
				</div>
				<div className="evaluation-inline-controls">
					{scales.length > 1 && (
						<label htmlFor="evaluation-scale">
							Escala
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
					<label htmlFor="evaluation-sort">
						Ordenar grupos
						<select
							id="evaluation-sort"
							value={sort}
							onChange={(event) => setSort(event.target.value)}
						>
							<option value="group">Por nombre</option>
							<option value="highest">Mayor promedio</option>
							<option value="lowest">Menor promedio</option>
						</select>
					</label>
				</div>
			</header>
			<dl
				className="evaluation-kpis"
				aria-label="Resumen de resultados"
				aria-live="polite"
			>
				<div>
					<dt>Promedio publicado</dt>
					<dd>
						<strong className="evaluation-mean">
							{report.mean === null ? "—" : number.format(report.mean)}
						</strong>
						<small>
							{scale
								? `Escala ${number.format(scale.min)}–${number.format(scale.max)}`
								: "Sin escala disponible"}
						</small>
					</dd>
				</div>
				<div>
					<dt>Aprobación</dt>
					<dd>
						<strong>
							{overallPass === null ? "—" : percent.format(overallPass)}
						</strong>
						<small>
							Calificaciones de {number.format(rules.passing)} o más
						</small>
					</dd>
				</div>
				<div>
					<dt>Calificaciones publicadas</dt>
					<dd>
						<strong>{report.count}</strong>
						<small>
							{report.byGroup.length}{" "}
							{report.byGroup.length === 1 ? "grupo" : "grupos"}
							{!period && publishedPeriods.length === 1
								? ` · solo en ${publishedPeriods[0]}`
								: ""}
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
			<EvaluationCharts
				groups={sortedGroups}
				subjects={matrix.bySubject}
				scale={scale}
				mean={report.mean}
				onOpenGroup={onOpenGroup}
			/>
			{!period && evolution.length > 1 && (
				<section
					className="evaluation-evolution"
					aria-labelledby="evaluation-evolution-title"
				>
					<h3 id="evaluation-evolution-title">Evolución por periodo</h3>
					<ol>
						{evolution.map((item, index) => {
							const previous = evolution[index - 1]?.mean;
							const change =
								previous == null || item.mean == null
									? null
									: item.mean - previous;
							return (
								<li key={item.key}>
									<span>{item.label}</span>
									<strong>
										<ResultValue value={item.mean} />
									</strong>
									<small>
										{countLabel(item.count)}
										{change !== null &&
											` · ${change >= 0 ? "+" : "−"}${number.format(Math.abs(change))} frente al periodo anterior`}
									</small>
								</li>
							);
						})}
					</ol>
				</section>
			)}
			<details className="evaluation-table-detail">
				<summary>Ver tabla de resultados</summary>
				<h3 id="evaluation-results-heading">Resultados por grupo y materia</h3>
				<p className="evaluation-matrix-note">
					{period || "Todos los periodos, ponderados por calificaciones"} · —
					Sin resultados publicados
				</p>
				<section
					className="evaluation-table-scroll"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable matrix needs keyboard access.
					tabIndex={0}
					aria-label="Resultados por grupo, tabla con desplazamiento horizontal"
				>
					<table>
						<caption className="evaluation-sr-only">
							Promedios publicados · {cycleName} ·{" "}
							{scale?.label || "Sin escala disponible"}
						</caption>
						<thead>
							<tr>
								<th scope="col">Grupo</th>
								{matrix.subjects.map((item) => (
									<th scope="col" key={item}>
										{item}
									</th>
								))}
								<th scope="col">Aprobación</th>
								<th scope="col">Promedio</th>
							</tr>
						</thead>
						<tbody>
							{sortedGroups.map((group) => {
								const rate = passRate(group.key);
								return (
									<tr key={group.key}>
										<th scope="row">
											<button
												type="button"
												className="evaluation-group-link"
												onClick={() => onOpenGroup(group.key)}
												aria-label={`Abrir grupo ${group.label}`}
											>
												{group.label}
											</button>
										</th>
										{matrix.subjects.map((item) => (
											<td
												key={item}
												title={countLabel(group.cells.get(item)?.count || 0)}
											>
												<ResultValue value={group.cells.get(item)?.mean} />
											</td>
										))}
										<td>{rate === null ? "—" : percent.format(rate)}</td>
										<td className="evaluation-total">
											<strong>
												<ResultValue value={group.mean} />
											</strong>
											<small>{countLabel(group.count)}</small>
										</td>
									</tr>
								);
							})}
							{!sortedGroups.length && (
								<tr>
									<td colSpan={matrix.subjects.length + 3}>
										No hay asignaciones para esta selección.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
				<div className="evaluation-mobile-groups">
					{sortedGroups.map((group) => (
						<details key={group.key}>
							<summary>
								<span>{group.label}</span>
								<strong>
									Promedio <ResultValue value={group.mean} />
								</strong>
							</summary>
							<dl>
								{matrix.subjects.map((item) => (
									<div key={item}>
										<dt>{item}</dt>
										<dd>
											<ResultValue value={group.cells.get(item)?.mean} />
											<small>
												{countLabel(group.cells.get(item)?.count || 0)}
											</small>
										</dd>
									</div>
								))}
							</dl>
							<button
								type="button"
								className="evaluation-group-link"
								onClick={() => onOpenGroup(group.key)}
							>
								Abrir grupo {group.label}
							</button>
						</details>
					))}
				</div>
			</details>
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
