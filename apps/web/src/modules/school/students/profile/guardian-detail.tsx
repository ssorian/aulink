import { Button } from "../../../../components/ui/button";
import { field, options, reason } from "../../shared/view-helpers";
import type { ViewProps } from "../../shared/view-types";
import type { State } from "../../shared/workflows";
import { Facts } from "./facts";
import { guardianStatus } from "./guardians";

type Link = State["links"][number];
const missing = "Sin registrar";

/** Dialog content. Editing closes this dialog first, then opens the shared flow. */
export function GuardianDetail({
	link,
	open,
	onClose,
}: Pick<ViewProps, "open"> & { link: Link; onClose: () => void }) {
	return (
		<>
			<Facts
				className="md:grid-cols-2"
				items={[
					{ label: "Parentesco", value: link.relation || missing },
					{ label: "Teléfono", value: link.phone || missing },
					{ label: "Correo", value: link.email || missing },
					{ label: "Estado", value: guardianStatus(link.status) },
				]}
			/>
			<div className="mt-6 flex flex-wrap gap-2">
				<Button
					onClick={() => {
						onClose();
						open(
							"guardian-edit",
							`Editar datos de ${link.name}`,
							[
								field("name", "Nombre"),
								{ ...field("relation", "Parentesco"), optional: true },
								{ ...field("phone", "Teléfono", "tel"), optional: true },
								{ ...field("email", "Correo", "email"), optional: true },
							],
							{
								id: link.id,
								name: link.name,
								relation: link.relation ?? "",
								phone: link.phone ?? "",
								email: link.email ?? "",
							},
						);
					}}
				>
					Editar datos
				</Button>
				<Button
					variant="danger"
					disabled={link.status === "Revocado"}
					onClick={() => {
						onClose();
						open(
							"guardian-status",
							`Cambiar vínculo de ${link.name}`,
							[
								options("status", "Nuevo estado", [
									{ id: "Restringido", name: "Restringido" },
									{ id: "Revocado", name: "Revocado" },
								]),
								reason,
							],
							{ id: link.id },
						);
					}}
				>
					Restringir o revocar
				</Button>
			</div>
		</>
	);
}
