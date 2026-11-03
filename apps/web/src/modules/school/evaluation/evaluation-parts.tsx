import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

/** Section title + one line of context, with optional controls on the right. */
export function SectionHeading({
	title,
	description,
	children,
}: {
	title: string;
	description: ReactNode;
	children?: ReactNode;
}) {
	return (
		<header
			data-slot="section-heading"
			className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
		>
			<div>
				<h2 className="m-0 text-2xl leading-[1.25] font-[650] tracking-[-0.02em]">
					{title}
				</h2>
				<p className="mt-0.5 max-w-[72ch] text-sm leading-[1.6] text-muted-foreground">
					{description}
				</p>
			</div>
			{children}
		</header>
	);
}

/** Small explanatory text under an action ("not available"). */
export function ActionNote({ children }: { children: ReactNode }) {
	return (
		<small className="mt-1 block text-[13px] text-muted-foreground">
			{children}
		</small>
	);
}

/** Layout shared by every Evaluación screen: main column + side card. */
export const layoutClass =
	"grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6 max-[1180px]:grid-cols-1";

/** Filter row above the tables: four selects sized by content weight. */
export const filterRowClass =
	"mt-7 mb-3 grid grid-cols-[0.75fr_0.75fr_1.4fr_1.1fr] gap-2 *:min-w-0 max-md:grid-cols-2";
export const filterFieldClass = "rounded-lg";

/** Stat tiles inside a card: 12px radius and 28px figures. */
export const statClass =
	"rounded-lg [&_dt]:hyphens-auto [&_strong]:text-[28px] [&_strong]:leading-[1.5] [&_strong]:font-[650] [&_strong]:tracking-[-0.02em]";

/** Side card that sticks below 1180px as a normal block. */
export const sideClass = "sticky top-4 max-[1180px]:static";

/** Table skin for DataTable scroll regions (shared CSS stays untouched). */
export const tableScroll = (...extra: string[]) =>
	cn(
		"[&_table]:min-w-0 [&_table]:table-auto",
		"[&_caption]:sr-only",
		"[&_th]:px-3.5 [&_td]:px-3.5 [&_th]:py-2.5 [&_td]:py-2.5 [&_th]:align-middle [&_td]:align-middle [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap",
		"[&_td]:text-[14px] [&_thead_th]:bg-muted [&_thead_th]:font-semibold [&_tbody_th]:font-medium",
		"[&_tbody_th:first-child]:sticky [&_tbody_th:first-child]:left-0 [&_tbody_th:first-child]:z-2 [&_tbody_th:first-child]:bg-card [&_tbody_th:first-child]:shadow-[1px_0_0_var(--line)]",
		"[&_thead_th:first-child]:sticky [&_thead_th:first-child]:left-0 [&_thead_th:first-child]:z-2 [&_thead_th:first-child]:shadow-[1px_0_0_var(--line)]",
		"[&_tbody_tr:hover_td]:bg-background [&_tbody_tr:hover_th]:bg-background",
		...extra,
	);
