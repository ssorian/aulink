import { useState } from "react";
import { Avatar } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Icon } from "../../../../components/ui/icon";
import type { Tone } from "../../../../components/ui/tone";
import { field, reason } from "../../shared/view-helpers";
import type { ViewProps } from "../../shared/view-types";
import { isVerifiedGuardian, type State } from "../../shared/workflows";
import { GuardianDialog } from "./guardian-dialog";
import { SummaryCard } from "./summary-card";

type Student = State["students"][number];
type Link = State["links"][number];

export const guardianTone = (status: string): Tone =>
	isVerifiedGuardian(status)
		? "success"
		: status === "Revocado"
			? "danger"
			: "mustard";
export const guardianStatus = (status: string) =>
	isVerifiedGuardian(status) ? "Verificado en el registro" : status;

/** Two guardians at most: usable links first, revoked ones only fill spare slots. */
const shownGuardians = (links: Link[]) =>
	[...links]
		.sort((a, b) => +(a.status === "Revocado") - +(b.status === "Revocado"))
		.slice(0, 2);

export function Guardians({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: Student }) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const links = s.links.filter((l) => l.student === student.id);
	const usable = links.filter((l) => l.status !== "Revocado").length;
	const selected = links.find((l) => l.id === selectedId);
	return (
		<SummaryCard
			heading="Tutores"
			meta={
				<span className="text-sm text-muted-foreground">{`${shownGuardians(links).length} de 2`}</span>
			}
			footer={
				usable < 2 ? (
					<Button
						variant="link"
						className="min-h-11"
						onClick={() =>
							open(
								"guardian",
								`Vincular tutor a ${student.name}`,
								[field("name", "Nombre del padre, madre o tutor"), reason],
								{ student: student.id },
								[
									"Vínculo registrado sin verificación de identidad externa. Reutiliza el mismo nombre para vincular varios hijos. No se envía invitación.",
								],
							)
						}
					>
						Vincular tutor
					</Button>
				) : undefined
			}
		>
			{!links.length && (
				<p className="m-0 text-sm text-muted-foreground">
					Sin tutores vinculados.
				</p>
			)}
			<ul className="m-0 grid list-none gap-1 p-0">
				{shownGuardians(links).map((l, i) => (
					<li key={l.id}>
						<Button
							variant="ghost"
							className="h-auto min-h-14 w-full justify-start gap-3 px-2 py-2 text-start font-normal text-foreground"
							aria-haspopup="dialog"
							aria-label={`Ver datos de ${l.name}`}
							onClick={() => setSelectedId(l.id)}
						>
							<span aria-hidden="true">
								<Avatar name={l.name} tone={i % 2 ? "lilac" : "peach"} />
							</span>
							<span className="grid min-w-0 flex-1 gap-1">
								<strong className="font-semibold [overflow-wrap:anywhere]">
									{l.name}
								</strong>
								<span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									{l.relation && <span>{l.relation}</span>}
									<Badge tone={guardianTone(l.status)}>
										{guardianStatus(l.status)}
									</Badge>
								</span>
							</span>
							<Icon name="chevron" size={16} />
						</Button>
					</li>
				))}
			</ul>
			<GuardianDialog
				link={selected}
				open={open}
				onClose={() => setSelectedId(null)}
			/>
		</SummaryCard>
	);
}
