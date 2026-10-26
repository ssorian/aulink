import { useEffect, useRef } from "react";
import { validateCommunicationTarget } from "./communication-summary";
import { field, noticeFields, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import "./calendar-day-actions.css";

type Action = "exception" | "calendar-holiday" | "calendar-event";

export function openCalendarDayAction(
	kind: Action,
	date: string,
	s: ViewProps["s"],
	open: ViewProps["open"],
) {
	if (kind === "exception") {
		return open(kind, "Marcar sin clases", [field("date", "Fecha", "date"), reason], { date }, [
			"Aplica a toda la escuela. No se generan faltas automáticas.",
		]);
	}
	if (kind === "calendar-holiday") {
		return open(kind, "Marcar como feriado", [field("date", "Fecha", "date"), field("title", "Nombre del feriado")], { date, title: "Feriado" }, [
			"Marca visual únicamente: no modifica las clases ni la asistencia.",
		]);
	}
	const fields = noticeFields(s).map((f) => {
		if (f.key === "text") return { ...f, label: "Aviso para las familias", rows: 8 };
		if (f.key === "target") {
			return {
				...f,
				options: [
					...s.groups.map((g) => ({
						value: g.id,
						label: `Grupo: ${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name ?? "Sin ciclo"}`,
					})),
					...s.students.map((student) => ({
						value: student.id,
						label: `Alumno: ${student.name}`,
					})),
				],
				validate: (value: string, values: Record<string, string>) =>
					validateCommunicationTarget(s, values.audience, value),
			};
		}
		return f;
	});
	open(kind, "Crear evento", [field("date", "Fecha", "date"), ...fields], { date, audience: "school", target: "" }, [
		"Se guardarán juntos el evento y un aviso en borrador. No se envía ni publica; la publicación se revisa después en Comunicados.",
	]);
}

export type DayAnchor = { date: string; button: HTMLButtonElement };

export function CalendarDayActions({
	selection,
	s,
	open,
	onClose,
}: Pick<ViewProps, "s" | "open"> & {
	selection: DayAnchor | null;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const closeButton = useRef<HTMLButtonElement>(null);
	const launching = useRef(false);
	useEffect(() => {
		const popup = ref.current;
		if (!popup || !selection) return;
		launching.current = false;
		// Outside-month selection can replace the original day button.
		const anchor = () => document.getElementById(`calendar-day-${selection.date}`) ?? selection.button;
		const position = () => {
			const rect = anchor().getBoundingClientRect();
			popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - popup.offsetWidth - 12))}px`;
			popup.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - popup.offsetHeight - 12))}px`;
		};
		popup.showPopover();
		position();
		closeButton.current?.focus();
		const toggle = () => {
			if (!popup.matches(":popover-open")) {
				// Do not steal focus from a control chosen during light dismissal.
				if (!launching.current && (popup.contains(document.activeElement) || document.activeElement === document.body)) {
					anchor().focus();
				}
				onClose();
			}
		};
		popup.addEventListener("toggle", toggle);
		window.addEventListener("resize", position);
		window.addEventListener("scroll", position, true);
		return () => {
			popup.removeEventListener("toggle", toggle);
			window.removeEventListener("resize", position);
			window.removeEventListener("scroll", position, true);
			popup.hidePopover();
		};
	}, [selection, onClose]);
	const date = selection?.date ?? "";
	const entries = [
		...s.exceptions.filter((x) => x.date === date).map((x) => `Sin clases: ${x.reason}`),
		...s.calendarHolidays.filter((x) => x.date === date).map((x) => `Feriado (solo visual): ${x.title}`),
		...s.calendarEvents.filter((x) => x.date === date).map((x) => `Evento: ${x.title}`),
	];
	return (
		<div ref={ref} popover="auto" role="dialog" aria-labelledby="calendar-day-heading" className="calendar-day-actions" id="calendar-day-actions">
			<header>
				<h3 id="calendar-day-heading">
					{date && new Date(`${date}T12:00:00Z`).toLocaleDateString("es-MX", { dateStyle: "full", timeZone: "UTC" })}
				</h3>
				<button ref={closeButton} type="button" onClick={() => ref.current?.hidePopover()}>Cerrar</button>
			</header>
			{entries.length > 0 && <ul>{entries.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}</ul>}
			<div className="calendar-day-action-list">
				{([
					["exception", "Marcar sin clases"],
					["calendar-holiday", "Marcar como feriado"],
					["calendar-event", "Crear evento"],
				] as const).map(([kind, label]) => (
					<button type="button" key={kind} onClick={() => {
						launching.current = true;
						ref.current?.hidePopover();
						document.getElementById(`calendar-day-${date}`)?.focus();
						// Clear selection before opening the modal; toggle is asynchronous.
						onClose();
						openCalendarDayAction(kind, date, s, open);
					}}>{label}</button>
				))}
			</div>
		</div>
	);
}
