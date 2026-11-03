import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Icon } from "../../../../components/ui/icon";
import { reason } from "../../shared/view-helpers";
import type { ViewProps } from "../../shared/view-types";
import type { State } from "../../shared/workflows";
import { SummaryCard } from "./summary-card";

type Student = State["students"][number];

export const credentialPreview = (student: Student, reissue: boolean) => [
	`Alumno: ${student.name} · ${student.matricula}`,
	"MODELO NO VÁLIDO · Sin código escaneable",
	...(reissue ? ["Reemitir revoca la revisión anterior."] : []),
];

export function Credential({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: Student }) {
	const active = s.credentials.find(
		(c) => c.student === student.id && c.active,
	);
	const action = active ? "Reemitir credencial" : "Emitir credencial";
	return (
		<SummaryCard
			heading="Credencial"
			meta={active && <Badge tone="success">Vigente</Badge>}
			footer={
				<Button
					onClick={() =>
						open(
							"credential",
							`${action} de ${student.name}`,
							[reason],
							{ student: student.id },
							credentialPreview(student, !!active),
						)
					}
				>
					{action}
				</Button>
			}
		>
			{active ? (
				<div
					data-slot="credential-card"
					className="grid gap-1 rounded-lg bg-muted p-4"
				>
					<span className="text-sm text-muted-foreground">{s.school.name}</span>
					<span className="font-semibold">{student.name}</span>
					<strong className="text-2xl font-semibold tracking-tight tabular-nums">
						{student.matricula}
					</strong>
					<span className="text-sm text-muted-foreground">
						Revisión {active.revision}
					</span>
				</div>
			) : (
				<div className="rounded-lg border border-dashed border-input p-4 text-center">
					<strong>Sin credencial vigente</strong>
					<p className="m-0 mt-1 text-sm text-muted-foreground">
						Puedes emitir una credencial para este alumno con el botón de abajo.
					</p>
				</div>
			)}
			<p
				data-slot="credential-notice"
				className="m-0 mt-3 flex items-start gap-2 rounded-lg bg-mustard-bg p-3 text-sm text-mustard-ink"
			>
				<span aria-hidden="true" className="mt-0.5 shrink-0">
					<Icon name="help" size={16} />
				</span>
				Modelo sin código escaneable; no sirve para acceso.
			</p>
		</SummaryCard>
	);
}
