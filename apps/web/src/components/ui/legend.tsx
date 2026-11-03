import { cn } from "../../lib/utils";
import { type Tone, toneFill, toneRing } from "./tone";

export type LegendItem = {
	tone: Tone;
	label: string;
	hollow?: boolean;
	id?: string;
};

export function Legend({
	label,
	items,
	hook,
	className,
}: {
	label: string;
	/** `hollow` draws a ring instead of a fill; `id` is exposed through `hook`. */
	items: LegendItem[];
	hook?: "data-status" | "data-state";
	className?: string;
}) {
	return (
		<ul
			data-slot="legend"
			aria-label={label}
			className={cn(
				"m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-muted-foreground",
				className,
			)}
		>
			{items.map((item) => (
				<li
					key={item.label}
					data-tone={item.tone}
					{...(hook && item.id ? { [hook]: item.id } : {})}
					data-hollow={item.hollow ? "true" : undefined}
					className="inline-flex items-center gap-1.5"
				>
					<span
						aria-hidden="true"
						className={cn(
							"size-2 shrink-0 rounded-full",
							item.hollow ? toneRing[item.tone] : toneFill[item.tone],
						)}
					/>
					{item.label}
				</li>
			))}
		</ul>
	);
}
