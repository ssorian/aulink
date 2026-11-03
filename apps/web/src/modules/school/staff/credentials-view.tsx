import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Stat, StatGrid } from "../../../components/ui/stat";
import { field, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";

export function DevicesView({ s, open }: Pick<ViewProps, "s" | "open">) {
	const enabled = s.devices.filter((d) => d.active).length;
	return (
		<section
			data-slot="devices-view"
			aria-labelledby="devices-heading"
			className="grid min-w-0 max-w-full gap-4"
		>
			<header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<h2
					id="devices-heading"
					className="m-0 text-xl font-semibold tracking-tight"
				>
					Equipos
				</h2>
				<Button
					variant="primary"
					onClick={() =>
						open("device", "Agregar equipo", [
							field("name", "Nombre del equipo"),
						])
					}
				>
					Agregar equipo
				</Button>
			</header>
			<Card>
				<StatGrid label="Resumen de equipos" className="md:grid-cols-3">
					<Stat label="Equipos" value={s.devices.length} tone="teal" />
					<Stat label="Habilitados" value={enabled} state="published" />
					<Stat
						label="Desactivados"
						value={s.devices.length - enabled}
						tone="neutral"
					/>
				</StatGrid>
				<p
					data-slot="devices-caveat"
					className="m-0 mt-4 text-sm text-muted-foreground"
				>
					El estado del registro no indica si el equipo físico está conectado.
				</p>
			</Card>
			<div data-slot="table-wrap" className="min-w-0 [&_caption]:sr-only">
				<DataTable caption="Registro de equipos" variant="card">
					<thead>
						<tr>
							<th scope="col">Equipo</th>
							<th scope="col">Estado del registro</th>
							<th scope="col">Motivo</th>
							<th scope="col">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{s.devices.map((d) => (
							<tr key={d.id}>
								<th scope="row" className="align-middle text-sm">
									{d.name}
								</th>
								<td className="align-middle text-sm">
									<span
										data-slot="device-status"
										data-state={d.active ? "enabled" : "disabled"}
										className="inline-flex items-center gap-1.5"
									>
										<span
											aria-hidden="true"
											className={`size-2 shrink-0 rounded-full ${d.active ? "bg-success" : "bg-input"}`}
										/>
										{d.active
											? "Habilitado en el registro"
											: "Desactivado en el registro"}
									</span>
								</td>
								<td className="align-middle text-sm">
									{d.reason || "Sin motivo registrado"}
								</td>
								<td className="align-middle">
									<Button
										size="sm"
										disabled={!d.active}
										onClick={() =>
											open("device-off", `Desactivar ${d.name}`, [reason], {
												id: d.id,
											})
										}
									>
										Desactivar equipo
									</Button>
								</td>
							</tr>
						))}
						{!s.devices.length && (
							<EmptyTableRow columns={4}>
								No hay equipos registrados. Agrega un equipo para comenzar.
							</EmptyTableRow>
						)}
					</tbody>
				</DataTable>
			</div>
		</section>
	);
}
