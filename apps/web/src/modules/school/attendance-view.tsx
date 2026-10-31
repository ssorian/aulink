import { useState } from "react";
import { summarizeAttendance } from "./experience";
import { ProfileBadge } from "./profile-badge";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function AttendanceView({ s, open }: Pick<ViewProps, "s" | "open">) {
	const [date, setDate] = useState("");
	const events = s.events.filter((e) => !date || e.date === date);
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
			<div className="profile-date-filter">
				<label>
					Día
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				</label>
				<button type="button" disabled={!date} onClick={() => setDate("")}>
					Ver todas las fechas
				</button>
			</div>
			<p className="notice">Sin registro no significa ausencia.</p>
			{events.map((e) => (
				<article className="list-row attendance-event" key={e.id}>
					<div className="result-toolbar">
						<h3>
							{e.date} · {e.time} · {e.kind}
						</h3>
						<ProfileBadge
							tone={s.adjustments.some((a) => a.event === e.id) ? "warn" : "ok"}
						>
							{s.adjustments.some((a) => a.event === e.id)
								? "Con ajuste"
								: "Sin ajuste"}
						</ProfileBadge>
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
								`Justificar o corregir ${e.id}`,
								[field("value", "Resultado del ajuste"), reason],
								{ event: e.id },
							)
						}
					>
						Justificar o corregir
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
