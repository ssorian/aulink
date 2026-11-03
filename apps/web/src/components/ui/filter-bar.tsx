import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** Wrapping row for Select/Field filters. */
export function FilterBar({
	label,
	className,
	...props
}: HTMLAttributes<HTMLFieldSetElement> & { label: string }) {
	return (
		<fieldset
			data-slot="filter-bar"
			aria-label={label}
			className={cn(
				"m-0 my-3 flex min-w-0 border-0 p-0 flex-wrap gap-2 *:min-w-40",
				className,
			)}
			{...props}
		/>
	);
}
