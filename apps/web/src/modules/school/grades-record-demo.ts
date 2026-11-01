export const GRADES_TODAY = "2026-10-23";
export const DEMO_PERIODS = [
	{
		name: "Primer trimestre",
		aliases: ["Periodo 1 · Muestra"],
		start: "2026-08-24",
		end: "2026-10-02",
	},
	{
		name: "Segundo trimestre",
		aliases: ["Periodo 2 · Muestra"],
		start: "2026-10-05",
		end: "2026-11-13",
	},
	{
		name: "Tercer trimestre",
		aliases: ["Periodo 3 · Muestra"],
		start: "2026-11-16",
		end: "2027-02-05",
	},
];
export function demoPeriod(name: string, recent: boolean) {
	const sample = DEMO_PERIODS.find(
		(p) => p.name === name || p.aliases.includes(name),
	);
	return {
		name: sample?.name ?? name,
		start: recent ? (sample?.start ?? "2026-08-24") : "2025-08-25",
		end: recent ? (sample?.end ?? "2026-10-02") : "2026-07-31",
	};
}
