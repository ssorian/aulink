import { useState } from "react";
import {
	DirectoryHeader,
	DirectorySearch,
	DirectoryIdentity,
	DirectoryFilterChip,
} from "./directory-components";
import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import "./staff-view.css";
import { Icon } from "../../components/ui/icon";
import { field, options, reason, roles } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function filterStaff(
	staff: ViewProps["s"]["staff"],
	query: string,
	role: string,
) {
	const normalize = (text: string) =>
		text
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.trim();
	return staff.filter(
		(person) =>
			(!role || person.role === role) &&
			normalize(person.name).includes(normalize(query)),
	);
}
export function StaffRoleAction({
	person,
	open,
}: {
	person: ViewProps["s"]["staff"][number];
	open: ViewProps["open"];
}) {
	return (
		<button
			className="staff-change"
			aria-label={`Cambiar responsabilidad de ${person.name}`}
			type="button"
			onClick={() =>
				open(
					"staff-role",
					`Cambiar responsabilidad de ${person.name}`,
					[options("role", "Nueva responsabilidad", roles), reason],
					{ id: person.id },
				)
			}
		>
			Cambiar responsabilidad
		</button>
	);
}

export function StaffView({ s, open }: Pick<ViewProps, "s" | "open">) {
	const [query, setQuery] = useState("");
	const [role, setRole] = useState("");
	const visible = filterStaff(s.staff, query, role);
	return (
		<section
			className="staff-directory"
			aria-label="Personal de la escuela"
		>
			<DirectoryHeader
				title="Personal de la escuela"
				count={`${visible.length} de ${s.staff.length} registros`}
			>
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
			</DirectoryHeader>
			<p className="staff-disclaimer">
				Estas responsabilidades no implementan autorización. No se envían
				invitaciones.
			</p>
			<div className="directory-filters staff-filters">
				<DirectorySearch
					id="staff-query"
					label="Buscar personal"
					placeholder="Nombre del personal"
					value={query}
					onChange={setQuery}
				/>
				<label htmlFor="staff-role">
					Responsabilidad
					<select
						id="staff-role"
						value={role}
						onChange={(event) => setRole(event.target.value)}
					>
						<option value="">Todas las responsabilidades</option>
						{[
							...new Set([
								...roles.map((item) => item.name),
								...s.staff.map((person) => person.role),
							]),
						].map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="result-toolbar">
				{role && (
					<DirectoryFilterChip
						label="Quitar filtro de responsabilidad"
						onRemove={() => setRole("")}
					>
						{role}
					</DirectoryFilterChip>
				)}
				{(query || role) && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							setRole("");
						}}
					>
						Limpiar filtros
					</button>
				)}
			</div>
			<DataTable caption="Directorio del personal" variant="card">
				<thead>
					<tr>
						<th scope="col">Nombre</th>
						<th scope="col">Responsabilidad</th>
						<th scope="col">Historial</th>
						<th scope="col">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{visible.map((x) => (
						<tr key={x.id}>
							<th scope="row">
								<DirectoryIdentity name={x.name} />
							</th>
							<td>
								<span className="directory-group">{x.role}</span>
							</td>
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
								<StaffRoleAction person={x} open={open} />
							</td>
						</tr>
					))}
					{!visible.length && (
						<EmptyTableRow columns={4}>
							{s.staff.length
								? "No se encontró personal. Limpia los filtros para ver todos los registros."
								: "Agrega docentes y personal administrativo para organizar tu comunidad."}
						</EmptyTableRow>
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
