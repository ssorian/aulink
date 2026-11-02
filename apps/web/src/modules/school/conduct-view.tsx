import { type ReactNode, useState } from "react";
import { Icon } from "../../components/ui/icon";
import { Empty, field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";
import "./conduct-view.css";

type Report = State["conduct"][number];
type Filter = "Todos" | "Reconocimiento" | "Incidente";
type Open = ViewProps["open"];

const filters: { id: Filter; label: string }[] = [
	{ id: "Todos", label: "Todos" },
	{ id: "Reconocimiento", label: "Reconocimientos" },
	{ id: "Incidente", label: "Incidentes" },
];
const shortDate = new Intl.DateTimeFormat("es-MX", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("es-MX", {
	month: "long",
	timeZone: "UTC",
});
const atNoon = (date: string) => new Date(`${date}T12:00:00Z`);
const formatDate = (date: string) =>
	shortDate.format(atNoon(date)).replace(".", "");
const monthLabel = (date?: string) => {
	if (!date) return "Sin fecha";
	const name = monthName.format(atNoon(date));
	return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.slice(0, 4)}`;
};
const plural = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`;

/** Newest first; records saved without a date go last, keeping their order. */
export function sortConduct(rows: Report[]) {
	return [...rows].sort((a, b) =>
		a.date && b.date
			? b.date.localeCompare(a.date)
			: a.date
				? -1
				: b.date
					? 1
					: 0,
	);
}
export function visibleConduct(rows: Report[], filter: Filter) {
	return sortConduct(rows).filter(
		(c) => filter === "Todos" || c.kind === filter,
	);
}

function Lock() {
	return (
		<svg
			className="ui-icon"
			focusable="false"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.65"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4" />
		</svg>
	);
}

export function ConductItem({
	c,
	s,
	open,
	studentName,
	showStudent,
}: {
	c: Report;
	s: State;
	open: Open;
	studentName: (id: string) => string;
	showStudent: boolean;
}) {
	const recognition = c.kind === "Reconocimiento";
	const shared = c.shared === "Compartido";
	const type = recognition ? "reconocimiento" : "incidente";
	const group = c.group
		? s.groups.find((g) => g.id === c.group)?.name || c.group
		: "Grupo no determinado";
	const steps = c.followup.split("\n").filter((line) => line.trim());
	const detailCount = steps.length + (c.internal ? 1 : 0);
	const kindTone = recognition ? "recognition" : "incident";
	return (
		<li
			className={`conduct-item conduct-item--${kindTone}${c.published ? "" : " conduct-item--draft"}`}
		>
			<span className="conduct-marker" aria-hidden="true">
				<Icon name={recognition ? "heart" : "bell"} size={14} />
			</span>
			<div className="conduct-event">
				<p className="conduct-sentence">
					{c.author ? (
						<>
							<strong>{c.author}</strong> registró un{" "}
							<span className="conduct-type">{type}</span>
						</>
					) : (
						<>
							Autor no registrado · <span className="conduct-type">{type}</span>
						</>
					)}
					{showStudent && (
						<>
							{" "}
							de <strong>{studentName(c.student)}</strong>
						</>
					)}
					<span className="conduct-group">{group}</span>
				</p>
				<span className="conduct-date">
					{c.date ? formatDate(c.date) : "Sin fecha"}
				</span>
			</div>
			<div className="conduct-card">
				<p className="conduct-card-text">{c.text}</p>
				<div className="conduct-pills">
					{!c.published && (
						<span className="conduct-pill conduct-pill--draft">Borrador</span>
					)}
					<span className="conduct-pill">
						{shared ? <Icon name="users" size={13} /> : <Lock />}
						{shared ? "Visible para familias" : "Solo interno"}
					</span>
				</div>
				{detailCount > 0 && (
					<details className="conduct-details">
						<summary>Nota interna y seguimiento ({detailCount})</summary>
						{c.internal && (
							<div className="conduct-card-internal">
								<strong>
									<Lock />
									Nota interna · solo personal
								</strong>
								<p>{c.internal}</p>
							</div>
						)}
						{steps.length > 0 && (
							<ul className="conduct-followup">
								{steps.map((line, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: lines are an append-only log
									<li key={i}>{line}</li>
								))}
							</ul>
						)}
					</details>
				)}
				<div className="conduct-actions">
					<button
						className="conduct-link"
						type="button"
						onClick={() =>
							open(
								"conduct-followup",
								`Agregar seguimiento: ${c.id}`,
								[field("followup", "Nuevo seguimiento", "textarea"), reason],
								{ id: c.id },
								["Se agrega al seguimiento previo sin borrarlo."],
							)
						}
					>
						Agregar seguimiento
					</button>
					{!c.published && (
						<button
							className="conduct-link conduct-link--pending"
							type="button"
							onClick={() =>
								open(
									"conduct-publish",
									`Revisar reporte de ${studentName(c.student)}`,
									[],
									{ id: c.id },
									[
										`${c.shared}: ${c.text}`,
										`Seguimiento: ${c.followup}`,
										"Las notas internas no forman parte del contenido compartido.",
									],
								)
							}
						>
							Revisar y publicar
						</button>
					)}
				</div>
			</div>
		</li>
	);
}

/** Consecutive rows (already sorted) that share a month heading. */
export function groupByMonth(rows: Report[]) {
	const months: { label: string; rows: Report[] }[] = [];
	for (const c of rows) {
		const label = monthLabel(c.date);
		const last = months.at(-1);
		if (last && last.label === label) last.rows.push(c);
		else months.push({ label, rows: [c] });
	}
	return months;
}

function ConductBoard({
	s,
	open,
	studentName,
	studentId,
	action,
	emptyText,
}: Pick<ViewProps, "s" | "open" | "studentName"> & {
	studentId?: string;
	action: ReactNode;
	emptyText: string;
}) {
	const [filter, setFilter] = useState<Filter>("Todos");
	const count = (kind: string) =>
		s.conduct.filter((c) => c.kind === kind).length;
	const drafts = s.conduct.filter((c) => !c.published).length;
	const rows = visibleConduct(s.conduct, filter);
	return (
		<>
			<div className="conduct-bar">
				{s.conduct.length > 0 && (
					<>
						<ul className="conduct-summary" aria-label="Resumen de reportes">
							<li
								className={`conduct-chip conduct-chip--${count("Reconocimiento") ? "recognition" : "zero"}`}
							>
								{plural(
									count("Reconocimiento"),
									"reconocimiento",
									"reconocimientos",
								)}
							</li>
							<li
								className={`conduct-chip conduct-chip--${count("Incidente") ? "incident" : "zero"}`}
							>
								{plural(count("Incidente"), "incidente", "incidentes")}
							</li>
							{drafts > 0 && (
								<li className="conduct-chip conduct-chip--draft">
									{plural(drafts, "borrador", "borradores")}
								</li>
							)}
						</ul>
						<div className="profile-grades-periods conduct-filter">
							{filters.map((f) => (
								<button
									key={f.id}
									type="button"
									aria-pressed={filter === f.id}
									onClick={() => setFilter(f.id)}
								>
									{f.label}
								</button>
							))}
						</div>
					</>
				)}
				<div className="conduct-action">{action}</div>
			</div>
			{rows.length > 0 ? (
				<div className="conduct-list">
					{groupByMonth(rows).map((month) => (
						<section className="conduct-month" key={month.label}>
							<h3>{month.label}</h3>
							<ol className="conduct-rail">
								{month.rows.map((c) => (
									<ConductItem
										key={c.id}
										c={c}
										s={s}
										open={open}
										studentName={studentName}
										showStudent={!studentId}
									/>
								))}
							</ol>
						</section>
					))}
				</div>
			) : s.conduct.length > 0 ? (
				<p className="conduct-empty">No hay reportes de este tipo.</p>
			) : (
				<Empty text={emptyText} />
			)}
		</>
	);
}

export function ConductView({
	s,
	open,
	students,
	studentName,
	hideCreate = false,
	studentId,
	groupId,
}: Pick<ViewProps, "s" | "open" | "students" | "studentName"> & {
	hideCreate?: boolean;
	studentId?: string;
	groupId?: string;
}) {
	const registerButton = hideCreate ? null : (
		<button
			className="primary"
			type="button"
			disabled={studentId ? !groupId : undefined}
			onClick={() =>
				open(
					"conduct",
					"Registrar acompañamiento",
					[
						...(!studentId ? [students] : []),
						options("kind", "Tipo", [
							{ id: "Reconocimiento", name: "Reconocimiento" },
							{ id: "Incidente", name: "Incidente" },
						]),
						field("text", "Contenido del reporte", "textarea"),
						{
							...field(
								"internal",
								"Notas internas (no compartidas)",
								"textarea",
							),
							optional: true,
						},
						field("followup", "Seguimiento acordado", "textarea"),
						options("shared", "Visibilidad", [
							{ id: "Interno", name: "Solo interno" },
							{
								id: "Compartido",
								name: "Contenido público",
							},
						]),
					],
					studentId && groupId
						? { student: studentId, group: groupId }
						: undefined,
				)
			}
		>
			{studentId
				? "Registrar reconocimiento o incidente"
				: "Registrar reconocimiento / incidente"}
		</button>
	);
	return (
		<>
			{studentId && <h2 className="visually-hidden">Conducta</h2>}
			{studentId && !groupId && (
				<p>Se necesita un grupo activo para registrar conducta.</p>
			)}
			<ConductBoard
				s={s}
				open={open}
				studentName={studentName}
				studentId={studentId}
				action={registerButton}
				emptyText={
					studentId && !groupId
						? "No hay registros de conducta."
						: "Registra un reconocimiento o incidente con seguimiento concreto."
				}
			/>
		</>
	);
}
