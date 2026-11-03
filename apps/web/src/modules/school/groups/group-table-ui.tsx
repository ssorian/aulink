import { cn } from "../../../lib/utils";

/** Wrapper classes that restyle the shared DataTable cells without CSS files. */
export const tableCells =
	"min-w-0 [&_caption]:sr-only [&_table]:min-w-0 [&_table]:table-auto [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:align-middle";
/** Sticky first column for wide tables (names stay visible while scrolling). */
export const stickyFirstColumn =
	"[&_tbody_th:first-child]:sticky [&_tbody_th:first-child]:left-0 [&_tbody_th:first-child]:z-[2] [&_tbody_th:first-child]:bg-card [&_tbody_th:first-child]:shadow-[1px_0_0_var(--line)] [&_thead_th:first-child]:sticky [&_thead_th:first-child]:left-0 [&_thead_th:first-child]:z-[2] [&_thead_th:first-child]:bg-muted [&_thead_th:first-child]:shadow-[1px_0_0_var(--line)] [&_tbody_tr:hover_th:first-child]:bg-background";
/** Secondary line under a table cell (matrícula, scale…). */
export const cellNote =
	"block text-xs font-normal leading-[1.6] text-muted-foreground";

/** Day/week/month and evaluation switch: a pressed-state segmented control. */
export function Segmented<T extends string>({
	label,
	items,
	value,
	onChange,
	className,
}: {
	label: string;
	items: readonly { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
}) {
	return (
		<fieldset
			data-slot="segmented"
			className={cn(
				"m-0 flex min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-card p-px [scrollbar-width:none]",
				className,
			)}
		>
			<legend className="sr-only">{label}</legend>
			{items.map((item) => (
				<button
					type="button"
					key={item.value || "total"}
					aria-pressed={value === item.value}
					onClick={() => onChange(item.value)}
					className="min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-[9px] border-0 bg-transparent px-[18px] text-sm font-semibold text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					{item.label}
				</button>
			))}
		</fieldset>
	);
}

/** Square fills for attendance/grade cells; theme tokens only. */
export const dotFill = {
	complete: "bg-success-fill",
	partial: "bg-mustard",
	absent: "bg-brick",
	review: "bg-input",
	none: "bg-[#e3e9ed]",
	empty: "bg-transparent shadow-[inset_0_0_0_1px_var(--control-line)]",
} as const;
export type DotKind = keyof typeof dotFill;
