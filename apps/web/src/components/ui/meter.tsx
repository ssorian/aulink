import { cn } from "../../lib/utils";
import { type Tone, toneFill } from "./tone";

const clamp = (value: number) =>
	Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

/** Single-value bar. Stacked segments: render several Meters or use RankedBars. */
export function Meter({
	percent,
	label,
	tone = "teal",
	className,
}: {
	percent: number;
	label: string;
	tone?: Tone;
	className?: string;
}) {
	const value = clamp(percent);
	return (
		// biome-ignore lint/a11y/useSemanticElements: <meter> cannot take a tone fill portably
		<div
			data-slot="meter"
			data-tone={tone}
			role="meter"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={value}
			className={cn(
				"h-2.5 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
		>
			<span
				className={cn("block h-full rounded-[inherit]", toneFill[tone])}
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}
