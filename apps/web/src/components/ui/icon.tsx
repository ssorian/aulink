const paths = {
	home: "m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8",
	monitor: "M3 3h18v14H3z M8 21h8 M12 17v4",
	upload: "M12 16V3 m-5 5 5-5 5 5 M3 16v5h18v-5",
	edit: "m16 3 5 5-12 12-6 1 1-6z M14 5l5 5",
	send: "m22 2-7 20-4-9-9-4z M22 2 11 13",
	grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
	users:
		"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
	user: "M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
	layers: "m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5",
	check:
		"M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
	card: "M3 5h18v14H3z M3 9h18 M7 14h4 M15 14h2",
	message:
		"M21 15a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2z M7 8h10 M7 12h6",
	heart:
		"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8",
	book: "M12 5v16 M12 5C9 2 5 2 2 4v16c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1",
	settings:
		"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M10 2h4l1 3 3 1 3 1v4l-3 1-1 3 1 3-3 3-3-1-3 1-3-3 1-3-1-3-3-1V7l3-1 1-3z",
	search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
	bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
	arrow: "M4 12h16 M14 6l6 6-6 6",
	back: "M20 12H4 M10 6l-6 6 6 6",
	plus: "M12 5v14 M5 12h14",
	chevron: "m9 5 7 7-7 7",
	down: "m6 9 6 6 6-6",
	calendar: "M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4 M7 14h3 M14 14h3",
	clock: "M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
	download: "M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5",
	help: "M9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
	close: "m6 6 12 12 M6 18 18 6",
	menu: "M3 6h18 M3 12h18 M3 18h18",
	leaf: "M20 3C8 2 2 8 5 15s15 5 15-12 M4 21 15 10",
	trend: "m3 17 6-6 4 4 8-10 M15 5h6v6",
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
	return (
		<svg
			className="ui-icon"
			focusable="false"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.65"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={paths[name]} />
		</svg>
	);
}
