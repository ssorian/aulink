import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import "./staff-view.css";
import { Icon } from "../../components/ui/icon";
import { field, options, reason, roles } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function StaffView({ s, open }: Pick<ViewProps, "s" | "open">) {
	return (
		<section
			className="panel staff-directory"
			aria-label="Personal de la escuela"
		>
			<header className="staff-header">
				<div>
					<h2>Personal de la escuela</h2>
					<p>Docentes y personal administrativo · {s.staff.length} registros</p>
				</div>
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
					<Icon name="plus" size={18} />
					Agregar personal
				</button>
			</header>
			<p className="staff-disclaimer">
				Estas responsabilidades no implementan autorización. No se envían
				invitaciones.
			</p>
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
										<summary
											aria-label={`Ver historial de ${x.name}, ${x.history.length} cambios`}
										>
											Ver historial ({x.history.length})
										</summary>
										{x.history.map((h) => (
											<p key={h.id}>
												{h.value} · {h.reason} · {h.author}
											</p>
										))}
									</details>
								) : (
									<span className="staff-no-history">
										Sin cambios registrados
									</span>
								)}
							</td>
							<td>
								<button
									className="staff-change"
									aria-label={`Cambiar responsabilidad de ${x.name}`}
									type="button"
									onClick={() =>
										open(
											"staff-role",
											`Cambiar responsabilidad de ${x.name}`,
											[options("role", "Nueva responsabilidad", roles), reason],
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
		</section>
	);
}
