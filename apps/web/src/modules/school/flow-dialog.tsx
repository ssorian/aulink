import { useEffect, useRef, useState } from "react";
import { validateFlow } from "./flow-validation";
export type Field = {
	key: string;
	label: string;
	options?: { value: string; label: string }[];
	type?: string;
	optional?: boolean;
	rows?: number;
	validate?: (
		value: string,
		values: Record<string, string>,
	) => string | undefined;
};
export type Flow = {
	kind: string;
	title: string;
	description: string;
	fields: Field[];
	values: Record<string, string>;
	preview?: string[];
};
export const flowDraftKey = (flow: Flow) =>
	[
		flow.kind,
		flow.title,
		flow.values.id,
		flow.values.student,
		flow.values.assignment,
		flow.values.event,
		flow.values.group,
		flow.values.date,
	].join("|");

export function FlowDialog({
	flow,
	onClose,
	onConfirm,
}: {
	flow: Flow | null;
	onClose: () => void;
	onConfirm: (values: Record<string, string>) => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const [values, setValues] = useState<Record<string, string>>({});
	const [step, setStep] = useState(0);
	const [error, setError] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const trigger = useRef<HTMLElement | null>(null);
	const review = useRef<HTMLHeadingElement>(null);
	const alert = useRef<HTMLParagraphElement>(null);
	const cache = useRef<Record<string, Record<string, string>>>({});
	useEffect(() => {
		if (flow) {
			trigger.current =
				document.activeElement instanceof HTMLElement
					? document.activeElement
					: null;
			setValues(cache.current[flowDraftKey(flow)] || flow.values);
			setErrors({});
			setStep(0);
			setError("");
			ref.current?.showModal();
		} else {
			ref.current?.close();
			trigger.current?.focus();
		}
	}, [flow]);
	useEffect(() => {
		if (!flow) return;
		if (error) alert.current?.focus();
		else if (step === 1) review.current?.focus();
		else {
			const key = Object.keys(errors)[0] || flow.fields[0]?.key;
			if (key) document.getElementById(`flow-${key}`)?.focus();
			else document.getElementById("flow-dialog-heading")?.focus();
		}
	}, [flow, step, error, errors]);
	function close() {
		if (flow) cache.current[flowDraftKey(flow)] = values;
		onClose();
	}
	return (
		<dialog
			ref={ref}
			onCancel={(e) => {
				e.preventDefault();
				close();
			}}
			aria-labelledby="flow-dialog-heading"
			aria-describedby="flow-dialog-description"
		>
			<div className="dialog-head">
				<button
					type="button"
					onClick={close}
					aria-label="Cerrar y conservar captura"
				>
					×
				</button>
			</div>
			<h2 id="flow-dialog-heading" tabIndex={-1}>
				{flow?.title}
			</h2>
			<p id="flow-dialog-description">{flow?.description}</p>
			<p>
				Al cancelar, la captura se conserva solo en memoria mientras esta página
				siga abierta.
			</p>
			<div className="steps">
				<span className={step === 0 ? "selected" : ""}>1. Completar</span>
				<span className={step === 1 ? "selected" : ""}>
					2. Revisar y confirmar
				</span>
			</div>
			<form
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					setError("");
					if (step === 0) {
						const nextErrors = validateFlow(flow?.fields || [], values);
						for (const field of flow?.fields || []) {
							const input = document.getElementById(
								`flow-${field.key}`,
							) as HTMLInputElement | null;
							if (input && !input.validity.valid && !nextErrors[field.key])
								nextErrors[field.key] = input.validationMessage;
						}
						setErrors(nextErrors);
						if (Object.keys(nextErrors).length) return;
						setStep(1);
						return;
					}
					try {
						onConfirm(values);
						if (flow) delete cache.current[flowDraftKey(flow)];
					} catch (e) {
						setError(e instanceof Error ? e.message : "Revisa los datos.");
						alert.current?.focus();
					}
				}}
			>
				{step === 0 ? (
					flow?.fields.map((f) => (
						<label key={f.key} htmlFor={`flow-${f.key}`}>
							{f.label}
							{f.options ? (
								<select
									aria-invalid={!!errors[f.key]}
									aria-describedby={
										errors[f.key] ? `flow-error-${f.key}` : undefined
									}
									id={`flow-${f.key}`}
									required={!f.optional}
									value={values[f.key] || ""}
									onChange={(e) =>
										setValues({ ...values, [f.key]: e.target.value })
									}
								>
									<option value="">Selecciona…</option>
									{f.options.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							) : f.type === "textarea" ? (
								<textarea
									rows={f.rows}
									aria-invalid={!!errors[f.key]}
									aria-describedby={
										errors[f.key] ? `flow-error-${f.key}` : undefined
									}
									id={`flow-${f.key}`}
									required={!f.optional}
									value={values[f.key] || ""}
									onChange={(e) =>
										setValues({ ...values, [f.key]: e.target.value })
									}
								/>
							) : (
								<input
									aria-invalid={!!errors[f.key]}
									aria-describedby={
										errors[f.key] ? `flow-error-${f.key}` : undefined
									}
									id={`flow-${f.key}`}
									type={f.type || "text"}
									step={f.type === "number" ? "any" : undefined}
									required={!f.optional}
									value={values[f.key] || ""}
									onChange={(e) =>
										setValues({ ...values, [f.key]: e.target.value })
									}
								/>
							)}
							{errors[f.key] && (
								<span className="form-field-error" id={`flow-error-${f.key}`}>
									{errors[f.key]}
								</span>
							)}
						</label>
					))
				) : (
					<div className="review">
						<h3 ref={review} tabIndex={-1}>
							Revisión: {flow?.title}
						</h3>
						{flow?.fields.map((f) => (
							<p key={f.key}>
								<strong>{f.label}</strong>
								<br />
								{f.options?.find((o) => o.value === values[f.key])?.label ||
									values[f.key] ||
									"Sin contenido"}
							</p>
						))}
						{flow?.preview?.map((p) => (
							<p key={p}>{p}</p>
						))}
					</div>
				)}
				{error && (
					<p
						ref={alert}
						tabIndex={-1}
						role="alert"
						className="error form-error-summary"
					>
						{error}
					</p>
				)}
				<div className="actions">
					<button type="button" onClick={close}>
						Cancelar y conservar
					</button>
					{step === 1 && (
						<button
							type="button"
							onClick={() => {
								setError("");
								setStep(0);
							}}
						>
							Corregir
						</button>
					)}
					<button className="primary" type="submit">
						{step === 0
							? "Revisar cambios"
							: flow?.kind.endsWith("-publish")
								? "Publicar"
								: "Guardar"}
					</button>
				</div>
			</form>
		</dialog>
	);
}
