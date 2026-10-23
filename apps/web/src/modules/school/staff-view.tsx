import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import { Panel } from "../../components/ui/panel";
import { field, options, reason, roles } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function StaffView({ s, open }: Pick<ViewProps, "s" | "open">) {
	return (
		<>
			<button
				className="primary"
				type="button"
				onClick={() =>
					open(
						"staff",
						"Agregar personal",
						[
							field("name", "Nombre"),
							options("role", "Responsabilidad", roles),
						],
						{},
						[
							"Se guarda el registro de personal. No se crea una cuenta ni se envía invitación.",
						],
					)
				}
			>
				Agregar personal
			</button>
			<p className="notice">
				Estas responsabilidades no implementan autorización. No se envían
				invitaciones.
			</p>
			<Panel
				heading="Personal de la escuela"
				description={`Docentes y personal administrativo · ${s.staff.length} registros`}
			>
				<DataTable caption="Directorio del personal">
					<thead>
						<tr>
							<th scope="col">Nombre</th>
							<th scope="col">Responsabilidad</th>
							<th scope="col">Historial</th>
							<th scope="col">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{s.staff.map((x) => (
							<tr key={x.id}>
								<th scope="row">{x.name}</th>
								<td>{x.role}</td>
								<td>
									{x.history.length ? (
										<details>
											<summary>Ver historial de {x.name}</summary>
											{x.history.map((h) => (
												<p key={h.id}>
													{h.value} · {h.reason} · {h.author}
												</p>
											))}
										</details>
									) : (
										"Sin cambios registrados"
									)}
								</td>
								<td>
									{" "}
									<button
										type="button"
										onClick={() =>
											open(
												"staff-role",
												`Cambiar responsabilidad de ${x.name}`,
												[
													options("role", "Nueva responsabilidad", roles),
													reason,
												],
												{ id: x.id },
											)
										}
									>
										Cambiar responsabilidad
									</button>
								</td>
							</tr>
						))}
						{!s.staff.length && (
							<EmptyTableRow columns={4}>
								Agrega docentes y personal administrativo para organizar tu
								comunidad.
							</EmptyTableRow>
						)}
					</tbody>
				</DataTable>
			</Panel>
		</>
	);
}
