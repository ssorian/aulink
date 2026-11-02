import {
	type DragEvent,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { clock, minutes } from "./schedule-helpers";

export const hourHeight = 56;
/** Drops snap to quarter hours; a class can never end past 23:45. */
const snap = 15;
const lastStart = (duration: number) =>
	Math.floor((23 * 60 + 59 - duration) / snap) * snap;

export type GridColumn = {
	key: string;
	label: string;
	/** Day of month shown as the large number; absent in the weekly structure. */
	day?: string;
	date?: string;
	today?: boolean;
	note: string;
	noteTitle?: string;
	off?: boolean;
};
export type GridItem = {
	key: string;
	column: string;
	start: string;
	end: string;
	title: string;
	detail: string;
	status: string;
	tone: number;
	draggable: boolean;
	/** Cancelled/moved ghosts share their slot with the class that replaced them. */
	side: "full" | "left" | "right";
	label: string;
	hint: string;
	covered?: boolean;
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
	onSelect,
	onMove,
	onCreate,
}: {
	columns: GridColumn[];
	items: GridItem[];
	label: string;
	activeKey?: string;
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
	const [drop, setDrop] = useState<{ column: string; start: number } | null>(
		null,
	);
	const top = (time: string) =>
		((minutes(time) - range.start * 60) * hourHeight) / 60;
	function target(e: DragEvent<HTMLElement>) {
		const current = drag.current;
		if (!current) return null;
		const duration = minutes(current.item.end) - minutes(current.item.start);
		const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
		const raw = range.start * 60 + ((y - current.offset) / hourHeight) * 60;
		return Math.min(
			Math.max(Math.round(raw / snap) * snap, 0),
			lastStart(duration),
		);
	}
	const dragged = drag.current?.item;
	return (
		<section
			className="schedule-scroll"
			aria-label={label}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: El calendario necesita foco para desplazamiento horizontal y vertical con teclado.
			tabIndex={0}
		>
			<div className="schedule-grid">
				<div className="schedule-corner">Hora</div>
				{columns.map((column) => (
					<div
						className="schedule-day-heading"
						key={column.key}
						data-today={column.today === true}
					>
						<div className="schedule-day-title">
							<span>
								{column.label}
								{column.today && <small>Hoy</small>}
							</span>
							{column.day && <time dateTime={column.date}>{column.day}</time>}
						</div>
						<p title={column.noteTitle}>{column.note}</p>
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
						className={`schedule-day ${column.off ? "schedule-day-off" : ""}`}
						data-drop={drop?.column === column.key}
						style={{ height }}
						aria-label={
							column.date ? `${column.label} ${column.date}` : column.label
						}
						onDragOver={(e) => {
							const start = target(e);
							if (start === null) return;
							e.preventDefault();
							e.dataTransfer.dropEffect = "move";
							if (drop?.column !== column.key || drop.start !== start)
								setDrop({ column: column.key, start });
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
						{hours.slice(0, -1).map((hour) =>
							onCreate ? (
								<button
									type="button"
									key={hour}
									tabIndex={-1}
									className="schedule-slot"
									aria-label={`Agregar clase · ${column.label} ${clock(hour * 60)}`}
									style={{
										top: (hour - range.start) * hourHeight,
										height: hourHeight,
									}}
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
						{items
							.filter((item) => item.column === column.key)
							.map((item, index) => (
								<button
									type="button"
									key={item.key}
									className={`schedule-block schedule-${item.status} ${minutes(item.end) - minutes(item.start) < 60 ? "schedule-short" : ""}`}
									data-tone={item.tone}
									data-dragging={dragged?.key === item.key && drop !== null}
									aria-haspopup="dialog"
									aria-expanded={activeKey === item.key}
									aria-label={item.label}
									title={item.hint}
									draggable={item.draggable}
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
										zIndex: index + 2,
									}}
								>
									<strong>{item.title}</strong>
									<span>
										{item.start}–{item.end}
									</span>
									<span
										className="schedule-block-status"
										data-covered={item.covered}
									>
										{item.detail}
									</span>
								</button>
							))}
						{drop?.column === column.key && dragged && (
							<div
								className="schedule-drop"
								aria-hidden="true"
								style={{
									top: ((drop.start - range.start * 60) * hourHeight) / 60,
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
							</div>
						)}
					</section>
				))}
			</div>
		</section>
	);
}

export type MenuAction = {
	label: string;
	run: () => void;
	tone?: "danger";
};

/** Floating panel anchored to a class block; Escape or an outside click closes it. */
export function ClassMenu({
	anchor,
	title,
	children,
	actions,
	onClose,
}: {
	anchor: HTMLElement;
	title: string;
	children: ReactNode;
	actions: MenuAction[];
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
	useLayoutEffect(() => {
		const panel = ref.current;
		if (!panel) return;
		const box = anchor.getBoundingClientRect();
		const width = panel.offsetWidth;
		const panelHeight = panel.offsetHeight;
		const right = box.right + 8;
		const left =
			right + width <= window.innerWidth - 8
				? right
				: Math.max(8, box.left - width - 8);
		const top = Math.min(
			Math.max(8, box.top),
			window.innerHeight - panelHeight - 8,
		);
		setPosition({ top, left, ready: true });
		panel.querySelector("button")?.focus();
	}, [anchor]);
	useEffect(() => {
		const close = (event: Event) => {
			const node = event.target as Node | null;
			if (node && (ref.current?.contains(node) || anchor.contains(node)))
				return;
			onClose();
		};
		const key = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			anchor.focus();
			onClose();
		};
		document.addEventListener("pointerdown", close);
		document.addEventListener("scroll", close, true);
		document.addEventListener("keydown", key);
		window.addEventListener("resize", onClose);
		return () => {
			document.removeEventListener("pointerdown", close);
			document.removeEventListener("scroll", close, true);
			document.removeEventListener("keydown", key);
			window.removeEventListener("resize", onClose);
		};
	}, [anchor, onClose]);
	return (
		<div
			ref={ref}
			className="schedule-menu"
			role="dialog"
			aria-label={title}
			style={{
				top: position.top,
				left: position.left,
				visibility: position.ready ? "visible" : "hidden",
			}}
		>
			<h3>{title}</h3>
			<div className="schedule-menu-body">{children}</div>
			<div className="schedule-menu-actions">
				{actions.map((action) => (
					<button
						type="button"
						key={action.label}
						data-tone={action.tone}
						onClick={() => {
							anchor.focus();
							onClose();
							action.run();
						}}
					>
						{action.label}
					</button>
				))}
			</div>
		</div>
	);
}
