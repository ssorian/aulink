import { useId, useRef, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { DataTable } from "../../../components/ui/data-table";
import { EmptyState } from "../../../components/ui/empty-state";
import { Field } from "../../../components/ui/field";
import { Meter } from "../../../components/ui/meter";
import { Stat, StatGrid } from "../../../components/ui/stat";
import type { Tone } from "../../../components/ui/tone";
import { type MissedDay, summarizeAttendance } from "./attendance-record";
import {
	DEMO_ATTENDANCE,
	DEMO_CUTOFF,
	DEMO_JUSTIFIED,
	DEMO_RULES,
} from "./attendance-record-demo";

const control =
	"min-h-11 min-w-0 flex-1 border-0 bg-transparent font-semibold text-foreground outline-none focus-visible:outline-none";

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

function MissedSubjects({
	day,
	tone,
	className,
}: {
	day: MissedDay;
	tone: Tone;
	className?: string;
}) {
	if (day.wholeDay)
		return (
			<span
				className={`text-sm font-semibold ${tone === "brick" ? "text-brick-ink" : "text-muted-foreground"} ${className ?? ""}`}
			>
				Sin entrada a la escuela · faltó a todas sus clases
			</span>
		);
	return (
		<ul
			className={`m-0 flex list-none flex-wrap gap-1.5 p-0 ${className ?? ""}`}
		>
			{day.subjects.map((subject) => (
				<li key={subject}>
					<Badge tone={tone}>{subject}</Badge>
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
			className="grid items-end gap-3 bg-muted px-5 py-4 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)_auto]"
			aria-label={`Justificar falta del ${formatDay(day.date)}`}
			onSubmit={(e) => {
				e.preventDefault();
				const data = new FormData(e.currentTarget);
				const detail = String(data.get("detail") ?? "").trim();
				onConfirm([data.get("reason"), detail].filter(Boolean).join(" · "));
			}}
		>
			<Field id={`${id}-reason`} label="Motivo">
				<select
					id={`${id}-reason`}
					name="reason"
					required
					defaultValue=""
					className={control}
				>
					<option value="" disabled>
						Elige un motivo
					</option>
					{reasons.map((r) => (
						<option key={r}>{r}</option>
					))}
				</select>
			</Field>
			<Field id={`${id}-detail`} label="Detalle (opcional)">
				<input
					id={`${id}-detail`}
					name="detail"
					placeholder="Ej. justificante entregado en control escolar"
					className={control}
				/>
			</Field>
			<div className="flex gap-2">
				<Button onClick={onCancel}>Cancelar</Button>
				<Button type="submit" variant="primary">
					Confirmar justificación
				</Button>
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
	const risk = subjects.filter((x) => x.atRisk).length;

	const justify = (date: string, reason: string) => {
		setJustified((current) => new Map(current).set(date, reason));
		setEditing(null);
		setNotice(`Falta del ${formatDay(date)} justificada.`);
		pendingHeading.current?.focus();
	};

	if (general.percent === null)
		return (
			<EmptyState
				icon="calendar"
				title="Asistencia"
				text="El ciclo todavía no tiene días de clase transcurridos."
			/>
		);

	return (
		<div data-slot="profile-attendance" className="grid gap-5">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<p className="m-0 text-sm text-muted-foreground">
					{`Días de clase transcurridos al ${formatDay(DEMO_CUTOFF)}`}
				</p>
				<Badge>Datos de muestra</Badge>
			</header>

			<Card aria-labelledby="att-general">
				<CardHeader>
					<div>
						<CardTitle id="att-general">Asistencia a la escuela</CardTitle>
						<p className="m-0 mt-1 text-sm text-muted-foreground">
							Entradas registradas por la terminal del plantel
						</p>
					</div>
				</CardHeader>
				<CardContent>
					<StatGrid label="Resumen de asistencia" className="md:grid-cols-3">
						<Stat
							className="[&_dd]:flex-wrap [&_strong]:whitespace-nowrap"
							label="Entradas al plantel"
							value={`${general.percent} %`}
							caption={`${general.attended} de ${general.total} días de clase con entrada`}
							tone="teal"
						/>
						<Stat
							className="[&_dd]:flex-wrap [&_strong]:whitespace-nowrap"
							label="Materias en riesgo"
							value={risk}
							tone={risk > 0 ? "danger" : "success"}
						/>
						<Stat
							className="[&_dd]:flex-wrap [&_strong]:whitespace-nowrap"
							label="Faltas por justificar"
							value={pending.length}
							tone={pending.length > 0 ? "mustard" : "success"}
						/>
					</StatGrid>
					<Meter
						className="mt-4"
						percent={general.percent}
						tone={general.percent < rules.minimumPercent ? "danger" : "teal"}
						label={`Entradas al plantel; mínimo para acreditar ${rules.minimumPercent} %`}
					/>
				</CardContent>
			</Card>

			<section aria-labelledby="att-subjects" className="grid gap-3">
				<header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<h3
						id="att-subjects"
						className="m-0 text-lg font-semibold tracking-tight"
					>
						Asistencia por materia
					</h3>
					<p className="m-0 text-sm text-muted-foreground">
						{`Mínimo para acreditar: ${rules.minimumPercent} % · ${rules.latesPerAbsence} retardos cuentan como 1 falta`}
					</p>
				</header>
				<div className="min-w-0 [&_caption]:sr-only [&_table]:table-auto [&_td]:align-middle [&_td]:text-sm [&_th]:align-middle [&_thead_th]:whitespace-nowrap">
					<DataTable
						caption="Clases asistidas sobre clases dadas en el ciclo"
						variant="card"
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
								<tr
									key={s.subject}
									data-state={s.atRisk ? "risk" : undefined}
									className="data-[state=risk]:bg-brick-bg/40"
								>
									<th scope="row" className="text-sm">
										{s.subject}
									</th>
									<td>
										{s.attended} de {s.total}
									</td>
									<td>{s.absences}</td>
									<td>{s.lates}</td>
									<td>
										<span className="inline-flex items-center gap-3">
											<strong className="w-12 tabular-nums">
												{s.percent} %
											</strong>
											<Meter
												className="w-24"
												percent={s.percent}
												tone={s.atRisk ? "danger" : "success"}
												label={`Asistencia en ${s.subject}; mínimo ${rules.minimumPercent} %`}
											/>
										</span>
									</td>
									<td>
										<Badge tone={s.atRisk ? "danger" : "success"}>
											{s.atRisk ? "Riesgo de extraordinario" : "Acredita"}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</DataTable>
				</div>
			</section>

			<Card
				padding="none"
				aria-labelledby="att-pending"
				className="overflow-hidden"
			>
				<CardHeader className="mb-0 px-5 pt-5 pb-4">
					<h3
						id="att-pending"
						ref={pendingHeading}
						tabIndex={-1}
						className="m-0 flex items-center gap-2 text-lg font-semibold tracking-tight"
					>
						Faltas por justificar <Badge tone="mustard">{pending.length}</Badge>
					</h3>
					<p className="m-0 text-sm text-muted-foreground">
						Al justificar, la falta cuenta como asistencia.
					</p>
				</CardHeader>
				<p className="sr-only" aria-live="polite">
					{notice}
				</p>
				{pending.length ? (
					<ul className="m-0 list-none p-0">
						{pending.map((day) => (
							<li
								key={day.date}
								data-slot="pending-day"
								className="border-t border-border"
							>
								<div className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 max-sm:grid-cols-[minmax(0,1fr)_auto]">
									<time
										dateTime={day.date}
										title={formatDay(day.date)}
										className="font-semibold tabular-nums"
									>
										{shortDate.format(at(day.date))}
									</time>
									<MissedSubjects
										day={day}
										tone="brick"
										className="max-sm:col-span-2 max-sm:row-start-2"
									/>
									{editing !== day.date && (
										<Button
											size="sm"
											aria-label={`Justificar falta del ${formatDay(day.date)}`}
											onClick={() => setEditing(day.date)}
										>
											Justificar
										</Button>
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
					<p className="m-0 px-5 pb-5 text-sm text-muted-foreground">
						Sin faltas por justificar.
					</p>
				)}
				{summary.justified.length > 0 && (
					<details className="border-t border-border px-5 py-2">
						<summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary">
							Ver faltas justificadas ({summary.justified.length})
						</summary>
						<ul className="m-0 list-none p-0">
							{summary.justified.map((day) => (
								<li
									key={day.date}
									className="grid grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-border py-2.5 text-sm text-muted-foreground last:border-b-0 max-sm:grid-cols-1"
								>
									<time
										dateTime={day.date}
										className="font-semibold tabular-nums text-foreground"
									>
										{shortDate.format(at(day.date))}
									</time>
									<MissedSubjects day={day} tone="neutral" />
									<span>{day.reason}</span>
								</li>
							))}
						</ul>
					</details>
				)}
			</Card>
		</div>
	);
}
