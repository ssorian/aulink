import { z } from "zod";
import type { Field } from "./flow-dialog";

function validDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function cycleDateError(startDate?: string, endDate?: string) {
	if (!startDate || !endDate) return "Completa la fecha de inicio y la fecha de cierre.";
	if (!validDate(startDate) || !validDate(endDate)) return "Ingresa fechas válidas de inicio y cierre.";
	if (endDate < startDate) return "La fecha de cierre debe ser igual o posterior a la fecha de inicio.";
}

export const cycleSchema = z.object({
	id: z.string(),
	name: z.string(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
}).refine((cycle) =>
	(cycle.startDate === undefined && cycle.endDate === undefined) ||
	!cycleDateError(cycle.startDate, cycle.endDate),
	{ message: "Revisa las fechas de inicio y cierre del ciclo." },
);

export function cycleDateFields(): Field[] {
	return [
		{ key: "startDate", label: "Fecha de inicio", type: "date", validate: (value) => validDate(value) ? undefined : "Ingresa una fecha de inicio válida." },
		{ key: "endDate", label: "Fecha de cierre", type: "date", validate: (value, values) => cycleDateError(values.startDate, value) },
	];
}

export function cycleDates(data: Record<string, string>, optional = false) {
	if (optional && data.startDate === undefined && data.endDate === undefined) return {};
	const error = cycleDateError(data.startDate, data.endDate);
	if (error) throw Error(error);
	return { startDate: data.startDate, endDate: data.endDate };
}
