import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

export type DayMarks = Map<string, Set<"cancel" | "move" | "cover">>;

const weekdayInitials = ["L", "M", "M", "J", "V", "S", "D"];
const markLabels = {
	cancel: "cancelación",
	move: "reagenda",
	cover: "suplencia",
};
const markFill = {
	cancel: "bg-destructive",
	move: "bg-mustard",
	cover: "bg-[#7b72c4]",
};
const legendItems = [
	["cancel", "Cancelada"],
	["move", "Reagendada"],
	["cover", "Suplencia"],
] as const;

const monthTitle = (month: string) =>
	new Intl.DateTimeFormat("es-MX", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${month}-15T12:00:00Z`));
const addDays = (date: string, days: number) => {
	const next = new Date(`${date}T12:00:00Z`);
	next.setUTCDate(next.getUTCDate() + days);
	return next.toISOString().slice(0, 10);
};
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
	className,
}: {
	selected: string;
	today: string;
	marks?: DayMarks;
	onSelect: (date: string) => void;
	label?: string;
	/** Which days the current view covers; defaults to the selected week. */
	inRange?: (date: string) => boolean;
	legend?: boolean;
	className?: string;
}) {
	const root = useRef<HTMLElement>(null);
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
		const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
			e.key
		];
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
			root.current
				?.querySelector<HTMLElement>(`[data-date="${next}"]`)
				?.focus(),
		);
	}
	const navButton =
		"inline-grid size-11 min-h-11 place-items-center rounded-lg border-0 bg-transparent p-0 text-primary hover:bg-muted";
	return (
		<section
			ref={root}
			data-slot="mini-month"
			aria-label={label}
			className={cn(
				"rounded-2xl border border-border bg-card px-4 pt-4 pb-3.5",
				className,
			)}
		>
			<header className="mb-2 flex items-center justify-between gap-2">
				<h3 className="m-0 text-[15px] font-semibold whitespace-nowrap first-letter:uppercase">
					{monthTitle(shownMonth)}
				</h3>
				<div className="flex shrink-0">
					<button
						type="button"
						className={cn(navButton, "[&_svg]:rotate-180")}
						aria-label="Mes anterior"
						onClick={() => setMonth(shiftMonth(shownMonth, -1))}
					>
						<Icon name="chevron" size={18} />
					</button>
					<button
						type="button"
						className={navButton}
						aria-label="Mes siguiente"
						onClick={() => setMonth(shiftMonth(shownMonth, 1))}
					>
						<Icon name="chevron" size={18} />
					</button>
				</div>
			</header>
			<fieldset className="m-0 grid min-w-0 grid-cols-7 gap-y-0.5 border-0 p-0 text-center">
				<legend className="sr-only">{monthTitle(shownMonth)}</legend>
				{weekdayInitials.map((letter, i) => (
					<span
						key={["L", "M", "X", "J", "V", "S", "D"][i]}
						aria-hidden="true"
						className="pb-1.5 text-xs text-muted-foreground"
					>
						{letter}
					</span>
				))}
				{days.map((date) => {
					const dayMarks = [...(marks.get(date) || [])];
					const isCovered = covered(date);
					const isToday = date === today;
					const start = isCovered && !covered(addDays(date, -1));
					const end = isCovered && !covered(addDays(date, 1));
					return (
						<button
							type="button"
							key={date}
							data-date={date}
							data-outside={date.slice(0, 7) !== shownMonth}
							data-week={isCovered}
							data-range-start={start}
							data-range-end={end}
							data-today={isToday}
							aria-pressed={isCovered}
							aria-label={`${Number(date.slice(8))} de ${monthTitle(date.slice(0, 7))}${isToday ? ", hoy" : ""}${dayMarks.length ? `, con ${dayMarks.map((m) => markLabels[m]).join(" y ")}` : ""}`}
							tabIndex={date === tabbable ? 0 : -1}
							onKeyDown={(e) => move(e, date)}
							onFocus={() => setFocus(date)}
							onClick={() => {
								setFocus(date);
								onSelect(date);
							}}
							className={cn(
								"relative h-11 min-h-11 rounded-none border-0 bg-transparent p-0 text-[13px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
								"data-[outside=true]:text-muted-foreground/70",
								"data-[week=true]:bg-selection",
								"first:rounded-l-[10px] last:rounded-r-[10px] nth-[7n+1]:rounded-l-[10px] nth-[7n]:rounded-r-[10px]",
								start && "rounded-l-[10px]",
								end && "rounded-r-[10px]",
								isToday && "font-bold text-primary",
							)}
						>
							{isToday && (
								<span
									aria-hidden="true"
									className="absolute top-2 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-primary"
								/>
							)}
							<span className="relative">{Number(date.slice(8))}</span>
							{dayMarks.length > 0 && (
								<span
									aria-hidden="true"
									className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5"
								>
									{dayMarks.map((mark) => (
										<i
											key={mark}
											data-mark={mark}
											className={cn(
												"block size-[5px] rounded-full",
												markFill[mark],
											)}
										/>
									))}
								</span>
							)}
						</button>
					);
				})}
			</fieldset>
			{legend && (
				<p className="mt-2.5 mb-0 flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
					{legendItems.map(([mark, text]) => (
						<span
							key={mark}
							data-mark={mark}
							className="inline-flex items-center gap-1.5"
						>
							<span
								aria-hidden="true"
								className={cn("size-[7px] rounded-full", markFill[mark])}
							/>
							{text}
						</span>
					))}
				</p>
			)}
		</section>
	);
}
