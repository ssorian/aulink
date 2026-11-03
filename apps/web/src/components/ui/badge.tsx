import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { type Tone, toneSurface } from "./tone";

export function Badge({
	tone = "neutral",
	className,
	...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
	return (
		<span
			data-slot="badge"
			data-tone={tone}
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
				toneSurface[tone],
				className,
			)}
			{...props}
		/>
	);
}
