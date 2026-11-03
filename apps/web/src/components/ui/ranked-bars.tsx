import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Meter } from "./meter";
import type { Tone } from "./tone";

export type RankedBarRow = {
	id: string;
	label: string;
	/** 0..100 bar length. */
	value: number;
	/** Text shown at the end of the row. */
	display: string;
	tone: Tone;
	onSelect?: () => void;
};

export function RankedBars({
	label,
	rows,
	className,
}: {
	label: string;
	rows: RankedBarRow[];
	className?: string;
}) {
	return (
		<ul
			data-slot="ranked-bars"
			aria-label={label}
			className={cn("m-0 list-none p-0", className)}
		>
			{rows.map((row) => (
				<li
					key={row.id}
					data-slot="ranked-bar"
					data-tone={row.tone}
					className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-border py-2 first:border-t-0 sm:grid-cols-[minmax(120px,180px)_minmax(0,1fr)_auto]"
				>
					{row.onSelect ? (
						<Button
							variant="link"
							size="sm"
							className="justify-self-start truncate text-left"
							onClick={row.onSelect}
						>
							{row.label}
						</Button>
					) : (
						<span className="truncate text-sm font-semibold">{row.label}</span>
					)}
					<Meter
						percent={row.value}
						label={row.label}
						tone={row.tone}
						className="order-last col-span-full h-3 sm:order-none sm:col-span-1"
					/>
					<span className="justify-self-end text-base font-semibold whitespace-nowrap">
						{row.display}
					</span>
				</li>
			))}
		</ul>
	);
}
