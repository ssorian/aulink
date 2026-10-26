import { useId } from "react";
import type { EvaluationBucket, EvaluationScale } from "./evaluation-results";
import "./evaluation-charts.css";

type EvaluationChartsProps = {
	groups: EvaluationBucket[];
	subjects: EvaluationBucket[];
	scale: EvaluationScale | undefined;
	mean: number | null;
	onOpenGroup: (id: string) => void;
};

const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const published = (count: number) =>
	`${count} ${count === 1 ? "calificación publicada" : "calificaciones publicadas"}`;

export function EvaluationCharts({
	groups,
	subjects,
	scale,
	mean,
	onOpenGroup,
}: EvaluationChartsProps) {
	const id = useId();
	const validScale =
		scale &&
		Number.isFinite(scale.min) &&
		Number.isFinite(scale.max) &&
		scale.max > scale.min;
	const position = (value: number) =>
		validScale
			? Math.max(
					0,
					Math.min(100, ((value - scale.min) / (scale.max - scale.min)) * 100),
				)
			: 0;
	const ticks = validScale
		? Array.from({ length: 5 }, (_, index) => ({
				value:
					index === 0
						? String(scale.min)
						: index === 4
							? String(scale.max)
							: number.format(
									scale.min + ((scale.max - scale.min) * index) / 4,
								),
				percent: index * 25,
			}))
		: [];
	const scaleDescription = validScale
		? `Escala de ${scale.min} a ${scale.max}.${scale.min !== 0 ? ` El eje comienza en ${scale.min}, no en cero.` : ""}`
		: "No hay una escala disponible para graficar.";
	return (
		<div className="evaluation-charts">
			<section
				className="evaluation-chart-panel"
				aria-labelledby="evaluation-group-chart"
			>
				<header className="evaluation-chart-header">
					<div>
						<h3 id="evaluation-group-chart">Promedio por grupo</h3>
						<p>{scaleDescription}</p>
					</div>
					{validScale && mean !== null && (
						<p className="evaluation-chart-legend">
							<span aria-hidden="true" />
							Promedio general: <strong>{number.format(mean)}</strong>
						</p>
					)}
				</header>
				{groups.length === 0 ? (
					<p className="evaluation-chart-empty">
						No hay grupos para esta selección.
					</p>
				) : (
					<>
						<p className="evaluation-chart-hint" id={`${id}-scroll`}>
							Abre un grupo desde su nombre. Desplaza la gráfica si no caben
							todos.
						</p>
						<section
							className="evaluation-chart-scroll"
							aria-label="Gráfica de columnas por grupo"
							aria-describedby={`${id}-scroll`}
							// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable chart needs keyboard arrow access.
							tabIndex={0}
						>
							<div
								className="evaluation-group-chart"
								style={{
									minWidth: `${Math.max(420, groups.length * 116 + 52)}px`,
								}}
							>
								<div className="evaluation-group-grid" aria-hidden="true">
									{ticks.map((tick) => (
										<div
											className="evaluation-group-tick"
											key={tick.percent}
											style={{ bottom: `${tick.percent}%` }}
										>
											<span>{tick.value}</span>
										</div>
									))}
									{validScale && mean !== null && (
										<div
											className="evaluation-mean-line"
											style={{ bottom: `${position(mean)}%` }}
										/>
									)}
								</div>
								<div
									className="evaluation-group-columns"
									style={{
										gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`,
									}}
								>
									{groups.map((group) => (
										<div className="evaluation-group-column" key={group.key}>
											<div className="evaluation-column-plot">
												{group.mean === null ? (
													<div className="evaluation-column-missing">
														<strong>—</strong>
														<span>Sin resultados publicados</span>
													</div>
												) : (
													<>
														{validScale && (
															<div
																className="evaluation-column-bar"
																aria-hidden="true"
																style={{ height: `${position(group.mean)}%` }}
															/>
														)}
														<strong
															className="evaluation-column-value"
															style={{ bottom: `${position(group.mean)}%` }}
														>
															<span className="evaluation-chart-sr">
																Promedio:{" "}
															</span>
															{number.format(group.mean)}
														</strong>
													</>
												)}
											</div>
											<button
												type="button"
												className="evaluation-group-link"
												aria-label={`Abrir grupo ${group.label}`}
												onClick={() => onOpenGroup(group.key)}
											>
												{group.label}
											</button>
											<small className="evaluation-chart-count">
												{published(group.count)}
											</small>
										</div>
									))}
								</div>
							</div>
						</section>
					</>
				)}
			</section>
			<section
				className="evaluation-chart-panel"
				aria-labelledby="evaluation-subject-chart"
			>
				<header className="evaluation-chart-header">
					<div>
						<h3 id="evaluation-subject-chart">Promedio por materia</h3>
						<p>{scaleDescription}</p>
					</div>
				</header>
				{subjects.length === 0 ? (
					<p className="evaluation-chart-empty">
						No hay materias para esta selección.
					</p>
				) : (
					<div className="evaluation-subject-chart">
						<div className="evaluation-subject-axis" aria-hidden="true">
							{ticks.map((tick) => (
								<span key={tick.percent} style={{ left: `${tick.percent}%` }}>
									{tick.value}
								</span>
							))}
						</div>
						{subjects.map((subject) => (
							<div className="evaluation-subject-row" key={subject.key}>
								<div className="evaluation-subject-label">
									<strong>{subject.label}</strong>
									<small className="evaluation-chart-count">
										{published(subject.count)}
									</small>
								</div>
								<div className="evaluation-subject-plot">
									<div className="evaluation-subject-grid" aria-hidden="true">
										{ticks.map((tick) => (
											<span
												key={tick.percent}
												style={{ left: `${tick.percent}%` }}
											/>
										))}
									</div>
									{subject.mean === null ? (
										<span className="evaluation-subject-missing">
											— Sin resultados publicados
										</span>
									) : (
										<>
											{validScale && (
												<div
													className="evaluation-subject-bar"
													aria-hidden="true"
													style={{ width: `${position(subject.mean)}%` }}
												/>
											)}
											<strong className="evaluation-subject-value">
												<span className="evaluation-chart-sr">Promedio: </span>
												{number.format(subject.mean)}
											</strong>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
