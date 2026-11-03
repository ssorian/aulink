import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import type { Tone } from "./tone";

const cardVariants = cva(
	"rounded-xl border border-border bg-card text-card-foreground",
	{
		variants: {
			padding: { none: "", default: "p-5", compact: "p-4" },
		},
		defaultVariants: { padding: "default" },
	},
);

export type CardProps = HTMLAttributes<HTMLElement> &
	VariantProps<typeof cardVariants> & {
		as?: "article" | "section";
		tone?: Tone;
	};

export function Card({
	as: Root = "section",
	tone,
	padding,
	className,
	...props
}: CardProps) {
	return (
		<Root
			data-slot="card"
			data-tone={tone}
			className={cn(cardVariants({ padding }), className)}
			{...props}
		/>
	);
}

export function CardHeader({
	className,
	...props
}: HTMLAttributes<HTMLElement>) {
	return (
		<header
			data-slot="card-header"
			className={cn(
				"mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
				className,
			)}
			{...props}
		/>
	);
}

export function CardTitle({
	className,
	...props
}: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			data-slot="card-title"
			className={cn("m-0 text-lg font-semibold tracking-tight", className)}
			{...props}
		/>
	);
}

export function CardContent({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="card-content"
			className={cn("min-w-0", className)}
			{...props}
		/>
	);
}

export function CardFooter({
	className,
	...props
}: HTMLAttributes<HTMLElement>) {
	return (
		<footer
			data-slot="card-footer"
			className={cn(
				"mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}
