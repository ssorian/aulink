import {
	type DragEvent,
	type KeyboardEvent,
	type ReactNode,
	useRef,
	useState,
} from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import type { Tone } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import { clock, minutes } from "./schedule-helpers";
import { toneVars } from "./schedule-tones";

export const hourHeight = 64;
/** Drops snap to quarter hours; a class can never end past 23:59. */
const snap = 15;
const lastStart = (duration: number) =>
	Math.floor((23 * 60 + 59 - duration) / snap) * snap;

export type GridColumn = {
	key: string;
	/** Short uppercase label, e.g. "LUN". */
	short: string;
	label: string;
	/** Day of month; absent in the weekly structure. */
	day?: string;
	date?: string;
	today?: boolean;
	holiday?: string;
	/** End of the effective school day, drawn as a dashed line. */
	end?: {
		at: string;
		/** Without an exit window the line only repeats the last block's edge. */
		subtle?: boolean;
		band?: { start: string; end: string };
	};
	/** Saturday and Sunday collapse to a narrow column while they hold no class. */
	weekend?: boolean;
	/** Weekly structure only: accessible "add class" action in the heading. */
	add?: () => void;
	summary?: string;
};
export type GridBadge = {
	tone: "cover" | "moved" | "cancel" | "move";
	text: string;
};
export type GridItem = {
	key: string;
	id: string;
	column: string;
	start: string;
	end: string;
	title: string;
	time: string;
	tone: number;
	/** Cancelled or moved-away occurrence that stays visible as evidence. */
	ghost?: "cancel" | "move";
	badge?: GridBadge;
	past?: boolean;
	draggable: boolean;
	side: "full" | "left" | "right";
	label: string;
};

export function hourRange(items: { start: string; end: string }[]) {
	const start = Math.min(
		7,
		...items.map((o) => Math.floor(minutes(o.start) / 60)),
	);
	const end = Math.max(15, ...items.map((o) => Math.ceil(minutes(o.end) / 60)));
	return { start, end };
}

export function ScheduleGrid({
	columns,
	items,
	label,
	activeKey,
	now,
	empty,
	onSelect,
	onMove,
	onCreate,
}: {
	columns: GridColumn[];
	items: GridItem[];
	label: string;
	activeKey?: string;
	now?: { column: string; minutes: number };
	empty?: ReactNode;
	onSelect: (item: GridItem, anchor: HTMLElement) => void;
	onMove: (item: GridItem, column: string, start: string) => void;
	onCreate?: (column: string, start: string) => void;
}) {
	const range = hourRange(items);
	const hours = Array.from(
		{ length: range.end - range.start + 1 },
		(_, i) => range.start + i,
	);
	const height = (range.end - range.start) * hourHeight;
	const drag = useRef<{ item: GridItem; offset: number } | null>(null);
	const [drop, setDrop] = useState<{
		column: string;
		start: number;
		conflict?: string;
	} | null>(null);
	const y = (value: number) => ((value - range.start * 60) * hourHeight) / 60;
	const top = (time: string) => y(minutes(time));
	function target(e: DragEvent<HTMLElement>) {
		const current = drag.current;
		if (!current) return null;
		const duration = minutes(current.item.end) - minutes(current.item.start);
		const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
		const raw =
			range.start * 60 + ((offset - current.offset) / hourHeight) * 60;
		return Math.min(
			Math.max(Math.round(raw / snap) * snap, 0),
			lastStart(duration),
		);
	}
	function clash(item: GridItem, column: string, start: number) {
		const end = start + minutes(item.end) - minutes(item.start);
		return items.find(
			(other) =>
				other.column === column &&
				other.key !== item.key &&
				!other.ghost &&
				minutes(other.start) < end &&
				minutes(other.end) > start,
		)?.title;
	}
	/** Arrow keys walk the visible classes: up/down within a day, left/right across days. */
	function walk(e: KeyboardEvent<HTMLButtonElement>, item: GridItem) {
		const order = columns.map((column) =>
			items
				.filter((other) => other.column === column.key)
				.sort((a, b) => a.start.localeCompare(b.start)),
		);
		const col = columns.findIndex((column) => column.key === item.column);
		const row = order[col].findIndex((other) => other.key === item.key);
		let next: GridItem | undefined;
		if (e.key === "ArrowDown") next = order[col][row + 1];
		else if (e.key === "ArrowUp") next = order[col][row - 1];
		else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			const step = e.key === "ArrowLeft" ? -1 : 1;
			for (let i = col + step; i >= 0 && i < order.length; i += step)
				if (order[i].length) {
					next = order[i].reduce((best, other) =>
						Math.abs(minutes(other.start) - minutes(item.start)) <
						Math.abs(minutes(best.start) - minutes(item.start))
							? other
							: best,
					);
					break;
				}
		} else return;
		e.preventDefault();
		if (next) document.getElementById(next.id)?.focus();
	}
	const dragged = drag.current?.item;
	const compact = new Set(
		columns
			.filter(
				(column) =>
					column.weekend && !items.some((item) => item.column === column.key),
			)
			.map((column) => column.key),
	);
	const template = `56px ${columns
		.map((column) => (compact.has(column.key) ? "56px" : "minmax(92px, 1fr)"))
		.join(" ")}`;
	const gridHead =
		"bg-[color-mix(in_srgb,var(--surface-muted)_55%,var(--surface))]";
	return (
		<section
			data-slot="schedule-scroll"
			className="relative max-h-[720px] scroll-pt-24 overflow-auto rounded-2xl border border-border bg-card [scrollbar-color:var(--control-line)_var(--surface)] [scrollbar-width:thin] max-[760px]:max-h-[560px]"
			aria-label={label}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: El calendario necesita foco para desplazamiento horizontal y vertical con teclado.
			tabIndex={0}
		>
			<div
				data-slot="schedule-grid"
				className="grid pb-3"
				style={{
					gridTemplateColumns: template,
					minWidth: 56 + columns.length * 92 - compact.size * 36,
				}}
			>
				<div
					className={cn(
						"sticky top-0 left-0 z-40 border-b border-border",
						gridHead,
					)}
				/>
				{columns.map((column) => (
					<div
						data-slot="schedule-day-heading"
						data-compact={compact.has(column.key)}
						key={column.key}
						data-today={column.today === true}
						className={cn(
							"sticky top-0 z-30 flex min-h-[68px] flex-col items-center border-b border-l border-border px-1 pt-2.5 pb-2",
							gridHead,
							compact.has(column.key) && "px-0",
						)}
					>
						<span
							className={cn(
								"text-xs font-semibold tracking-[0.06em] text-muted-foreground",
								column.today && "text-primary",
							)}
							title={column.label}
						>
							{column.short}
						</span>
						{column.day && (
							<time
								dateTime={column.date}
								className={cn(
									"text-2xl leading-[1.1] font-[650] tracking-[-0.02em]",
									column.today && "text-primary",
								)}
							>
								{column.day}
							</time>
						)}
						{column.today && <span className="sr-only">, hoy</span>}
						{column.holiday && (
							<Badge
								className="bg-card px-2 py-px font-normal text-muted-foreground"
								title={column.holiday}
							>
								Inhábil
							</Badge>
						)}
						{column.summary && !compact.has(column.key) && (
							<span className="text-xs text-muted-foreground">
								{column.summary}
							</span>
						)}
						{column.add && (
							<Button
								variant="icon"
								className={cn(
									"absolute top-2 right-1.5 size-8 min-h-8 rounded-lg hover:bg-card",
									compact.has(column.key) && "static mt-0.5",
								)}
								aria-label={`Agregar clase el ${column.label.toLowerCase()}`}
								title={`Agregar clase el ${column.label.toLowerCase()}`}
								onClick={column.add}
							>
								<Icon name="plus" size={16} />
							</Button>
						)}
					</div>
				))}
				<div
					data-slot="schedule-axis"
					className="sticky left-0 z-20 mt-2.5 bg-card"
					style={{ height }}
				>
					{hours.map((hour) => (
						<span
							key={hour}
							className="absolute right-2.5 -translate-y-1/2 text-xs font-medium text-muted-foreground"
							style={{ top: (hour - range.start) * hourHeight }}
						>
							{String(hour).padStart(2, "0")}:00
						</span>
					))}
				</div>
				{columns.map((column) => (
					<section
						key={column.key}
						data-slot="schedule-day"
						data-compact={compact.has(column.key)}
						data-off={Boolean(column.holiday)}
						data-today={column.today === true}
						data-drop={drop?.column === column.key}
						className={cn(
							"group/day relative mt-2.5 border-l border-border/70",
							column.holiday && "bg-background",
							drop?.column === column.key && "bg-selection/35",
						)}
						style={{ height }}
						aria-label={
							column.date ? `${column.label} ${column.date}` : column.label
						}
						onDragOver={(e) => {
							const start = target(e);
							const current = drag.current;
							if (start === null || !current) return;
							e.preventDefault();
							e.dataTransfer.dropEffect = "move";
							if (drop?.column !== column.key || drop.start !== start)
								setDrop({
									column: column.key,
									start,
									conflict: clash(current.item, column.key, start),
								});
						}}
						onDrop={(e) => {
							e.preventDefault();
							const start = target(e);
							const current = drag.current;
							drag.current = null;
							setDrop(null);
							if (!current || start === null) return;
							if (
								column.key === current.item.column &&
								start === minutes(current.item.start)
							)
								return;
							onMove(current.item, column.key, clock(start));
						}}
					>
						{hours
							.slice(0, -1)
							.map((hour) =>
								onCreate ? (
									<button
										type="button"
										key={hour}
										tabIndex={-1}
										data-slot="schedule-slot"
										className="absolute inset-x-0 z-[1] h-16 min-h-0 cursor-copy rounded-none border-0 border-t border-border/60 bg-transparent p-0 hover:bg-selection/40 hover:after:absolute hover:after:top-2 hover:after:left-2.5 hover:after:text-xs hover:after:font-semibold hover:after:text-primary hover:after:content-['Agregar_clase'] group-data-[compact=true]/day:hover:after:content-none"
										aria-label={`Agregar clase · ${column.label} ${clock(hour * 60)}`}
										style={{ top: (hour - range.start) * hourHeight }}
										onClick={() => onCreate(column.key, clock(hour * 60))}
									/>
								) : (
									<div
										key={hour}
										data-slot="schedule-hour-line"
										className="absolute inset-x-0 border-t border-border/60"
										style={{ top: (hour - range.start) * hourHeight }}
									/>
								),
							)}
						{column.end?.band && (
							<div
								data-slot="schedule-end-band"
								className="absolute inset-x-0 z-[1] bg-primary/7"
								aria-hidden="true"
								style={{
									top: top(column.end.band.start),
									height: top(column.end.band.end) - top(column.end.band.start),
								}}
							/>
						)}
						{column.end && (
							<div
								data-slot="schedule-end-line"
								data-subtle={column.end.subtle === true}
								className={cn(
									"absolute inset-x-0 z-[2] border-t border-dashed border-input",
									column.end.subtle && "border-t-transparent",
								)}
								style={{ top: top(column.end.at) }}
							>
								<span className="absolute top-[3px] left-2 rounded-md bg-card px-1.5 text-xs whitespace-nowrap text-muted-foreground">
									{column.end.band
										? `Salida ${column.end.band.start}–${column.end.band.end}`
										: `Fin ${column.end.at}`}
								</span>
							</div>
						)}
						{items
							.filter((item) => item.column === column.key)
							.map((item, index) => (
								<button
									type="button"
									key={item.key}
									id={item.id}
									data-slot="schedule-block"
									data-tone={item.tone}
									data-ghost={item.ghost}
									data-past={item.past}
									data-short={minutes(item.end) - minutes(item.start) < 60}
									data-dragging={dragged?.key === item.key && drop !== null}
									className={blockClass(
										item,
										activeKey === item.key,
										dragged?.key === item.key && drop !== null,
									)}
									aria-haspopup="dialog"
									aria-expanded={activeKey === item.key}
									aria-label={item.label}
									draggable={item.draggable}
									onKeyDown={(e) => walk(e, item)}
									onDragStart={(e) => {
										drag.current = {
											item,
											offset:
												e.clientY - e.currentTarget.getBoundingClientRect().top,
										};
										e.dataTransfer.effectAllowed = "move";
										e.dataTransfer.setData("text/plain", item.key);
									}}
									onDragEnd={() => {
										drag.current = null;
										setDrop(null);
									}}
									onClick={(e) => onSelect(item, e.currentTarget)}
									style={{
										...toneVars(item.tone),
										top: top(item.start),
										height: top(item.end) - top(item.start),
										left: item.side === "right" ? "50%" : 4,
										right: item.side === "left" ? "50%" : 4,
										zIndex: index + 3,
									}}
								>
									<strong
										className={cn(
											"max-w-full shrink-0 text-[13px] font-[650] break-normal hyphens-auto",
											item.badge ? "line-clamp-1" : "line-clamp-2",
											short(item) && "min-w-0 shrink",
										)}
									>
										{item.title}
									</strong>
									{item.badge && (
										<Badge
											tone={badgeTones[item.badge.tone]}
											data-tone={item.badge.tone}
											className={cn(
												"max-w-full shrink-0 overflow-hidden px-1.5 py-0 text-ellipsis",
												short(item) &&
													"order-first size-2 bg-current p-0 text-[0px]",
											)}
										>
											{item.badge.text}
										</Badge>
									)}
									<span
										className={cn(
											"max-w-full shrink-0 overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap",
											short(item) ? "m-0" : "mt-auto",
										)}
									>
										{item.time}
									</span>
								</button>
							))}
						{now?.column === column.key &&
							now.minutes >= range.start * 60 &&
							now.minutes <= range.end * 60 && (
								<div
									data-slot="schedule-now"
									className="pointer-events-none absolute inset-x-0 z-[60] h-0.5 bg-primary before:absolute before:-top-1 before:-left-[5px] before:size-2.5 before:rounded-full before:bg-primary before:content-['']"
									aria-hidden="true"
									style={{ top: y(now.minutes) }}
								/>
							)}
						{drop?.column === column.key && dragged && (
							<div
								data-slot="schedule-drop"
								data-conflict={Boolean(drop.conflict)}
								className={cn(
									"pointer-events-none absolute inset-x-1 z-[70] flex flex-col rounded-lg border-2 border-dashed px-2 py-1.5 text-xs font-[650]",
									drop.conflict
										? "border-destructive bg-destructive-bg/85 text-destructive"
										: "border-primary bg-selection/75 text-primary",
								)}
								aria-hidden="true"
								style={{
									top: y(drop.start),
									height:
										((minutes(dragged.end) - minutes(dragged.start)) *
											hourHeight) /
										60,
								}}
							>
								{clock(drop.start)}–
								{clock(
									drop.start + minutes(dragged.end) - minutes(dragged.start),
								)}
								{drop.conflict && (
									<small className="text-xs font-medium">
										Choca con {drop.conflict}
									</small>
								)}
							</div>
						)}
					</section>
				))}
			</div>
			{empty}
		</section>
	);
}

const short = (item: GridItem) => minutes(item.end) - minutes(item.start) < 60;
const badgeTones: Record<GridBadge["tone"], Tone> = {
	cover: "lilac",
	moved: "warning",
	move: "warning",
	cancel: "danger",
};
const blockShadow =
	"hover:shadow-[0_4px_14px_-4px_color-mix(in_srgb,var(--block-line)_70%,transparent)]";
function blockClass(item: GridItem, active: boolean, dragging: boolean) {
	return cn(
		"absolute flex min-h-0 flex-col items-start gap-0.5 overflow-hidden rounded-lg px-2 pt-[7px] pb-1.5 pl-2.5 text-left leading-tight font-normal transition-shadow duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
		item.ghost
			? [
					"cursor-pointer border border-l-4 border-dashed border-input bg-card text-muted-foreground [border-left-style:solid]",
					item.ghost === "cancel" ? "border-brick" : "border-mustard",
					item.ghost === "cancel" && "[&_strong]:line-through",
				]
			: [
					"border-0 border-l-4 border-solid border-(color:--block-line) bg-(color:--block-bg) text-(color:--block-ink)",
					item.past &&
						"border-l-[color-mix(in_srgb,var(--block-line)_45%,var(--surface))] bg-[color-mix(in_srgb,var(--block-bg)_45%,var(--surface))]",
					item.draggable ? "cursor-grab" : "cursor-pointer",
				],
		short(item) && "flex-row items-center gap-1.5 py-0.5",
		blockShadow,
		active &&
			"shadow-[0_4px_14px_-4px_color-mix(in_srgb,var(--block-line)_70%,transparent)] outline-2 outline-offset-1 outline-(color:--block-line)",
		dragging && "opacity-40",
	);
}
