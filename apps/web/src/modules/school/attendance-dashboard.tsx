import { useMemo, useState } from "react";
import { summarizeAttendance } from "./attendance-summary";
import { schoolToday } from "./schedule-helpers";
import type { State } from "./workflows";
import "./attendance-dashboard.css";

const percent = (value: number | null) =>
	value === null
		? "—"
		: `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(value)} %`;
const dayLabel = (date: string) =>
	new Intl.DateTimeFormat("es-MX", {
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	}).format(new Date(`${date}T12:00:00Z`));
export function AttendanceDashboard({
	s,
	onOpenGroup,
}: {
	s: State;
	onOpenGroup: (id: string, period?: { date: string; mode: string }) => void;
}) {
	const today = schoolToday(s.school.timezone);
	const [cycleId, setCycle] = useState(() => {
		const active = s.cycles.find(
			(c) =>
				c.startDate && c.endDate && c.startDate <= today && c.endDate >= today,
		);
		if (active) return active.id;
		const withRecords = s.cycles
			.map((c) => ({
				id: c.id,
				latest: summarizeAttendance(s, {
					cycle: c.id,
					date: today,
					mode: "Semana",
					today,
				}).latestDate,
			}))
			.filter((c) => c.latest)
			.sort((a, b) => b.latest!.localeCompare(a.latest!));
		return withRecords[0]?.id || s.cycles[0]?.id || "";
	});
	const cycle = s.cycles.some((c) => c.id === cycleId)
		? cycleId
		: s.cycles[0]?.id || "";
	const initialDate = (selectedCycle: string) => {
		const current = summarizeAttendance(s, {
			cycle: selectedCycle,
			date: today,
			mode: "Semana",
			today,
		});
		return current.total.recorded ? today : current.latestDate || today;
	};
	const [date, setDate] = useState(() => initialDate(cycle));
	const [mode, setMode] = useState("Semana");
	const [grade, setGrade] = useState("");
	const [shift, setShift] = useState("");
	const [sort, setSort] = useState("name");
	const report = useMemo(
		() => summarizeAttendance(s, { cycle, date, mode, today, grade, shift }),
		[s, cycle, date, mode, today, grade, shift],
	);
	const groups = [...report.groups].sort((a, b) =>
		sort === "lowest"
			? (a.rate ?? Infinity) - (b.rate ?? Infinity) ||
				a.name.localeCompare(b.name, "es", { numeric: true })
			: a.name.localeCompare(b.name, "es", { numeric: true }),
	);
	const cycleGroups = s.groups.filter((g) => g.cycle === cycle);
	const choices = (field: "grade" | "shift") =>
		[
			...new Set(
				cycleGroups
					.map((g) => (field === "shift" ? g.shift || s.school.shift : g.grade))
					.filter((v): v is string => !!v),
			),
		].sort();
	const total = report.total;
	const periodLabel = report.days.length
		? `${dayLabel(report.days[0].date)}${report.days.length > 1 ? ` – ${dayLabel(report.days.at(-1)!.date)}` : ""}`
		: "Sin fechas consultables";
	const consultDay = (day: string) => {
		setDate(day);
		setMode("Día");
		onOpenGroup("");
	};
	return (
		<div className="attendance-dashboard">
			<section
				className="panel attendance-overview"
				aria-label="Panorama de asistencia escolar"
			>
				<header className="attendance-overview-heading">
					<h2>Panorama escolar</h2>
					<span>
						{report.groups.length}{" "}
						{report.groups.length === 1 ? "grupo" : "grupos"} · {periodLabel}
					</span>
				</header>
				<div
					className="attendance-controls"
					role="group"
					aria-label="Filtros de asistencia escolar"
				>
					<label>
						Ciclo escolar
						<select
							value={cycle}
							onChange={(e) => {
								setCycle(e.target.value);
								setDate(initialDate(e.target.value));
								setGrade("");
								setShift("");
								onOpenGroup("");
							}}
						>
							<option value="" disabled>
								Selecciona un ciclo
							</option>
							{s.cycles.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
					</label>
					<label>
						Periodo
						<select
							value={mode}
							onChange={(e) => {
								setMode(e.target.value);
								onOpenGroup("");
							}}
						>
							{["Día", "Semana", "Mes"].map((m) => (
								<option key={m}>{m}</option>
							))}
						</select>
					</label>
					<label>
						Fecha de referencia
						<input
							type="date"
							value={date}
							onChange={(e) => {
								setDate(e.target.value);
								onOpenGroup("");
							}}
						/>
					</label>
					<label>
						Grado
						<select
							value={grade}
							onChange={(e) => {
								setGrade(e.target.value);
								onOpenGroup("");
							}}
						>
							<option value="">Todos los grados</option>
							{choices("grade").map((g) => (
								<option key={g}>{g}</option>
							))}
						</select>
					</label>
					<label>
						Turno
						<select
							value={shift}
							onChange={(e) => {
								setShift(e.target.value);
								onOpenGroup("");
							}}
						>
							<option value="">Todos los turnos</option>
							{choices("shift").map((g) => (
								<option key={g}>{g}</option>
							))}
						</select>
					</label>
				</div>
				<dl
					className="attendance-kpis"
					aria-label="Resumen de asistencia"
					aria-live="polite"
				>
					<div>
						<dt>Asistencia confirmada</dt>
						<dd>
							{percent(total.rate)}
							<small>
								{total.recorded
									? `${total.present} asistencias · ${total.present + total.absent} confirmados`
									: "Sin registros en el periodo"}
							</small>
						</dd>
					</div>
					<div>
						<dt>Faltas confirmadas</dt>
						<dd>
							{total.absent}
							<small>Solo inasistencias explícitas</small>
						</dd>
					</div>
					<div>
						<dt>Por revisar</dt>
						<dd>
							{total.review}
							<small>Alumno-días sin clasificar</small>
						</dd>
					</div>
					<div>
						<dt>Cobertura de clasificación</dt>
						<dd>
							{percent(total.coverage)}
							<small>
								{total.recorded
									? `${total.present + total.absent} de ${total.recorded} alumno-días con registros`
									: "Aún no calculable"}
							</small>
						</dd>
					</div>
				</dl>
			</section>
			<div className="attendance-analysis">
				<section
					className="panel attendance-evolution"
					aria-labelledby="attendance-trend-title"
				>
					<header className="attendance-section-heading">
						<div>
							<h2 id="attendance-trend-title">Evolución de asistencia</h2>
							<p>{periodLabel} · sobre registros confirmados</p>
						</div>
						<span className="attendance-legend">
							<i aria-hidden="true" />
							Asistencia
						</span>
					</header>
					{total.rate === null ? (
						<div className="attendance-empty">
							<h3>Sin registros confirmados</h3>
							<p>
								{total.review
									? `Hay ${total.review} alumno-días por revisar. Consulta el grupo para ver su evidencia.`
									: "No hay lecturas de asistencia en este periodo. Esto no significa que los alumnos hayan faltado."}
							</p>
							{report.latestDate &&
								!report.days.some((d) => d.date === report.latestDate) && (
									<button
										type="button"
										onClick={() => {
											setDate(report.latestDate!);
											onOpenGroup("");
										}}
									>
										Ver último periodo con registros{" "}
										<span>· {dayLabel(report.latestDate)}</span>
									</button>
								)}
						</div>
					) : (
						<>
							<div
								className="attendance-chart"
								aria-label="Asistencia diaria, escala de 0 a 100 por ciento"
							>
								<div className="attendance-axis" aria-hidden="true">
									<span>100 %</span>
									<span>50 %</span>
									<span>0 %</span>
								</div>
								<div className="attendance-plot">
									<div className="attendance-gridlines" aria-hidden="true">
										<span />
										<span />
										<span />
									</div>
									{report.days.map((day) => (
										<button
											type="button"
											className="attendance-day"
											key={day.date}
											onClick={() => consultDay(day.date)}
											title={`${dayLabel(day.date)} · ${day.rate === null ? "Sin registros confirmados" : percent(day.rate)}`}
											aria-label={`${dayLabel(day.date)}: ${day.rate === null ? "sin registros confirmados" : percent(day.rate)}; ${day.present} asistencias, ${day.absent} faltas, ${day.review} por revisar. Consultar día`}
										>
											<span className="attendance-bar-space" aria-hidden="true">
												{day.rate !== null ? (
													<span
														className="attendance-bar"
														style={{ height: `${day.rate}%` }}
													>
														{report.days.length <= 7 && (
															<strong>{percent(day.rate)}</strong>
														)}
														{day.rate === 0 && <i />}
													</span>
												) : (
													<span className="attendance-missing">—</span>
												)}
											</span>
										</button>
									))}
								</div>
								<div className="attendance-date-axis" aria-hidden="true">
									<span>{dayLabel(report.days[0].date)}</span>
									{report.days.length > 2 && (
										<span>
											{dayLabel(
												report.days[Math.floor(report.days.length / 2)].date,
											)}
										</span>
									)}
									{report.days.length > 1 && (
										<span>{dayLabel(report.days.at(-1)!.date)}</span>
									)}
								</div>
							</div>
							<div className="attendance-chart-footer">
								<span>Sin lecturas ≠ falta</span>
								<label>
									Consultar día
									<select value="" onChange={(e) => consultDay(e.target.value)}>
										<option value="" disabled>
											Seleccionar fecha
										</option>
										{report.days.map((d) => (
											<option key={d.date} value={d.date}>
												{dayLabel(d.date)} ·{" "}
												{d.rate === null ? "Sin confirmar" : percent(d.rate)}
											</option>
										))}
									</select>
								</label>
							</div>
						</>
					)}
				</section>
				<section
					className="panel attendance-groups"
					aria-labelledby="attendance-groups-title"
				>
					<header className="attendance-section-heading">
						<div>
							<h2 id="attendance-groups-title">Asistencia por grupo</h2>
							<p>
								Porcentaje confirmado · selecciona una barra para ver alumnos.
							</p>
						</div>
					</header>
					<label className="attendance-sort">
						Ordenar
						<select value={sort} onChange={(e) => setSort(e.target.value)}>
							<option value="name">Nombre del grupo</option>
							<option value="lowest">Menor asistencia primero</option>
						</select>
					</label>
					{total.rate !== null ? (
						<div
							className="attendance-group-chart"
							aria-label="Gráfica de barras de asistencia por grupo, escala de cero a cien por ciento"
						>
							<div className="attendance-group-scale" aria-hidden="true">
								<span>0 %</span>
								<span>50 %</span>
								<span>100 %</span>
							</div>
							<div className="attendance-group-bars">
								{groups.map((g) => (
									<button
										type="button"
										className="attendance-group-bar-row"
										key={g.id}
										onClick={() => onOpenGroup(g.id, { date, mode })}
										aria-label={`Ver alumnos de ${g.name}`}
										title={`${g.name}: ${g.rate === null ? "Sin registros confirmados" : percent(g.rate)}; ${g.absent} faltas, ${g.review} por revisar; ${g.present + g.absent} de ${g.recorded} alumno-días clasificados`}
									>
										<span className="attendance-group-name">{g.name}</span>
										<span
											className="attendance-group-bar-lane"
											aria-hidden="true"
										>
											{g.rate !== null ? (
												<span style={{ width: `${g.rate}%` }} />
											) : (
												<span className="attendance-no-value">
													Sin registros confirmados
												</span>
											)}
										</span>
										<strong>{percent(g.rate)}</strong>
									</button>
								))}
							</div>
						</div>
					) : (
						<div className="attendance-empty attendance-group-empty">
							<h3>Sin porcentajes para comparar</h3>
							<p>
								Selecciona un periodo con registros confirmados para ver las
								barras de cada grupo.
							</p>
						</div>
					)}
					<details className="attendance-group-details">
						<summary>Consultar registros por grupo</summary>
						<div>
							{groups.map((g) => (
								<button
									type="button"
									key={g.id}
									onClick={() => onOpenGroup(g.id, { date, mode })}
									aria-label={`Consultar registros de ${g.name}`}
								>
									{g.name} · {g.absent} faltas · {g.review} por revisar
								</button>
							))}
						</div>
					</details>
					{!groups.length && (
						<p className="attendance-no-groups">
							No hay grupos para estos filtros. Selecciona otro ciclo, grado o
							turno.
						</p>
					)}
				</section>
			</div>
			<details className="attendance-method">
				<summary>Cómo se calculan estos indicadores</summary>
				<p>
					Asistencias ÷ (asistencias + faltas explícitas). Una entrada válida
					cuenta como asistencia, aunque falte la salida. Cada alumno cuenta una
					vez por día en el total escolar. Los casos contradictorios quedan por
					revisar.
				</p>
				<p>
					La cobertura mide registros clasificables, no el total de asistencia
					esperada. No hay fechas históricas de inscripción para calcular ese
					total con precisión. Sin lecturas no significa falta. Se excluyen
					fechas futuras, excepciones sin clases y días fuera de los límites
					conocidos del ciclo. Los feriados del calendario son anotaciones
					visuales; no cancelan clases por sí solos. Tampoco se supone que todo
					fin de semana sea inhábil.
				</p>
				<p>
					Solo se incluyen registros con alumno, grupo y ciclo identificados.
					Los ajustes y justificaciones de texto libre conservan su evidencia
					original y no cambian automáticamente los porcentajes.
				</p>
			</details>
		</div>
	);
}
