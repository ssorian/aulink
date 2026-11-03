import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import "./chip-tooltip.css";

// Dark palette inks keep white text readable; light palette fills would not.
const TONES = [
	"teal",
	"lilac",
	"sky",
	"mustard",
	"brick",
	"brown",
	"peach",
	"lemon",
] as const;

/** Same name, same color, in every row. */
export function chipTone(name: string) {
	let hash = 0;
	for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return `tone-${TONES[hash % TONES.length]}`;
}

export function chipLabel(count: number, one: string, many: string) {
	return `${count} ${count === 1 ? one : many}`;
}

/** Count badge whose tooltip lists every item as a colored card. */
export function ChipTooltip({
	items,
	one,
	many,
}: {
	items: string[];
	one: string;
	many: string;
}) {
	const id = useId();
	const trigger = useRef<HTMLButtonElement>(null);
	const [position, setPosition] = useState<CSSProperties>();
	const show = () => {
		const rect = trigger.current?.getBoundingClientRect();
		if (rect) setPosition({ top: rect.bottom + 6, left: rect.left });
	};
	const hide = () => setPosition(undefined);
	// Fixed positioning escapes the table's scroll clipping, so close on any scroll.
	useEffect(() => {
		if (!position) return;
		window.addEventListener("scroll", hide, true);
		window.addEventListener("resize", hide);
		return () => {
			window.removeEventListener("scroll", hide, true);
			window.removeEventListener("resize", hide);
		};
	}, [position]);
	if (!items.length) return "—";
	return (
		<span
			className="chip-tooltip-anchor"
			onMouseEnter={show}
			onMouseLeave={hide}
			onFocus={show}
			onBlur={hide}
			onKeyDown={(e) => e.key === "Escape" && hide()}
		>
			<button
				ref={trigger}
				type="button"
				className="chip-tooltip-trigger stripe-border"
				aria-label={chipLabel(items.length, one, many)}
				aria-describedby={id}
			>
				{items.length}
			</button>
			<ul
				role="tooltip"
				id={id}
				className="chip-tooltip"
				data-open={position ? "" : undefined}
				style={position}
			>
				{items.map((item) => (
					<li key={item} className={`chip ${chipTone(item)}`}>
						{item}
					</li>
				))}
			</ul>
		</span>
	);
}
