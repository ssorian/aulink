import type { Field } from "./flow-dialog";

const emailPattern =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
const numberPattern = /^-?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/;

export function validateFlow(fields: Field[], values: Record<string, string>) {
	const errors: Record<string, string> = {};
	for (const field of fields) {
		const value = (values[field.key] || "").trim();
		if (!value) {
			if (!field.optional) errors[field.key] = `Completa ${field.label}.`;
		} else if (field.type === "email" && !emailPattern.test(value)) {
			errors[field.key] = "Introduce un correo válido.";
		} else if (
			field.type === "number" &&
			(!numberPattern.test(value) || !Number.isFinite(Number(value)))
		) {
			errors[field.key] = "Introduce un número finito válido.";
		} else if (
			field.options &&
			!field.options.some((option) => option.value === value)
		) {
			errors[field.key] = "Selecciona una opción disponible.";
		}
		if (!errors[field.key]) {
			const contextualError = field.validate?.(value, values);
			if (contextualError) errors[field.key] = contextualError;
		}
	}
	return errors;
}
