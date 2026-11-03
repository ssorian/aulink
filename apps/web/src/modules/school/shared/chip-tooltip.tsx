import { type CSSProperties, useEffect, useId, useRef, useState } from "react";

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

/** Solid ink fill per tone; the `tone-*` class stays as a stable hook. */
const CHIP_FILL: Record<(typeof TONES)[number], string> = {
	teal: "bg-teal-ink",
	lilac: "bg-lilac-ink",
	sky: "bg-sky-ink",
	mustard: "bg-mustard-ink",
	brick: "bg-brick-ink",
	brown: "bg-brown-ink",
	peach: "bg-peach-ink",
	lemon: "bg-lemon-ink",
};
const chipFill = (tone: string) =>
	CHIP_FILL[tone.slice("tone-".length) as (typeof TONES)[number]];

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
				className="chip-tooltip-trigger stripe-border min-h-7 min-w-8 rounded-sm px-2 py-0.5 font-medium text-foreground tabular-nums [--stripe-fill:var(--color-muted)] hover:[--stripe-fill:var(--color-border)] pointer-coarse:min-h-11"
				aria-label={chipLabel(items.length, one, many)}
				aria-describedby={id}
			>
				{items.length}
			</button>
			<ul
				role="tooltip"
				id={id}
				className="chip-tooltip fixed z-50 m-0 hidden max-w-80 list-none gap-1.5 rounded-md border border-border bg-card p-2 shadow-[0_8px_24px_rgb(0_0_0/0.12)] data-open:flex data-open:flex-col data-open:items-start"
				data-open={position ? "" : undefined}
				style={position}
			>
				{items.map((item) => (
					<li
						key={item}
						className={`chip ${chipTone(item)} ${chipFill(chipTone(item))} rounded-sm px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap text-white`}
					>
						{item}
					</li>
				))}
			</ul>
		</span>
	);
}
