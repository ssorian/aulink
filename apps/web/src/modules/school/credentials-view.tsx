import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import { Panel } from "../../components/ui/panel";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
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
export function CredentialsView({
	s,
	open,
	studentId,
}: Pick<ViewProps, "s" | "open"> & { studentId: string }) {
	const student = s.students.find((x) => x.id === studentId);
	if (!student) return null;
	return (
		<section className="panel">
			<h2>Credenciales de {student.name}</h2>
			<p>
				Sin código escaneable; no válida para acceso. La reemisión revoca la
				revisión previa.
			</p>
			<button
				type="button"
				onClick={() =>
					open(
						"credential",
						`Emitir / reemitir modelo de ${student.name}`,
						[reason],
						{ student: studentId },
						[
							`Alumno: ${student.name} · ${student.matricula}`,
							"MODELO NO VÁLIDO · Sin código escaneable",
						],
					)
				}
			>
				Emitir / reemitir modelo
			</button>
			{s.credentials
				.filter((c) => c.student === studentId)
				.map((c) => (
					<article className="credential" key={c.id}>
						<p className="muted">No válida para acceso · sin QR</p>
						<h3>
							{student.name} · {student.matricula}
						</h3>
						<p>
							Revisión {c.revision} · {c.active ? "Vigente" : "Revocada"}
						</p>
						<p>{c.reason}</p>
					</article>
				))}
		</section>
	);
}
