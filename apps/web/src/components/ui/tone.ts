/** Shared tone vocabulary. Class maps are written out so Tailwind can see every utility. */
export type Tone =
	| "neutral"
	| "teal"
	| "lilac"
	| "sky"
	| "mustard"
	| "brick"
	| "brown"
	| "peach"
	| "lemon"
	| "success"
	| "warning"
	| "danger";

/** Soft fill + readable ink. */
export const toneSurface: Record<Tone, string> = {
	neutral: "bg-muted text-foreground",
	teal: "bg-teal-bg text-teal-ink",
	lilac: "bg-lilac-bg text-lilac-ink",
	sky: "bg-sky-bg text-sky-ink",
	mustard: "bg-mustard-bg text-mustard-ink",
	brick: "bg-brick-bg text-brick-ink",
	brown: "bg-brown-bg text-brown-ink",
	peach: "bg-peach-bg text-peach-ink",
	lemon: "bg-lemon-bg text-lemon-ink",
	success: "bg-success-bg text-success",
	warning: "bg-warning-bg text-warning",
	danger: "bg-destructive-bg text-destructive",
};

/** Solid fill for dots and bars. */
export const toneFill: Record<Tone, string> = {
	neutral: "bg-input",
	teal: "bg-teal",
	lilac: "bg-lilac",
	sky: "bg-sky",
	mustard: "bg-mustard",
	brick: "bg-brick",
	brown: "bg-brown",
	peach: "bg-peach",
	lemon: "bg-lemon",
	success: "bg-success",
	warning: "bg-mustard",
	danger: "bg-destructive",
};
