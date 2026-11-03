import { type KeyboardEvent, useEffect, useState } from "react";
import { Icon } from "../../../components/ui/icon";
import { addDays } from "./schedule-helpers";

export type DayMarks = Map<string, Set<"cancel" | "move" | "cover">>;
const initials = ["L", "M", "M", "J", "V", "S", "D"];
const dayNames = [
	"lunes",
	"martes",
	"miércoles",
	"jueves",
	"viernes",
	"sábado",
	"domingo",
];
const markLabels = {
	cancel: "cancelación",
	move: "reagenda",
	cover: "suplencia",
};
const monthTitle = (month: string) =>
	new Intl.DateTimeFormat("es-MX", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${month}-15T12:00:00Z`));
const mondayOf = (date: string) =>
	addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
const shiftMonth = (month: string, offset: number) => {
	const date = new Date(`${month}-15T12:00:00Z`);
	date.setUTCMonth(date.getUTCMonth() + offset);
	return date.toISOString().slice(0, 7);
};

/** Month picker: arrows move by day or week, PageUp/PageDown by month. */
export function MiniMonth({
	selected,
	today,
	marks = new Map(),
	onSelect,
	label = "Elegir semana",
	inRange,
	legend = true,
}: {
	selected: string;
	today: string;
	marks?: DayMarks;
	onSelect: (date: string) => void;
	label?: string;
	/** Which days the current view covers; defaults to the selected week. */
	inRange?: (date: string) => boolean;
	legend?: boolean;
}) {
	const [month, setMonth] = useState(selected.slice(0, 7));
	const [focus, setFocus] = useState(selected);
	useEffect(() => {
		setMonth(selected.slice(0, 7));
		setFocus(selected);
	}, [selected]);
	const shownMonth = month;
	const first = mondayOf(`${shownMonth}-01`);
	const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
	const week = mondayOf(selected);
	const covered = inRange || ((date: string) => mondayOf(date) === week);
	const tabbable = days.includes(focus)
		? focus
		: days.includes(selected)
			? selected
			: `${shownMonth}-01`;
	function move(e: KeyboardEvent<HTMLButtonElement>, date: string) {
		const step = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7,
		}[e.key];
		let next = step ? addDays(date, step) : "";
		if (e.key === "PageUp" || e.key === "PageDown") {
			const offset = e.key === "PageUp" ? -1 : 1;
			next = `${shiftMonth(date.slice(0, 7), offset)}-${date.slice(8)}`;
			if (next.slice(8) > "28") next = `${next.slice(0, 8)}28`;
		}
		if (!next) return;
		e.preventDefault();
		setFocus(next);
		setMonth(next.slice(0, 7));
		requestAnimationFrame(() =>
			document
				.querySelector<HTMLElement>(`.schedule-mini [data-date="${next}"]`)
				?.focus(),
		);
	}
	return (
		<section className="schedule-card schedule-mini" aria-label={label}>
			<header>
				<h3>{monthTitle(shownMonth)}</h3>
				<div>
					<button
						type="button"
						className="schedule-icon-button schedule-prev"
						aria-label="Mes anterior"
						onClick={() => setMonth(shiftMonth(shownMonth, -1))}
					>
						<Icon name="chevron" size={18} />
					</button>
					<button
						type="button"
						className="schedule-icon-button"
						aria-label="Mes siguiente"
						onClick={() => setMonth(shiftMonth(shownMonth, 1))}
					>
						<Icon name="chevron" size={18} />
					</button>
				</div>
			</header>
			<fieldset className="schedule-mini-grid">
				<legend className="schedule-hidden">{monthTitle(shownMonth)}</legend>
				{initials.map((letter, i) => (
					<span key={dayNames[i]} aria-hidden="true">
						{letter}
					</span>
				))}
				{days.map((date) => {
					const dayMarks = [...(marks.get(date) || [])];
					return (
						<button
							type="button"
							key={date}
							data-date={date}
							data-outside={date.slice(0, 7) !== shownMonth}
							data-week={covered(date)}
							data-range-start={covered(date) && !covered(addDays(date, -1))}
							data-range-end={covered(date) && !covered(addDays(date, 1))}
							data-today={date === today}
							aria-pressed={covered(date)}
							aria-label={`${Number(date.slice(8))} de ${monthTitle(date.slice(0, 7))}${date === today ? ", hoy" : ""}${dayMarks.length ? `, con ${dayMarks.map((m) => markLabels[m]).join(" y ")}` : ""}`}
							tabIndex={date === tabbable ? 0 : -1}
							onKeyDown={(e) => move(e, date)}
							onFocus={() => setFocus(date)}
							onClick={() => {
								setFocus(date);
								onSelect(date);
							}}
						>
							{Number(date.slice(8))}
							{dayMarks.length > 0 && (
								<span className="schedule-marks" aria-hidden="true">
									{dayMarks.map((mark) => (
										<i key={mark} data-mark={mark} />
									))}
								</span>
							)}
						</button>
					);
				})}
			</fieldset>
			{legend && (
				<p className="schedule-marks-legend">
					<span data-mark="cancel">Cancelada</span>
					<span data-mark="move">Reagendada</span>
					<span data-mark="cover">Suplencia</span>
				</p>
			)}
		</section>
	);
}

export type SubjectRow = {
	id: string;
	subject: string;
	teacher: string;
	tone: number;
	minutes: number;
};
const hoursText = (value: number) => {
	const h = Math.floor(value / 60);
	const m = value % 60;
	if (!value) return "Sin horario";
	return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

export function SubjectFilter({
	rows,
	hidden,
	onToggle,
	onAdd,
}: {
	rows: SubjectRow[];
	hidden: Set<string>;
	onToggle: (id: string) => void;
	onAdd: () => void;
}) {
	return (
		<section
			className="schedule-card schedule-subjects"
			aria-labelledby="schedule-subjects-title"
		>
			<header>
				<h3 id="schedule-subjects-title">Materias</h3>
				<span>Horas por semana</span>
			</header>
			{rows.length ? (
				<ul>
					{rows.map((row) => (
						<li key={row.id}>
							<label title={row.teacher} data-tone={row.tone}>
								<input
									type="checkbox"
									checked={!hidden.has(row.id)}
									onChange={() => onToggle(row.id)}
								/>
								<span className="schedule-subject-name">{row.subject}</span>
								<span className="schedule-subject-hours">
									<Icon name="clock" size={14} />
									{hoursText(row.minutes)}
								</span>
							</label>
						</li>
					))}
				</ul>
			) : (
				<p>Este grupo aún no tiene materias.</p>
			)}
			<button type="button" className="schedule-link" onClick={onAdd}>
				<Icon name="plus" size={16} />
				Agregar materia
			</button>
		</section>
	);
}

export type ChangeRow = {
	key: string;
	mark: "cancel" | "move" | "cover";
	subject: string;
	text: string;
	onOpen: () => void;
};
export function WeekChanges({ rows }: { rows: ChangeRow[] }) {
	return (
		<section
			className="schedule-card schedule-changes"
			aria-labelledby="schedule-changes-title"
		>
			<header>
				<h3 id="schedule-changes-title">Cambios de la semana</h3>
				{rows.length > 0 && <span>{rows.length}</span>}
			</header>
			{rows.length ? (
				<ul>
					{rows.map((row) => (
						<li key={row.key}>
							<button type="button" onClick={row.onOpen} data-mark={row.mark}>
								<span className="schedule-change-text">
									<strong>{row.subject}</strong>
									{row.text}
								</span>
								<Icon name="chevron" size={16} />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p>Sin cancelaciones, reagendas ni suplencias esta semana.</p>
			)}
		</section>
	);
}
