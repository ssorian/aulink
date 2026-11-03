import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** Label wrapper for any native control; `id` must match the control's id. */
export function Field({
	id,
	label,
	children,
	className,
}: {
	id: string;
	label: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label
			data-slot="field"
			htmlFor={id}
			className={cn(
				"flex flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card pr-1 pl-3.5 text-[13px] font-medium text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
				className,
			)}
		>
			<span className="shrink-0">{label}</span>
			{children}
		</label>
	);
}

export type SelectProps = {
	id: string;
	label: string;
	value: string;
	all?: string;
	items: { value: string; label: string }[];
	onChange: (value: string) => void;
	className?: string;
} & Omit<
	SelectHTMLAttributes<HTMLSelectElement>,
	"id" | "value" | "onChange" | "className"
>;

export function Select({
	id,
	label,
	value,
	all,
	items,
	onChange,
	className,
	...rest
}: SelectProps) {
	return (
		<Field id={id} label={label} className={className}>
			<select
				data-slot="select"
				id={id}
				value={value}
				disabled={!items.length}
				onChange={(e) => onChange(e.target.value)}
				className="min-h-11 w-auto min-w-0 flex-1 border-0 bg-transparent py-0 pl-0 font-semibold text-foreground outline-none focus-visible:outline-none"
				{...rest}
			>
				{all !== undefined && <option value="">{all}</option>}
				{!items.length && all === undefined && (
					<option value="">Sin opciones</option>
				)}
				{items.map((item) => (
					<option key={item.value} value={item.value}>
						{item.label}
					</option>
				))}
			</select>
		</Field>
	);
}
