import { useState } from "react";
import { summarizeAttendance } from "./experience";
import { SAMPLE_DATE } from "./mock-data";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function AttendanceView({
	s,
	open,
	studentName,
}: Pick<ViewProps, "s" | "open" | "studentName">) {
	const [date, setDate] = useState("");
	const [student, setStudent] = useState("");
	const events = s.events.filter(
		(e) => (!date || e.date === date) && (!student || e.student === student),
	);
	const summary = summarizeAttendance(events, s.adjustments);
	return (
		<section className="panel">
			<h2>Evidencia de asistencia</h2>
			<dl
				className="attendance-summary"
				aria-label="Resumen de eventos filtrados"
			>
				<div>
					<dt>Eventos registrados</dt>
					<dd>{summary.events}</dd>
				</div>
				<div>
					<dt>Eventos con ajuste</dt>
					<dd>{summary.adjusted}</dd>
				</div>
				<div>
					<dt>Eventos sin ajuste</dt>
					<dd>{summary.unchanged}</dd>
				</div>
			</dl>
			<div className="actions">
				<button type="button" onClick={() => setDate(SAMPLE_DATE)}>
					Ver jornada de muestra · {SAMPLE_DATE}
				</button>
				<button type="button" onClick={() => setDate("")}>
					Ver todas las fechas
				</button>
			</div>
			<div className="filters">
				<label>
					Día
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				</label>
				<label>
					Alumno
					<select value={student} onChange={(e) => setStudent(e.target.value)}>
						<option value="">Todos</option>
						{s.students.map((x) => (
							<option key={x.id} value={x.id}>
								{x.name}
							</option>
						))}
					</select>
				</label>
			</div>
			<p className="notice">
				Sin registro no significa ausencia. Historial sin grupo conocido solo
				aparece en el expediente individual.
			</p>
			{events.map((e) => (
				<article className="list-row attendance-event" key={e.id}>
					<div className="result-toolbar">
						<h3>
							{studentName(e.student)} · {e.date} · {e.time} · {e.kind}
						</h3>
						<span className="status-badge">
							{s.adjustments.some((a) => a.event === e.id)
								? "Con ajuste"
								: "Sin ajuste"}
						</span>
					</div>
					<details>
						<summary>Ver evidencia original</summary>
						<p>
							<strong>Original inmutable:</strong> {e.date} · {e.time} ·{" "}
							{e.kind} · ID {e.id}
						</p>
						<p>
							{e.group
								? `${s.groups.find((g) => g.id === e.group)?.name || e.group} · ${s.cycles.find((c) => c.id === e.cycle)?.name || e.cycle}`
								: "Grupo/ciclo histórico no determinado"}
						</p>
					</details>
					<button
						type="button"
						onClick={() =>
							open(
								"adjust",
								`Justificar / corregir ${e.id}`,
								[field("value", "Resultado del ajuste"), reason],
								{ event: e.id },
							)
						}
					>
						Justificar / corregir
					</button>
					{s.adjustments
						.filter((a) => a.event === e.id)
						.map((a) => (
							<p key={a.id}>
								Ajuste: {a.value} · Motivo: {a.reason} · Responsable: {a.author}
							</p>
						))}
				</article>
			))}
			{!events.length && (
				<p>No hay eventos para estos filtros; no se infieren faltas.</p>
			)}
		</section>
	);
}
