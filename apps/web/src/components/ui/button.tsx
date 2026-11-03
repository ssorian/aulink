import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** Base sets border, background and min-height explicitly: the legacy global `button` rule also sets them. */
export const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-solid text-sm font-semibold leading-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "border-input bg-card text-foreground hover:bg-muted",
				primary:
					"border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
				ghost: "border-transparent bg-transparent text-primary hover:bg-muted",
				link: "min-h-0 border-transparent bg-transparent p-0 text-primary underline-offset-2 hover:bg-transparent hover:underline",
				danger:
					"border-destructive bg-destructive-bg text-destructive hover:bg-destructive hover:text-primary-foreground",
				icon: "border-transparent bg-transparent p-0 text-primary hover:bg-muted",
			},
			size: {
				default: "min-h-11 px-4 py-2",
				sm: "min-h-11 px-3 py-1.5 text-[13px]",
				lg: "min-h-12 px-5 py-2.5",
			},
		},
		compoundVariants: [
			{ variant: "link", className: "px-0 py-0" },
			{ variant: "icon", className: "size-11 min-h-11 px-0 py-0" },
		],
		defaultVariants: { variant: "default", size: "default" },
	},
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

export function Button({
	variant = "default",
	size,
	type = "button",
	className,
	...props
}: ButtonProps) {
	return (
		<button
			data-slot="button"
			data-variant={variant}
			type={type}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
