import { useId, useRef, useState } from "react";
import { DataTable } from "../../components/ui/data-table";
import { Panel } from "../../components/ui/panel";
import { type MissedDay, summarizeAttendance } from "./attendance-record";
import {
	DEMO_ATTENDANCE,
	DEMO_CUTOFF,
	DEMO_JUSTIFIED,
	DEMO_RULES,
} from "./attendance-record-demo";
import { ProfileBadge } from "./profile-badge";

const longDate = new Intl.DateTimeFormat("es-MX", {
	weekday: "long",
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("es-MX", {
	weekday: "short",
	day: "numeric",
	month: "short",
	timeZone: "UTC",
});
const at = (date: string) => new Date(`${date}T12:00:00Z`);
export const formatDay = (date: string) => longDate.format(at(date));

const reasons = [
	"Enfermedad",
	"Cita médica",
	"Asunto familiar",
	"Actividad escolar",
	"Otro",
];

/** Bar with a tick at the minimum; the percent text carries the meaning. */
function Meter({ percent, minimum }: { percent: number; minimum: number }) {
	return (
		<span
			className={`attendance-meter${percent < minimum ? " is-low" : ""}`}
			aria-hidden="true"
		>
			<span style={{ width: `${percent}%` }} />
			<i style={{ left: `${minimum}%` }} />
		</span>
	);
}

function MissedSubjects({ day }: { day: MissedDay }) {
	if (day.wholeDay)
		return (
			<span className="attendance-missed-whole">
				Sin entrada a la escuela · faltó a todas sus clases
			</span>
		);
	return (
		<ul className="attendance-missed-subjects">
			{day.subjects.map((subject) => (
				<li key={subject} className="attendance-tag">
					{subject}
				</li>
			))}
		</ul>
	);
}

function JustifyForm({
	day,
	onConfirm,
	onCancel,
}: {
	day: MissedDay;
	onConfirm: (reason: string) => void;
	onCancel: () => void;
}) {
	const id = useId();
	return (
		<form
			className="attendance-justify-form"
			aria-label={`Justificar falta del ${formatDay(day.date)}`}
			onSubmit={(e) => {
				e.preventDefault();
				const data = new FormData(e.currentTarget);
				const detail = String(data.get("detail") ?? "").trim();
				onConfirm([data.get("reason"), detail].filter(Boolean).join(" · "));
			}}
		>
			<label htmlFor={`${id}-reason`}>
				<span>Motivo</span>
				<select id={`${id}-reason`} name="reason" required defaultValue="">
					<option value="" disabled>
						Elige un motivo
					</option>
					{reasons.map((r) => (
						<option key={r}>{r}</option>
					))}
				</select>
			</label>
			<label htmlFor={`${id}-detail`}>
				<span>
					Detalle <small>(opcional)</small>
				</span>
				<input
					id={`${id}-detail`}
					name="detail"
					placeholder="Ej. justificante entregado en control escolar"
				/>
			</label>
			<div className="attendance-justify-actions">
				<button type="button" onClick={onCancel}>
					Cancelar
				</button>
				<button type="submit" className="primary">
					Confirmar justificación
				</button>
			</div>
		</form>
	);
}

export function AttendanceView() {
	const [justified, setJustified] = useState(() => new Map(DEMO_JUSTIFIED));
	const [editing, setEditing] = useState<string | null>(null);
	const [notice, setNotice] = useState("");
	const pendingHeading = useRef<HTMLHeadingElement>(null);
	const rules = DEMO_RULES;
	const { general, subjects, pending, ...summary } = summarizeAttendance(
		DEMO_ATTENDANCE,
		justified,
		rules,
	);

	const justify = (date: string, reason: string) => {
		setJustified((current) => new Map(current).set(date, reason));
		setEditing(null);
		setNotice(`Falta del ${formatDay(date)} justificada.`);
		pendingHeading.current?.focus();
	};

	if (general.percent === null)
		return (
			<section className="panel attendance">
				<h2>Asistencia</h2>
				<p className="attendance-empty">
					El ciclo todavía no tiene días de clase transcurridos.
				</p>
			</section>
		);

	return (
		<div className="profile-attendance">
			<header className="attendance-head">
				<p>Días de clase transcurridos al {formatDay(DEMO_CUTOFF)}</p>
				<ProfileBadge tone="current">Datos de muestra</ProfileBadge>
			</header>

			<Panel
				heading="Asistencia a la escuela"
				description="Entradas registradas por la terminal del plantel"
			>
				<div className="attendance-general">
					<p className="attendance-figure">
						<strong>{general.percent} %</strong>
						<span>
							{general.attended} de {general.total} días de clase con entrada
						</span>
					</p>
					<Meter percent={general.percent} minimum={rules.minimumPercent} />
				</div>
			</Panel>

			<section className="attendance-block" aria-labelledby="att-subjects">
				<header className="attendance-block-head">
					<h2 id="att-subjects">Asistencia por materia</h2>
					<p>
						Mínimo para acreditar: {rules.minimumPercent} % ·{" "}
						{rules.latesPerAbsence} retardos cuentan como 1 falta
					</p>
				</header>
				<DataTable
					caption="Clases asistidas sobre clases dadas en el ciclo"
					variant="card"
					scrollClassName="attendance-subjects"
				>
					<thead>
						<tr>
							<th scope="col">Materia</th>
							<th scope="col">Clases asistidas</th>
							<th scope="col">Faltas</th>
							<th scope="col">Retardos</th>
							<th scope="col">Asistencia</th>
							<th scope="col">Estado</th>
						</tr>
					</thead>
					<tbody>
						{subjects.map((s) => (
							<tr key={s.subject} className={s.atRisk ? "is-risk" : undefined}>
								<th scope="row">{s.subject}</th>
								<td>
									{s.attended} de {s.total}
								</td>
								<td>{s.absences}</td>
								<td>{s.lates}</td>
								<td>
									<span className="attendance-percent">
										<strong>{s.percent} %</strong>
										<Meter percent={s.percent} minimum={rules.minimumPercent} />
									</span>
								</td>
								<td>
									{s.atRisk ? (
										<ProfileBadge tone="off">
											Riesgo de extraordinario
										</ProfileBadge>
									) : (
										<ProfileBadge tone="ok">Acredita</ProfileBadge>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			</section>

			<section
				className="panel attendance-pending-panel"
				aria-labelledby="att-pending"
			>
				<header className="attendance-block-head">
					<h2 id="att-pending" ref={pendingHeading} tabIndex={-1}>
						Faltas por justificar{" "}
						<span className="attendance-count">{pending.length}</span>
					</h2>
					<p>Al justificar, la falta cuenta como asistencia.</p>
				</header>
				<p className="visually-hidden" aria-live="polite">
					{notice}
				</p>
				{pending.length ? (
					<ul className="attendance-pending">
						{pending.map((day) => (
							<li key={day.date} className="attendance-pending-item">
								<div className="attendance-pending-row">
									<time dateTime={day.date} title={formatDay(day.date)}>
										{shortDate.format(at(day.date))}
									</time>
									<MissedSubjects day={day} />
									{editing !== day.date && (
										<button
											type="button"
											aria-label={`Justificar falta del ${formatDay(day.date)}`}
											onClick={() => setEditing(day.date)}
										>
											Justificar
										</button>
									)}
								</div>
								{editing === day.date && (
									<JustifyForm
										day={day}
										onConfirm={(reason) => justify(day.date, reason)}
										onCancel={() => setEditing(null)}
									/>
								)}
							</li>
						))}
					</ul>
				) : (
					<p className="attendance-empty">Sin faltas por justificar.</p>
				)}
				{summary.justified.length > 0 && (
					<details className="attendance-justified">
						<summary>
							Ver faltas justificadas ({summary.justified.length})
						</summary>
						<ul>
							{summary.justified.map((day) => (
								<li key={day.date} className="attendance-justified-item">
									<time dateTime={day.date}>
										{shortDate.format(at(day.date))}
									</time>
									<MissedSubjects day={day} />
									<span>{day.reason}</span>
								</li>
							))}
						</ul>
					</details>
				)}
			</section>
		</div>
	);
}
