import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Panel } from "../../../components/ui/panel";
import { field, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
export function DevicesView({ s, open }: Pick<ViewProps, "s" | "open">) {
	return (
		<Panel heading="Equipos">
			<button
				type="button"
				onClick={() =>
					open("device", "Agregar equipo", [field("name", "Nombre del equipo")])
				}
			>
				Agregar equipo
			</button>
			<DataTable caption="Registro de equipos">
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
							<th scope="row">{d.name}</th>
							<td>
								{d.active
									? "Habilitado en el registro"
									: "Desactivado en el registro"}
							</td>
							<td>{d.reason || "Sin motivo registrado"}</td>
							<td>
								<button
									type="button"
									disabled={!d.active}
									onClick={() =>
										open("device-off", `Desactivar ${d.name}`, [reason], {
											id: d.id,
										})
									}
								>
									Desactivar equipo
								</button>
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
			<p className="muted">
				El estado del registro no indica si el equipo físico está conectado.
			</p>
		</Panel>
	);
}
