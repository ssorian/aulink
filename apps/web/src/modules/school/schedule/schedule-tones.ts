import type { CSSProperties } from "react";
import type { State } from "../shared/workflows";

/**
 * Subject colours: one family per subject index. They do not match the shared
 * tone tokens exactly (the line colour is darker than the palette tone), so
 * blocks and filter rows read them through CSS custom properties.
 */
const blockTones = [
	{ bg: "#e6eff9", line: "#6f9fd4", ink: "#2f5378" },
	{ bg: "#f9ebde", line: "#d9925a", ink: "#74451b" },
	{ bg: "#e3f1e7", line: "#5a9e6e", ink: "#2b5b3a" },
	{ bg: "#f8e5ee", line: "#cc6f99", ink: "#7a2c50" },
	{ bg: "#faf5d3", line: "#c9b23a", ink: "#574b0e" },
	{ bg: "#e5eafb", line: "#5f7ddc", ink: "#2c4390" },
	{ bg: "#eef1df", line: "#93a64a", ink: "#45501d" },
	{ bg: "#f3ece2", line: "#b39069", ink: "#5c4428" },
] as const;

export function toneVars(index: number): CSSProperties {
	const tone = blockTones[index % blockTones.length];
	return {
		"--block-bg": tone.bg,
		"--block-line": tone.line,
		"--block-ink": tone.ink,
	} as CSSProperties;
}

/**
 * One colour per subject across the school, in order of first creation, so a
 * subject keeps its colour in every group and new subjects never repaint old ones.
 */
export function subjectTones(s: State) {
	const order: string[] = [];
	for (const a of s.assignments) {
		const subject = a.subject.trim().toLowerCase();
		if (!order.includes(subject)) order.push(subject);
	}
	return (subject: string) =>
		Math.max(order.indexOf(subject.trim().toLowerCase()), 0) % 8;
}
