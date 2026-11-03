import { useEffect, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { validateCommunicationTarget } from "../communications/communication-summary";
import { field, noticeFields, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";

type Action = "exception" | "calendar-holiday" | "calendar-event";

export function openCalendarDayAction(
	kind: Action,
	date: string,
	s: ViewProps["s"],
	open: ViewProps["open"],
) {
	if (kind === "exception") {
		return open(
			kind,
			"Marcar sin clases",
			[field("date", "Fecha", "date"), reason],
			{ date },
			["Aplica a toda la escuela. No se generan faltas automáticas."],
		);
	}
	if (kind === "calendar-holiday") {
		return open(
			kind,
			"Marcar como feriado",
			[field("date", "Fecha", "date"), field("title", "Nombre del feriado")],
			{ date, title: "Feriado" },
			["Marca visual únicamente: no modifica las clases ni la asistencia."],
		);
	}
	const fields = noticeFields(s).map((f) => {
		if (f.key === "text")
			return { ...f, label: "Aviso para las familias", rows: 8 };
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
	open(
		kind,
		"Crear evento",
		[field("date", "Fecha", "date"), ...fields],
		{ date, audience: "school", target: "" },
		[
			"Se guardarán juntos el evento y un aviso en borrador. No se envía ni publica; la publicación se revisa después en Comunicados.",
		],
	);
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
	const launching = useRef(false);
	useEffect(() => {
		const popup = ref.current;
		if (!popup || !selection) return;
		launching.current = false;
		// Outside-month selection can replace the original day button.
		const anchor = () =>
			document.getElementById(`calendar-day-${selection.date}`) ??
			selection.button;
		const position = () => {
			const rect = anchor().getBoundingClientRect();
			popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - popup.offsetWidth - 12))}px`;
			popup.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - popup.offsetHeight - 12))}px`;
		};
		popup.showPopover();
		position();
		popup.querySelector<HTMLElement>("[data-close]")?.focus();
		const toggle = () => {
			if (!popup.matches(":popover-open")) {
				// Do not steal focus from a control chosen during light dismissal.
				if (
					!launching.current &&
					(popup.contains(document.activeElement) ||
						document.activeElement === document.body)
				) {
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
		...s.exceptions
			.filter((x) => x.date === date)
			.map((x) => `Sin clases: ${x.reason}`),
		...s.calendarHolidays
			.filter((x) => x.date === date)
			.map((x) => `Feriado (solo visual): ${x.title}`),
		...s.calendarEvents
			.filter((x) => x.date === date)
			.map((x) => `Evento: ${x.title}`),
	].map((text, index, all) => ({
		text,
		key: `${text}#${all.slice(0, index).filter((other) => other === text).length}`,
	}));
	return (
		<div
			ref={ref}
			popover="auto"
			role="dialog"
			aria-labelledby="calendar-day-heading"
			data-slot="calendar-day-actions"
			id="calendar-day-actions"
			className="fixed inset-auto m-0 box-border max-h-[calc(100dvh-24px)] w-[min(360px,calc(100vw-24px))] overflow-auto rounded-[14px] border-0 bg-card p-5 text-foreground shadow-[0_12px_40px_rgb(26_42_51/20%)] [scrollbar-color:var(--action)_var(--surface)] max-[600px]:top-auto! max-[600px]:bottom-3 max-[600px]:left-3! max-[600px]:w-[calc(100vw-24px)] max-[600px]:pb-[max(20px,env(safe-area-inset-bottom))]"
		>
			<header className="flex items-start gap-4">
				<h3
					id="calendar-day-heading"
					className="m-0 text-[17px] leading-[1.4] break-words first-letter:uppercase"
				>
					{date &&
						new Date(`${date}T12:00:00Z`).toLocaleDateString("es-MX", {
							dateStyle: "full",
							timeZone: "UTC",
						})}
				</h3>
				<Button
					data-close
					className="ml-auto shrink-0"
					onClick={() => ref.current?.hidePopover()}
				>
					Cerrar
				</Button>
			</header>
			{entries.length > 0 && (
				<ul className="m-0 mt-4 space-y-2 pl-5 text-sm break-words">
					{entries.map((entry) => (
						<li key={entry.key}>{entry.text}</li>
					))}
				</ul>
			)}
			<div className="mt-6 grid gap-2">
				{(
					[
						["exception", "Marcar sin clases"],
						["calendar-holiday", "Marcar como feriado"],
						["calendar-event", "Crear evento"],
					] as const
				).map(([kind, label]) => (
					<Button
						key={kind}
						className="justify-start text-left"
						onClick={() => {
							launching.current = true;
							ref.current?.hidePopover();
							document.getElementById(`calendar-day-${date}`)?.focus();
							// Clear selection before opening the modal; toggle is asynchronous.
							onClose();
							openCalendarDayAction(kind, date, s, open);
						}}
					>
						{label}
					</Button>
				))}
			</div>
		</div>
	);
}
