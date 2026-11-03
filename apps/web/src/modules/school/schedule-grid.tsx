import {
	type DragEvent,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Icon } from "../../components/ui/icon";
import { clock, minutes } from "./schedule-helpers";

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
	return (
		<section
			className="schedule-scroll"
			aria-label={label}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: El calendario necesita foco para desplazamiento horizontal y vertical con teclado.
			tabIndex={0}
		>
			<div
				className="schedule-grid"
				style={{
					gridTemplateColumns: template,
					minWidth: 56 + columns.length * 92 - compact.size * 36,
				}}
			>
				<div className="schedule-corner" />
				{columns.map((column) => (
					<div
						className="schedule-day-heading"
						data-compact={compact.has(column.key)}
						key={column.key}
						data-today={column.today === true}
					>
						<span className="schedule-day-short" title={column.label}>
							{column.short}
						</span>
						{column.day && <time dateTime={column.date}>{column.day}</time>}
						{column.today && <span className="schedule-hidden">, hoy</span>}
						{column.holiday && (
							<span className="schedule-day-tag" title={column.holiday}>
								Inhábil
							</span>
						)}
						{column.summary && !compact.has(column.key) && (
							<span className="schedule-day-summary">{column.summary}</span>
						)}
						{column.add && (
							<button
								type="button"
								className="schedule-day-add"
								aria-label={`Agregar clase el ${column.label.toLowerCase()}`}
								title={`Agregar clase el ${column.label.toLowerCase()}`}
								onClick={column.add}
							>
								<Icon name="plus" size={16} />
							</button>
						)}
					</div>
				))}
				<div className="schedule-axis" style={{ height }}>
					{hours.map((hour) => (
						<span key={hour} style={{ top: (hour - range.start) * hourHeight }}>
							{String(hour).padStart(2, "0")}:00
						</span>
					))}
				</div>
				{columns.map((column) => (
					<section
						key={column.key}
						className="schedule-day"
						data-compact={compact.has(column.key)}
						data-off={Boolean(column.holiday)}
						data-today={column.today === true}
						data-drop={drop?.column === column.key}
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
										className="schedule-slot"
										aria-label={`Agregar clase · ${column.label} ${clock(hour * 60)}`}
										style={{ top: (hour - range.start) * hourHeight }}
										onClick={() => onCreate(column.key, clock(hour * 60))}
									/>
								) : (
									<div
										key={hour}
										className="schedule-hour-line"
										style={{ top: (hour - range.start) * hourHeight }}
									/>
								),
							)}
						{column.end?.band && (
							<div
								className="schedule-end-band"
								aria-hidden="true"
								style={{
									top: top(column.end.band.start),
									height: top(column.end.band.end) - top(column.end.band.start),
								}}
							/>
						)}
						{column.end && (
							<div
								className="schedule-end-line"
								data-subtle={column.end.subtle === true}
								style={{ top: top(column.end.at) }}
							>
								<span>
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
									className="schedule-block"
									data-tone={item.tone}
									data-ghost={item.ghost}
									data-past={item.past}
									data-short={minutes(item.end) - minutes(item.start) < 60}
									data-dragging={dragged?.key === item.key && drop !== null}
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
										top: top(item.start),
										height: top(item.end) - top(item.start),
										left: item.side === "right" ? "50%" : 4,
										right: item.side === "left" ? "50%" : 4,
										zIndex: index + 3,
									}}
								>
									<strong>{item.title}</strong>
									{item.badge && (
										<span
											className="schedule-badge"
											data-tone={item.badge.tone}
										>
											{item.badge.text}
										</span>
									)}
									<span className="schedule-time">{item.time}</span>
								</button>
							))}
						{now?.column === column.key &&
							now.minutes >= range.start * 60 &&
							now.minutes <= range.end * 60 && (
								<div
									className="schedule-now"
									aria-hidden="true"
									style={{ top: y(now.minutes) }}
								/>
							)}
						{drop?.column === column.key && dragged && (
							<div
								className="schedule-drop"
								data-conflict={Boolean(drop.conflict)}
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
								{drop.conflict && <small>Choca con {drop.conflict}</small>}
							</div>
						)}
					</section>
				))}
			</div>
			{empty}
		</section>
	);
}

/**
 * Floating panel anchored to a class block. It keeps focus inside, follows the
 * block while the page or grid scrolls, and closes on Escape or an outside click.
 */
export function ClassPanel({
	anchor,
	title,
	children,
	onClose,
}: {
	anchor: HTMLElement;
	title: string;
	children: ReactNode;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
	useLayoutEffect(() => {
		const panel = ref.current;
		if (!panel) return;
		const place = () => {
			const box = anchor.getBoundingClientRect();
			const width = panel.offsetWidth;
			const right = box.right + 8;
			const left =
				right + width <= window.innerWidth - 8
					? right
					: Math.max(8, box.left - width - 8);
			const top = Math.min(
				Math.max(8, box.top),
				window.innerHeight - panel.offsetHeight - 8,
			);
			setPosition({ top: Math.max(8, top), left, ready: true });
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(panel);
		document.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			observer.disconnect();
			document.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [anchor]);
	useEffect(() => {
		const panel = ref.current;
		(
			panel?.querySelector<HTMLElement>("[data-autofocus]") ||
			panel?.querySelector<HTMLElement>(".schedule-panel-body button")
		)?.focus();
	}, []);
	useEffect(() => {
		const close = (event: Event) => {
			const node = event.target as Node | null;
			if (node && (ref.current?.contains(node) || anchor.contains(node)))
				return;
			if (node instanceof Element && node.closest("dialog, .flow-dialog"))
				return;
			onClose();
		};
		const onEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape" || document.querySelector("dialog[open]"))
				return;
			event.preventDefault();
			anchor.focus();
			onClose();
		};
		document.addEventListener("pointerdown", close);
		document.addEventListener("keydown", onEscape);
		return () => {
			document.removeEventListener("pointerdown", close);
			document.removeEventListener("keydown", onEscape);
		};
	}, [anchor, onClose]);
	function keep(e: KeyboardEvent<HTMLDivElement>) {
		if (e.key !== "Tab") return;
		const focusable = [
			...(ref.current?.querySelectorAll<HTMLElement>(
				"button:not(:disabled), input, select, textarea",
			) || []),
		];
		const first = focusable[0];
		const last = focusable.at(-1);
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last?.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first?.focus();
		}
	}
	return (
		<div
			ref={ref}
			className="schedule-panel"
			role="dialog"
			aria-label={title}
			onKeyDown={keep}
			style={{
				top: position.top,
				left: position.left,
				visibility: position.ready ? "visible" : "hidden",
			}}
		>
			<header>
				<h3>{title}</h3>
				<button
					type="button"
					className="schedule-panel-close"
					aria-label="Cerrar"
					onClick={() => {
						anchor.focus();
						onClose();
					}}
				>
					<Icon name="close" size={16} />
				</button>
			</header>
			{children}
		</div>
	);
}
