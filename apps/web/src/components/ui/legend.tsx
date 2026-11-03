import { cn } from "../../lib/utils";
import { type Tone, toneFill } from "./tone";

export function Legend({
	label,
	items,
	className,
}: {
	label: string;
	items: { tone: Tone; label: string }[];
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
					className="inline-flex items-center gap-1.5"
				>
					<span
						aria-hidden="true"
						className={cn("size-2 shrink-0 rounded-full", toneFill[item.tone])}
					/>
					{item.label}
				</li>
			))}
		</ul>
	);
}
