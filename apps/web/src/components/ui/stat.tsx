import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { type Tone, toneSurface } from "./tone";

/** Domain states map to tones so callers can say `state="published"` and tests stay class-free. */
const stateTone: Record<string, Tone> = {
	published: "success",
	draft: "mustard",
	missing: "brick",
	groups: "teal",
};

export function StatGrid({
	label,
	className,
	...props
}: HTMLAttributes<HTMLDListElement> & { label?: string }) {
	return (
		<dl
			data-slot="stat-grid"
			aria-label={label}
			className={cn("m-0 grid grid-cols-2 gap-3 md:grid-cols-4", className)}
			{...props}
		/>
	);
}

export function Stat({
	label,
	value,
	caption,
	tone,
	state,
	className,
}: {
	label: ReactNode;
	value: ReactNode;
	caption?: ReactNode;
	tone?: Tone;
	state?: string;
	className?: string;
}) {
	const resolved = tone ?? (state ? stateTone[state] : undefined) ?? "neutral";
	return (
		<div
			data-slot="stat"
			data-tone={tone}
			data-state={state}
			className={cn("rounded-xl px-3.5 py-3", toneSurface[resolved], className)}
		>
			<dt className="text-[13px] font-semibold">{label}</dt>
			<dd className="m-0 mt-0.5 flex items-baseline gap-2">
				<strong className="text-3xl font-semibold tracking-tight">
					{value}
				</strong>
				{caption !== undefined && (
					<span className="text-sm font-semibold">{caption}</span>
				)}
			</dd>
		</div>
	);
}
