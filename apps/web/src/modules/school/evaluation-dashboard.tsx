import { useMemo, useState } from "react";
import { EvaluationCharts } from "./evaluation-charts";
import {
	buildEvaluationData,
	buildEvaluationMatrix,
	summarizeEvaluation,
} from "./evaluation-results";
import type { State } from "./workflows";
import "./evaluation-dashboard.css";

type Props = {
	s: State;
	cycleId: string;
	onCycleChange: (id: string) => void;
	onOpenGroup: (id: string) => void;
};
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
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
		groupId: "",
	});
	const [sort, setSort] = useState("group");
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
	const groups = [
		...new Map(assignments.map((a) => [a.groupId, a.groupName])).entries(),
	].sort((a, b) => a[1].localeCompare(b[1], "es", { numeric: true }));
	const current = selection.cycle === cycleId && selection.scale === scaleKey;
	const period =
		current && periods.includes(selection.period) ? selection.period : "";
	const subject =
		current && subjects.includes(selection.subject) ? selection.subject : "";
	const groupId =
		current && groups.some(([id]) => id === selection.groupId)
			? selection.groupId
			: "";
	const report = summarizeEvaluation(data, {
		cycleId,
		scaleKey,
		period,
		subject,
		groupId,
	});
	const matrix = buildEvaluationMatrix(report);
	const sortedGroups = [...matrix.groups].sort((a, b) => {
		if (sort === "group") return 0;
		if (a.mean === null) return b.mean === null ? 0 : 1;
		if (b.mean === null) return -1;
		return sort === "highest" ? b.mean - a.mean : a.mean - b.mean;
	});
	const cycleName =
		s.cycles.find((cycle) => cycle.id === cycleId)?.name ||
		"Sin ciclo disponible";
	const publishedPeriods = [
		...new Set(
			data.records
				.filter(
					(record) =>
						record.cycleId === cycleId &&
						record.scaleKey === scaleKey &&
						(!subject || record.subject === subject) &&
						(!groupId || record.groupId === groupId),
				)
				.map((record) => record.period),
		),
	];
	function changeFilter(
		field: "period" | "subject" | "groupId",
		value: string,
	) {
		setSelection({
			cycle: cycleId,
			scale: scaleKey,
			period,
			subject,
			groupId,
			[field]: value,
		});
	}
	function resetFilters() {
		setSelection({
			cycle: cycleId,
			scale: scaleKey,
			period: "",
			subject: "",
			groupId: "",
		});
		setSort("group");
	}
	return (
		<section
			className="evaluation-dashboard"
			aria-label="Resultados académicos"
		>
			<header className="evaluation-header">
				<div>
					<h2>Resultados académicos</h2>
					<p>Solo calificaciones publicadas.</p>
				</div>
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
								groupId: "",
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
			</header>
			<div className="evaluation-context">
				<label htmlFor="evaluation-period">
					Periodo
					<select
						id="evaluation-period"
						value={period}
						disabled={!periods.length}
						onChange={(event) => changeFilter("period", event.target.value)}
					>
						<option value="">Todos los periodos</option>
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
						<option value="">Todas las materias</option>
						{subjects.map((item) => (
							<option key={item}>{item}</option>
						))}
					</select>
				</label>
				<label htmlFor="evaluation-group">
					Grupo
					<select
						id="evaluation-group"
						value={groupId}
						disabled={!groups.length}
						onChange={(event) => changeFilter("groupId", event.target.value)}
					>
						<option value="">Todos los grupos</option>
						{groups.map(([id, name]) => (
							<option key={id} value={id}>
								{name}
							</option>
						))}
					</select>
				</label>
				<label htmlFor="evaluation-sort">
					Ordenar por
					<select
						id="evaluation-sort"
						value={sort}
						onChange={(event) => setSort(event.target.value)}
					>
						<option value="group">Grupo</option>
						<option value="highest">Mayor promedio</option>
						<option value="lowest">Menor promedio</option>
					</select>
				</label>
				{(period || subject || groupId || sort !== "group") && (
					<button
						className="evaluation-reset"
						type="button"
						onClick={resetFilters}
					>
						Restablecer filtros
					</button>
				)}

				{scales.length > 1 ? (
					<label htmlFor="evaluation-scale">
						Escala
						<select
							id="evaluation-scale"
							value={scaleKey}
							onChange={(event) =>
								setSelection({
									cycle: cycleId,
									scale: event.target.value,
									period: "",
									subject: "",
									groupId: "",
								})
							}
						>
							{scales.map((item) => (
								<option key={item.key} value={item.key}>
									{item.label}
								</option>
							))}
						</select>
					</label>
				) : null}
			</div>
			<section
				className="evaluation-overview"
				aria-label="Resumen de resultados"
				aria-live="polite"
			>
				<div className="evaluation-summary-value">
					<strong className="evaluation-mean">
						{report.mean === null ? "—" : number.format(report.mean)}
					</strong>
					<div>
						<h3>Promedio publicado</h3>
						<p>
							{scale
								? `Escala ${number.format(scale.min)}–${number.format(scale.max)}`
								: "Sin escala disponible"}
						</p>
					</div>
				</div>
				<div className="evaluation-summary-context">
					<p>
						{report.byGroup.length}{" "}
						{report.byGroup.length === 1 ? "grupo" : "grupos"} ·{" "}
						{countLabel(report.count)}
					</p>
					<p>
						{period || "Todos los periodos"} · {subject || "Todas las materias"}
					</p>
					{!period && publishedPeriods.length === 1 && (
						<p>Publicaciones disponibles solo en: {publishedPeriods[0]}.</p>
					)}
				</div>
			</section>
			<section
				className="evaluation-results"
				aria-label="Consulta de resultados"
			>
				{report.count === 0 && (
					<div className="evaluation-empty" aria-live="polite">
						<h3>Sin resultados publicados</h3>
						<p>
							{data.records.some(
								(record) =>
									record.cycleId === cycleId && record.scaleKey === scaleKey,
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
				<details className="evaluation-table-detail">
					<summary>Ver tabla de resultados</summary>
					<h3 id="evaluation-results-heading">
						Resultados por grupo y materia
					</h3>
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
									<th scope="col">Promedio</th>
								</tr>
							</thead>
							<tbody>
								{sortedGroups.map((group) => (
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
										<td className="evaluation-total">
											<strong>
												<ResultValue value={group.mean} />
											</strong>
											<small>{countLabel(group.count)}</small>
										</td>
									</tr>
								))}
								{!sortedGroups.length && (
									<tr>
										<td colSpan={matrix.subjects.length + 2}>
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
						Cada calificación publicada tiene el mismo peso en el promedio; no
						se promedian los promedios de los grupos. Se usa su valor actual, no
						su historial de cambios.
					</p>
					<p>
						Las calificaciones faltantes no se convierten en cero. Los
						borradores quedan fuera y las escalas y los ciclos nunca se mezclan.
						Los conteos son registros de calificaciones: no representan alumnos
						ni cobertura.
					</p>
					<p>
						Los filtros se aplican a las gráficas y a la tabla. Con todos los
						periodos seleccionados, cada materia reúne sus calificaciones
						publicadas de esos periodos. Abrir un grupo lleva a su sección de
						calificaciones, no a una materia o evaluación específica.
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
