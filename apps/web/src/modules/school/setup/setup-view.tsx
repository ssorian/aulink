import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { field } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { DevicesView } from "../staff/credentials-view";
import { CycleCalendar } from "./cycle-calendar";
export function SetupView({
	s,
	open,
	storageStatus,
	onLoadExamples,
	tab = "Escuela",
}: Pick<ViewProps, "s" | "open"> & {
	storageStatus?: string;
	onLoadExamples?: () => void;
	tab?: "Escuela" | "Ciclos y calendario" | "Terminales";
}) {
	return (
		<>
			{tab === "Escuela" && (
				<Card className="my-5 flex flex-col items-start gap-3">
					<h2 className="m-0 text-lg font-semibold tracking-tight">
						Identidad y operación
					</h2>
					<p className="m-0 text-sm text-foreground">
						{s.school.name} · {s.school.timezone} · {s.school.shift}
					</p>
					<Button
						onClick={() =>
							open(
								"school",
								"Editar institución",
								[
									field("name", "Institución"),
									field("timezone", "Zona horaria IANA"),
									field("shift", "Turno"),
								],
								s.school,
							)
						}
					>
						Editar institución
					</Button>
					<p className="m-0 text-sm text-muted-foreground">
						Las escalas académicas pertenecen a cada asignación en Gestión
						académica → Grupos → Horario. No hay una escala global que
						sobrescriba registros históricos.
					</p>
				</Card>
			)}
			{tab === "Ciclos y calendario" && <CycleCalendar s={s} open={open} />}
			{tab === "Terminales" && <DevicesView s={s} open={open} />}
			{tab === "Escuela" && (
				<details
					data-slot="storage-tools"
					className="mt-6 rounded-xl border border-border bg-card px-5 py-1"
				>
					<summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground">
						Almacenamiento y herramientas
					</summary>
					<p className="m-0 mb-3 text-sm text-muted-foreground">
						Los cambios se guardan en este navegador. Los servicios externos
						están sin conexión.
					</p>
					{storageStatus && (
						<output className="mb-3 block text-sm text-muted-foreground">
							{storageStatus}
						</output>
					)}
					{onLoadExamples && (
						<Button onClick={onLoadExamples} className="mb-3">
							Añadir registros de ejemplo
						</Button>
					)}
				</details>
			)}
		</>
	);
}
