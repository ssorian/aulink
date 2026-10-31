import { useState } from "react";
import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import {
	DirectoryFilterChip,
	DirectoryHeader,
	DirectoryIdentity,
	DirectorySearch,
} from "./directory-components";
import "./staff-view.css";
import { Icon } from "../../components/ui/icon";
import { ChipTooltip } from "./chip-tooltip";
import { cycleStartYear } from "./experience";
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
const minutes = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

/** Subjects, groups and weekly hours a teacher has in the latest cycle, matched by name. */
export function staffWorkload(s: ViewProps["s"], teacher: string) {
	const latest = s.cycles.reduce<(typeof s.cycles)[number] | undefined>(
		(best, c) =>
			!best ||
			(cycleStartYear(s, c.id) ?? 0) > (cycleStartYear(s, best.id) ?? 0)
				? c
				: best,
		undefined,
	);
	const groupOf = (id: string) => s.groups.find((g) => g.id === id);
	const own = s.assignments.filter(
		(a) => a.teacher === teacher && groupOf(a.group)?.cycle === latest?.id,
	);
	// The same lesson repeats across evaluation periods; count each weekly block once.
	const blocks = new Map<string, number>();
	for (const h of s.schedules) {
		const a = own.find((x) => x.id === h.assignment);
		if (a)
			blocks.set(
				`${a.group}|${a.subject}|${h.day}|${h.start}`,
				minutes(h.end) - minutes(h.start),
			);
	}
	return {
		subjects: [...new Set(own.map((a) => a.subject))],
		groups: [...new Set(own.map((a) => groupOf(a.group)?.name ?? a.group))],
		hours: [...blocks.values()].reduce((sum, m) => sum + m, 0) / 60,
	};
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
			type="button"
			className="directory-open"
			aria-label={`Cambiar responsabilidad de ${person.name}`}
			onClick={() =>
				open(
					"staff-role",
					`Cambiar responsabilidad de ${person.name}`,
					[options("role", "Nueva responsabilidad", roles), reason],
					{ id: person.id },
					undefined,
					person.history.length
						? `Historial: ${person.history
								.map((h) => `${h.value} · ${h.reason} · ${h.author}`)
								.join("; ")}.`
						: "Sin cambios registrados.",
				)
			}
		>
			<Icon name="arrow" size={16} />
		</button>
	);
}

export function StaffView({ s, open }: Pick<ViewProps, "s" | "open">) {
	const [query, setQuery] = useState("");
	const [role, setRole] = useState("");
	const visible = filterStaff(s.staff, query, role);
	return (
		<section className="staff-directory" aria-label="Personal de la escuela">
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
						<th scope="col">Materias</th>
						<th scope="col">Grupos</th>
						<th scope="col">Horas/semana</th>
						<th scope="col">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{visible.map((x) => {
						const load = staffWorkload(s, x.name);
						return (
							<tr key={x.id}>
								<th scope="row">
									<DirectoryIdentity name={x.name} />
								</th>
								<td>
									<span className="directory-group">{x.role}</span>
									{x.history.length > 0 && (
										<span className="staff-history-count">
											{x.history.length === 1
												? "1 cambio"
												: `${x.history.length} cambios`}
										</span>
									)}
								</td>
								<td>
									<ChipTooltip
										items={load.subjects}
										one="materia"
										many="materias"
									/>
								</td>
								<td>
									<ChipTooltip items={load.groups} one="grupo" many="grupos" />
								</td>
								<td>{load.hours ? load.hours.toLocaleString("es-MX") : "—"}</td>
								<td>
									<StaffRoleAction person={x} open={open} />
								</td>
							</tr>
						);
					})}
					{!visible.length && (
						<EmptyTableRow columns={6}>
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
