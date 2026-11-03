import { useState } from "react";
import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import type { EvaluationRules } from "./evaluation-operations";
import { Select } from "./evaluation-progress";
import {
	buildEvaluationMatrix,
	type EvaluationData,
	summarizeEvaluation,
} from "./evaluation-results";
import type { State } from "./workflows";
import "./group-tables.css";

type Filter = "period" | "groupId" | "subject" | "grade";
type Props = {
	data: EvaluationData;
	cycleId: string;
	cycleName: string;
	period: string;
	subject: string;
	groupId: string;
	grade?: string;
	options: {
		periods: string[];
		grades: string[];
		groups: State["groups"];
		subjects: string[];
	};
	onFilter: (field: Filter, value: string) => void;
	rules: EvaluationRules;
	onOpenGroup: (id: string) => void;
};
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

export function EvaluationResultsView({
	data,
	cycleId,
	cycleName,
	period,
	subject,
	groupId,
	grade = "",
	options,
	onFilter,
	rules,
	onOpenGroup,
}: Props) {
	const [selectedScale, setSelectedScale] = useState("");
	const scales = data.scales.filter((scale) =>
		data.assignments.some(
			(a) => a.cycleId === cycleId && a.scaleKey === scale.key,
		),
	);
	const scale = scales.find((item) => item.key === selectedScale) || scales[0];
	const scaleKey = scale?.key || "";
	const validGroup = options.groups.some((g) => g.id === groupId)
		? groupId
		: "";
	// Grade narrows the published data before any aggregate is computed.
	const scoped: EvaluationData = grade
		? {
				...data,
				assignments: data.assignments.filter((a) => a.grade === grade),
				records: data.records.filter((r) => r.grade === grade),
			}
		: data;
	const filters = {
		cycleId,
		scaleKey,
		period,
		subject,
		groupId: validGroup,
	};
	const report = summarizeEvaluation(scoped, filters);
	const matrix = buildEvaluationMatrix(report);
	const records = scoped.records.filter(
		(r) =>
			r.cycleId === cycleId &&
			r.scaleKey === scaleKey &&
			(!period || r.period === period) &&
			(!subject || r.subject === subject) &&
			(!validGroup || r.groupId === validGroup),
	);
	const failures = records.filter((r) => r.value < rules.passing).length;
	const approval = records.length
		? (records.length - failures) / records.length
		: null;
	// Evolution follows every filter except the term, so terms stay comparable.
	const evolution = summarizeEvaluation(scoped, {
		...filters,
		period: "",
	}).byPeriod.filter((p) => p.mean != null);
	const lowest = matrix.groups
		.filter((g) => g.mean != null)
		.sort((a, b) => (a.mean ?? 0) - (b.mean ?? 0))
		.slice(0, 5);
	const position = (value: number) =>
		scale
			? Math.max(
					0,
					Math.min(100, ((value - scale.min) / (scale.max - scale.min)) * 100),
				)
			: 0;
	const tone = (mean: number | null) =>
		mean == null
			? "missing"
			: mean < rules.passing
				? "fail"
				: mean < rules.passing + 1
					? "near"
					: "good";
	const empty = !report.rows.length;
	return (
		<section
			className="evaluation-progress evaluation-results"
			aria-label="Resultados publicados"
		>
			<header className="progress-heading">
				<div>
					<h2>Resultados de {period || "todo el ciclo"}</h2>
					<p>
						{scale ? scale.label : "Sin escala"} · {cycleName}
					</p>
				</div>
				{scales.length > 1 && (
					<label htmlFor="evaluation-scale" className="progress-filter">
						<span>Escala</span>
						<select
							id="evaluation-scale"
							value={scaleKey}
							onChange={(e) => setSelectedScale(e.target.value)}
						>
							{scales.map((item) => (
								<option key={item.key} value={item.key}>
									{item.label.replace(/^Escala /, "")}
								</option>
							))}
						</select>
					</label>
				)}
			</header>
			<div className="progress-layout">
				<div className="progress-main">
					<section
						className="progress-card progress-stats results-stats"
						aria-label="Resumen de resultados"
					>
						<dl>
							<div data-state="groups">
								<dt>Promedio general</dt>
								<dd>
									<strong className="evaluation-mean">
										{fmt(report.mean)}
									</strong>
									<span>{countLabel(report.count)}</span>
								</dd>
							</div>
							<div data-state="published">
								<dt>Aprobación</dt>
								<dd>
									<strong>
										{approval == null ? "—" : percent.format(approval)}
									</strong>
									<span>mínimo {number.format(rules.passing)}</span>
								</dd>
							</div>
							<div data-state="missing">
								<dt>Reprobatorias</dt>
								<dd>
									<strong>{failures}</strong>
									<span>de {records.length}</span>
								</dd>
							</div>
						</dl>
						{evolution.length > 1 && (
							<p className="results-evolution">
								{evolution.map((p, index) => (
									<span key={p.key}>
										{index > 0 && <span aria-hidden="true"> → </span>}
										{p.label} <strong>{fmt(p.mean)}</strong>
									</span>
								))}
							</p>
						)}
					</section>
					<div className="progress-filters">
						<Select
							id="results-grade"
							label="Grado"
							value={grade}
							all="Todos"
							items={options.grades.map((g) => ({ value: g, label: g }))}
							onChange={(v) => onFilter("grade", v)}
						/>
						<Select
							id="results-group"
							label="Grupo"
							value={validGroup}
							all="Todos"
							items={options.groups.map((g) => ({
								value: g.id,
								label: g.name,
							}))}
							onChange={(v) => onFilter("groupId", v)}
						/>
						<Select
							id="results-period"
							label="Trimestre"
							value={period}
							all="Todo el ciclo"
							items={options.periods.map((p) => ({ value: p, label: p }))}
							onChange={(v) => onFilter("period", v)}
						/>
						<Select
							id="results-subject"
							label="Materia"
							value={subject}
							all="Todas"
							items={options.subjects.map((x) => ({ value: x, label: x }))}
							onChange={(v) => onFilter("subject", v)}
						/>
					</div>
					<ul
						className="grades-legend results-legend"
						aria-label="Leyenda de promedios"
					>
						<li data-tone="fail">
							Reprobatorio (&lt; {number.format(rules.passing)})
						</li>
						<li data-tone="near">
							Cerca del mínimo (&lt; {number.format(rules.passing + 1)})
						</li>
						<li data-tone="good">Aprobado</li>
					</ul>
					<DataTable
						caption={`Promedio publicado por grupo y materia · ${cycleName}`}
						variant="card"
						scrollClassName="grades-scroll progress-scroll results-scroll"
						scrollLabel="Promedio por grupo y materia"
					>
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
							{empty && (
								<EmptyTableRow columns={matrix.subjects.length + 2}>
									<strong>Sin resultados publicados</strong>
									<br />
									Publica calificaciones desde el espacio de un grupo para
									verlas aquí.
								</EmptyTableRow>
							)}
							{matrix.groups.map((group) => (
								<tr key={group.key}>
									<th scope="row">
										<button
											type="button"
											className="progress-group-link"
											aria-label={`Abrir grupo ${group.label}`}
											onClick={() => onOpenGroup(group.key)}
										>
											{group.label}
										</button>
									</th>
									{matrix.subjects.map((name) => {
										const cell = group.cells.get(name);
										if (!cell)
											return (
												<td key={name} aria-label={`${name}: No se imparte`}>
													<span className="grade-none" />
													<span className="evaluation-sr-only">
														No se imparte
													</span>
												</td>
											);
										return (
											<td
												key={name}
												title={
													cell.count ? countLabel(cell.count) : "Sin publicar"
												}
												aria-label={`${name}: ${cell.count ? fmt(cell.mean) : "Sin publicar"}, ${countLabel(cell.count)}`}
											>
												<span
													className="results-value"
													data-tone={tone(cell.mean)}
												>
													{fmt(cell.mean)}
												</span>
											</td>
										);
									})}
									<td>
										<strong
											className="results-total"
											data-tone={tone(group.mean)}
										>
											{fmt(group.mean)}
										</strong>
									</td>
								</tr>
							))}
						</tbody>
					</DataTable>
					<details className="evaluation-method">
						<summary>Cómo se calculan los resultados</summary>
						<p>
							Cada calificación publicada pesa igual; no se promedian los
							promedios de los grupos. Las faltantes no cuentan como cero, los
							borradores quedan fuera y las escalas nunca se mezclan. Los
							conteos son registros de calificaciones: no representan alumnos ni
							cobertura.
						</p>
					</details>
					{(data.diagnostics.excluded > 0 ||
						data.diagnostics.duplicates > 0) && (
						<p className="evaluation-diagnostics">
							Diagnóstico global de los datos guardados (todos los ciclos y
							escalas): {data.diagnostics.excluded} registros publicados
							excluidos por datos inválidos o referencias incompletas;{" "}
							{data.diagnostics.duplicates} duplicados válidos contados por
							separado.
						</p>
					)}
				</div>
				<aside
					className="progress-card results-groups"
					aria-labelledby="results-groups-title"
				>
					<h3 id="results-groups-title">Grupos con menor promedio</h3>
					{lowest.length ? (
						<ol>
							{lowest.map((group) => (
								<li key={group.key}>
									<button
										type="button"
										className="progress-group-link"
										onClick={() => onOpenGroup(group.key)}
									>
										{group.label}
									</button>
									<strong data-tone={tone(group.mean)}>
										{fmt(group.mean)}
									</strong>
									<span className="results-bar" aria-hidden="true">
										<i
											data-tone={tone(group.mean)}
											style={{ width: `${position(group.mean ?? 0)}%` }}
										/>
									</span>
								</li>
							))}
						</ol>
					) : (
						<p>Aún no hay promedios publicados.</p>
					)}
				</aside>
			</div>
		</section>
	);
}
