import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card } from "./card";
import { type Tone, toneSurface } from "./tone";

/**
 * Module-agnostic "post": a marker, a one-line header, a body and a footer.
 * Notices and conduct reports both compose it; domain wording stays with the caller.
 */
export function PostCard({
	tone,
	state,
	className,
	...props
}: HTMLAttributes<HTMLElement> & {
	tone?: Tone;
	/** `blocked` outlines the card in brick; any other value is only exposed as `data-state`. */
	state?: string;
}) {
	return (
		<Card
			as="article"
			padding="none"
			tone={tone}
			data-slot="post-card"
			data-state={state}
			className={cn(
				"rounded-2xl px-6 pt-5 pb-3.5 transition-shadow duration-200 hover:shadow-[0_10px_28px_-18px_rgb(31_45_54/0.35)] motion-reduce:transition-none max-[760px]:p-4",
				state === "blocked" && "border-brick/45",
				className,
			)}
			{...props}
		/>
	);
}

/** Round badge for the post header: initials, an icon or any short node. */
export function PostMarker({
	tone = "teal",
	pending = false,
	className,
	children,
}: {
	tone?: Tone;
	/** Mustard halo for work that is not published yet. */
	pending?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			data-slot="post-marker"
			data-tone={tone}
			aria-hidden="true"
			className={cn(
				"grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold tracking-wide",
				toneSurface[tone],
				pending && "ring-2 ring-mustard ring-offset-2 ring-offset-card",
				className,
			)}
		>
			{children}
		</span>
	);
}

/** `lead` (usually a PostMarker), the headline as children, and an optional `aside` on the right. */
export function PostHeader({
	lead,
	aside,
	className,
	children,
}: {
	lead?: ReactNode;
	aside?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	return (
		<header
			data-slot="post-header"
			className={cn(
				"flex items-center gap-3 text-sm max-[760px]:items-start",
				className,
			)}
		>
			{lead}
			<div className="min-w-0 flex-1">{children}</div>
			{aside}
		</header>
	);
}

/** Content column; `indent` aligns it under the headline instead of under the marker. */
export function PostBody({
	indent = false,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & { indent?: boolean }) {
	return (
		<div
			data-slot="post-body"
			className={cn(
				"mt-3 flex flex-col gap-2.5",
				indent && "ml-12 max-[760px]:ml-0",
				className,
			)}
			{...props}
		/>
	);
}

export function PostTitle({
	className,
	...props
}: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			data-slot="post-title"
			className={cn(
				"m-0 -mb-1.5 text-[21px] leading-tight font-[650] tracking-tight text-balance max-[760px]:text-lg",
				className,
			)}
			{...props}
		/>
	);
}

export function PostText({
	clamp = false,
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement> & { clamp?: boolean }) {
	return (
		<p
			data-slot="post-text"
			className={cn(
				"m-0 max-w-[75ch] whitespace-pre-wrap",
				clamp && "line-clamp-3",
				className,
			)}
			{...props}
		/>
	);
}

export function PostFooter({
	className,
	...props
}: HTMLAttributes<HTMLElement>) {
	return (
		<footer
			data-slot="post-footer"
			className={cn(
				"mt-3.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-0 p-0 text-base text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

/** Right-aligned button row; stacks full-width on narrow screens. */
export function PostActions({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="post-actions"
			className={cn(
				"ml-auto flex flex-wrap gap-2 max-[760px]:ml-0 max-[760px]:w-full max-[760px]:*:flex-[1_1_100%]",
				className,
			)}
			{...props}
		/>
	);
}

/** Native disclosure with a chevron; `summary` is the always-visible line. */
export function PostDetails({
	summary,
	className,
	children,
}: {
	summary: ReactNode;
	className?: string;
	children?: ReactNode;
}) {
	return (
		<details
			data-slot="post-details"
			className={cn("group min-w-0 flex-[1_1_320px]", className)}
		>
			<summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2.5 text-[13px] font-semibold text-primary after:ml-0.5 after:size-[7px] after:-translate-y-0.5 after:rotate-45 after:border-r-[1.5px] after:border-b-[1.5px] after:border-current after:transition-transform after:content-[''] group-open:after:translate-y-0.5 group-open:after:-rotate-135 motion-reduce:after:transition-none [&::-webkit-details-marker]:hidden">
				{summary}
			</summary>
			{children}
		</details>
	);
}

/** Segmented single-choice filter (aria-pressed buttons) for a post list. */
export function PostFilterToggle<T extends string>({
	label,
	options,
	value,
	onChange,
	className,
}: {
	label: string;
	options: readonly { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
}) {
	return (
		<fieldset
			data-slot="post-filter-toggle"
			className={cn(
				"m-0 flex min-w-0 rounded-xl border border-border bg-card p-[3px] max-[760px]:w-full",
				className,
			)}
		>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<button
					key={option.value || "all"}
					type="button"
					aria-pressed={value === option.value}
					onClick={() => onChange(option.value)}
					className="min-h-11 cursor-pointer rounded-[9px] border-0 bg-transparent px-[18px] text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground max-[760px]:flex-1 max-[760px]:px-1.5"
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
