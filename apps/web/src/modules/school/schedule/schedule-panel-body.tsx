import { type FormEvent, type ReactNode, useId } from "react";
import { Button } from "../../../components/ui/button";
import { toneSurface } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import { coverWords, longDate, shortDate } from "./schedule-format";
import type { PanelMode, PanelState } from "./schedule-types";

const control = "w-full font-normal";
const text = "m-0 break-words";
const meta =
	"m-0 break-words text-[13px] text-muted-foreground first-letter:uppercase";

function Field({
	id,
	label,
	children,
}: {
	id: string;
	label: string;
	children: ReactNode;
}) {
	return (
		<label
			htmlFor={id}
			className="grid gap-1 text-[13px] font-semibold text-foreground"
		>
			{label}
			{children}
		</label>
	);
}
function Actions({ children }: { children: ReactNode }) {
	return (
		<div
			data-slot="schedule-panel-actions"
			className="mt-1 grid grid-cols-2 gap-2 *:text-sm *:font-semibold [&>:last-child:nth-child(odd)]:col-span-full [&>:only-child]:col-span-full"
		>
			{children}
		</div>
	);
}

/** Contents of the class panel: read-only options and the per-action forms. */
export function SchedulePanelBody({
	panel,
	teachers,
	titular,
	error,
	onMode,
	onSubmit,
	onEditSlot,
	onRemoveSlot,
}: {
	panel: PanelState;
	teachers: string[];
	titular: (assignment: string) => string;
	error: string;
	onMode: (mode: PanelMode) => void;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onEditSlot: () => void;
	onRemoveSlot: () => void;
}) {
	const uid = useId();
	if (panel.kind === "slot") {
		const { slot } = panel;
		return (
			<div data-slot="schedule-panel-body" className="grid gap-2.5 text-sm">
				<p className={meta}>
					Cada {slot.day.toLowerCase()} · {slot.start}–{slot.end}
				</p>
				<p className={text}>
					Titular: {titular(slot.assignment) || "Sin docente"}
				</p>
				<Actions>
					<Button className="text-primary" data-autofocus onClick={onEditSlot}>
						Editar
					</Button>
					<Button className="text-destructive" onClick={onRemoveSlot}>
						Eliminar
					</Button>
				</Actions>
			</div>
		);
	}
	const { item, mode, draft } = panel;
	const live = item.status === "active" || item.status === "moved";
	const errorLine = error && (
		<p
			role="alert"
			className={cn(
				"m-0 rounded-lg px-2.5 py-2 text-[13px]",
				toneSurface.danger,
			)}
		>
			{error}
		</p>
	);
	const reasonField = (placeholder: string, focus: boolean | undefined) => (
		<Field id={`${uid}-reason`} label="Motivo">
			<textarea
				id={`${uid}-reason`}
				name="reason"
				rows={2}
				required
				placeholder={placeholder}
				className={control}
				data-autofocus={focus ? true : undefined}
			/>
		</Field>
	);
	const footer = (primary: string, danger = false) => (
		<Actions>
			<Button className="text-primary" onClick={() => onMode("view")}>
				Volver
			</Button>
			<Button
				type="submit"
				variant={danger ? "danger" : "primary"}
				className={cn(
					danger &&
						"bg-destructive text-primary-foreground hover:bg-destructive/90",
				)}
			>
				{primary}
			</Button>
		</Actions>
	);
	const form = (children: ReactNode) => (
		<form
			data-slot="schedule-panel-body"
			className="grid gap-2.5 text-sm"
			onSubmit={onSubmit}
			noValidate
		>
			{children}
		</form>
	);
	if (mode === "view")
		return (
			<div data-slot="schedule-panel-body" className="grid gap-2.5 text-sm">
				<p className={meta}>
					{longDate(item.date)} · {item.start}–{item.end}
				</p>
				{item.coverRole ? (
					<p className={text}>
						<strong>
							{coverWords[item.coverRole]}: {item.teacher}
						</strong>
						<br />
						Titular: {titular(item.assignment)}
					</p>
				) : (
					<p className={text}>Docente: {item.teacher || "Sin docente"}</p>
				)}
				{item.status !== "active" && (
					<p
						data-status={item.status}
						className={cn(
							"m-0 rounded-lg px-2.5 py-1.5 text-[13px]",
							item.status === "cancel"
								? toneSurface.danger
								: toneSurface.warning,
						)}
					>
						{item.status === "cancel"
							? "Cancelada"
							: item.status === "move"
								? "Reagendada a otra fecha"
								: `Reagendada desde el ${shortDate(item.originDate)}`}
						{item.reason ? ` · ${item.reason}` : ""}
					</p>
				)}
				<Actions>
					{live && (
						<>
							<Button
								className="text-primary"
								data-autofocus
								onClick={() => onMode("staff")}
							>
								Cambiar docente
							</Button>
							<Button className="text-primary" onClick={() => onMode("move")}>
								Reagendar
							</Button>
							<Button
								className="text-destructive"
								onClick={() => onMode("cancel")}
							>
								Cancelar clase
							</Button>
						</>
					)}
					{item.status !== "active" && (
						<Button className="text-primary" onClick={() => onMode("restore")}>
							Restaurar
						</Button>
					)}
				</Actions>
			</div>
		);
	if (mode === "staff")
		return form(
			<>
				<p className={meta}>
					Solo el {longDate(item.date)}. Titular: {titular(item.assignment)}.
				</p>
				<fieldset className="m-0 grid min-w-0 gap-0.5 border-0 p-0">
					<legend className="mb-1 text-[13px] font-semibold">Cambio</legend>
					{(
						[
							["substitute", "Suplente"],
							["teacher", "Otro docente"],
							["titular", "Volver al titular"],
						] as const
					).map(([value, label]) => (
						<label
							key={value}
							className="flex min-h-11 flex-row items-center gap-2 text-sm font-normal has-disabled:text-muted-foreground"
						>
							<input
								type="radio"
								name="role"
								value={value}
								defaultChecked={(item.coverRole || "substitute") === value}
								disabled={value === "titular" && !item.coverRole}
								className="m-0 size-[18px] min-h-0 shrink-0 p-0 accent-primary"
							/>
							{label}
						</label>
					))}
				</fieldset>
				<Field id={`${uid}-teacher`} label="Docente para esta fecha">
					<select
						id={`${uid}-teacher`}
						name="teacher"
						defaultValue={item.coverRole ? item.teacher : ""}
						data-autofocus
						className={control}
					>
						<option value="">Selecciona…</option>
						{teachers
							.filter((t) => t !== titular(item.assignment))
							.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
					</select>
				</Field>
				{reasonField("Ej. licencia médica del titular", false)}
				{errorLine}
				{footer("Guardar")}
			</>,
		);
	if (mode === "move")
		return form(
			<>
				<p className={meta}>
					Solo cambia la clase del {longDate(item.originDate)}.
				</p>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
					<Field id={`${uid}-date`} label="Fecha">
						<input
							id={`${uid}-date`}
							type="date"
							name="targetDate"
							defaultValue={draft?.date || item.date}
							data-autofocus={draft ? undefined : true}
							className={control}
						/>
					</Field>
				</div>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
					<Field id={`${uid}-start`} label="Inicio">
						<input
							id={`${uid}-start`}
							type="time"
							name="start"
							defaultValue={draft?.start || item.start}
							className={control}
						/>
					</Field>
					<Field id={`${uid}-end`} label="Fin">
						<input
							id={`${uid}-end`}
							type="time"
							name="end"
							defaultValue={draft?.end || item.end}
							className={control}
						/>
					</Field>
				</div>
				{reasonField("Ej. junta de academia", Boolean(draft))}
				{errorLine}
				{footer("Reagendar")}
			</>,
		);
	return form(
		<>
			<p className={meta}>
				{mode === "cancel"
					? `Se cancela solo el ${longDate(item.date)}. Queda visible como evidencia.`
					: `Vuelve a su horario original del ${longDate(item.originDate)}.`}
			</p>
			{reasonField(
				mode === "cancel"
					? "Ej. suspensión por junta"
					: "Ej. se resolvió el aviso",
				true,
			)}
			{errorLine}
			{footer(
				mode === "cancel" ? "Cancelar clase" : "Restaurar",
				mode === "cancel",
			)}
		</>,
	);
}
