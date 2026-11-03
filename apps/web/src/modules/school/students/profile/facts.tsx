import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";

/** Label/value pairs of one record (grado y grupo, tutor). Not a metric: use Stat for numbers. */
export function Facts({
	items,
	className,
}: {
	items: { label: string; value: ReactNode }[];
	className?: string;
}) {
	return (
		<dl
			data-slot="facts"
			className={cn(
				"m-0 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4",
				className,
			)}
		>
			{items.map((item) => (
				<div key={item.label} className="min-w-0">
					<dt className="text-sm text-muted-foreground">{item.label}</dt>
					<dd className="m-0 mt-0.5 text-base font-semibold [overflow-wrap:anywhere]">
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
