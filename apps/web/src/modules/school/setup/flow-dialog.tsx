import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import { cn } from "../../../lib/utils";
import type { Field } from "../shared/view-types";
import { validateFlow } from "./flow-validation";

export type { Field };
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

const controlClass =
	"min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground aria-invalid:border-destructive";

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
			data-slot="flow-dialog"
			onCancel={(e) => {
				e.preventDefault();
				close();
			}}
			aria-labelledby="flow-dialog-heading"
			aria-describedby="flow-dialog-description"
			className="fixed m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-foreground/40"
		>
			<header className="mb-2 flex items-start justify-between gap-3">
				<h2
					id="flow-dialog-heading"
					tabIndex={-1}
					className="m-0 pt-2 text-xl font-semibold tracking-tight"
				>
					{flow?.title}
				</h2>
				<Button
					variant="icon"
					onClick={close}
					aria-label="Cerrar y conservar captura"
				>
					<Icon name="close" size={18} />
				</Button>
			</header>
			<p
				id="flow-dialog-description"
				className="m-0 mb-2 text-sm text-foreground"
			>
				{flow?.description}
			</p>
			<p className="m-0 text-[13px] text-muted-foreground">
				Al cancelar, la captura se conserva solo en memoria mientras esta página
				siga abierta.
			</p>
			<ol
				data-slot="flow-steps"
				className="m-0 my-4 flex list-none gap-5 border-b border-border p-0 text-[13px]"
			>
				{["1. Completar", "2. Revisar y confirmar"].map((label, index) => (
					<li
						key={label}
						data-state={step === index ? "current" : "pending"}
						aria-current={step === index ? "step" : undefined}
						className="-mb-px border-b-2 border-transparent py-2.5 text-muted-foreground data-[state=current]:border-primary data-[state=current]:font-semibold data-[state=current]:text-primary"
					>
						{label}
					</li>
				))}
			</ol>
			<form
				noValidate
				className="flex flex-col gap-4"
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
						<label
							key={f.key}
							htmlFor={`flow-${f.key}`}
							className="m-0 flex flex-col gap-1.5 text-[13px] font-medium text-foreground has-aria-invalid:text-destructive"
						>
							{f.label}
							{f.options ? (
								<select
									className={controlClass}
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
									className={cn(controlClass, "min-h-28 py-2")}
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
									className={controlClass}
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
								<span
									data-slot="flow-field-error"
									className="text-[13px] font-medium text-destructive"
									id={`flow-error-${f.key}`}
								>
									{errors[f.key]}
								</span>
							)}
						</label>
					))
				) : (
					<div data-slot="flow-review" className="rounded-lg bg-muted p-4">
						<h3
							ref={review}
							tabIndex={-1}
							className="m-0 mb-3 text-base font-semibold"
						>
							Revisión: {flow?.title}
						</h3>
						<dl className="m-0 grid gap-3">
							{flow?.fields.map((f) => (
								<div key={f.key} className="min-w-0">
									<dt className="text-xs font-medium text-muted-foreground">
										{f.label}
									</dt>
									<dd className="m-0 text-sm text-foreground [overflow-wrap:anywhere]">
										{f.options?.find((o) => o.value === values[f.key])?.label ||
											values[f.key] ||
											"Sin contenido"}
									</dd>
								</div>
							))}
						</dl>
						{flow?.preview?.map((p) => (
							<p key={p} className="m-0 mt-3 text-sm text-foreground">
								{p}
							</p>
						))}
					</div>
				)}
				{error && (
					<p
						ref={alert}
						tabIndex={-1}
						role="alert"
						data-slot="flow-error"
						className="m-0 rounded-lg border border-destructive bg-destructive-bg p-3.5 text-sm font-medium text-destructive"
					>
						{error}
					</p>
				)}
				<div className="flex flex-wrap justify-end gap-2 max-sm:flex-col-reverse max-sm:flex-nowrap max-sm:*:w-full">
					<Button onClick={close}>Cancelar y conservar</Button>
					{step === 1 && (
						<Button
							onClick={() => {
								setError("");
								setStep(0);
							}}
						>
							Corregir
						</Button>
					)}
					<Button variant="primary" type="submit">
						{step === 0
							? "Revisar cambios"
							: flow?.kind.endsWith("-publish")
								? "Publicar"
								: "Guardar"}
					</Button>
				</div>
			</form>
		</dialog>
	);
}
