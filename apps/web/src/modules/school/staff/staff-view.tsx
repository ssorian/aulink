import { useState } from "react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Field, Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Icon } from "../../../components/ui/icon";
import { Stat, StatGrid } from "../../../components/ui/stat";
import { ChipTooltip } from "../shared/chip-tooltip";
import { field, options, reason, roles } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { cycleStartYear } from "../students/experience";
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
		<Button
			variant="icon"
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
		</Button>
	);
}

export function StaffView({ s, open }: Pick<ViewProps, "s" | "open">) {
	const [query, setQuery] = useState("");
	const [role, setRole] = useState("");
	const visible = filterStaff(s.staff, query, role);
	const withLoad = s.staff.filter(
		(person) => staffWorkload(s, person.name).subjects.length > 0,
	).length;
	const roleItems = [
		...new Set([
			...roles.map((item) => item.name),
			...s.staff.map((person) => person.role),
		]),
	].map((value) => ({ value, label: value }));
	return (
		<section
			data-slot="staff-directory"
			className="grid min-w-0 max-w-full gap-4"
			aria-label="Personal de la escuela"
		>
			<header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<div>
					<h2 className="m-0 text-xl font-semibold tracking-tight">
						Personal de la escuela
					</h2>
					<output aria-live="polite" className="text-sm text-muted-foreground">
						{`${visible.length} de ${s.staff.length} registros`}
					</output>
				</div>
				<Button
					variant="primary"
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
				</Button>
			</header>
			<Card>
				<StatGrid label="Resumen del personal" className="md:grid-cols-3">
					<Stat label="Registros" value={s.staff.length} tone="teal" />
					<Stat
						label="Docentes"
						value={s.staff.filter((p) => p.role === "Docente").length}
						tone="sky"
					/>
					<Stat label="Con materias asignadas" value={withLoad} tone="lilac" />
				</StatGrid>
				<p
					data-slot="staff-disclaimer"
					className="m-0 mt-4 max-w-none text-sm text-muted-foreground"
				>
					Estas responsabilidades no implementan autorización. No se envían
					invitaciones.
				</p>
			</Card>
			<FilterBar label="Filtros del personal" className="m-0 max-sm:flex-col">
				<Field id="staff-query" label="Buscar personal" className="min-w-60">
					<Icon name="search" size={18} />
					<input
						id="staff-query"
						type="search"
						placeholder="Nombre del personal"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 font-semibold text-foreground outline-none focus-visible:outline-none"
					/>
				</Field>
				<Select
					id="staff-role"
					label="Responsabilidad"
					value={role}
					all="Todas las responsabilidades"
					items={roleItems}
					onChange={setRole}
				/>
			</FilterBar>
			{(role || query) && (
				<div className="flex flex-wrap items-center gap-2">
					{role && (
						<Button
							size="sm"
							aria-label="Quitar filtro de responsabilidad"
							onClick={() => setRole("")}
						>
							{role}
							<Icon name="close" size={14} />
						</Button>
					)}
					<Button
						variant="link"
						onClick={() => {
							setQuery("");
							setRole("");
						}}
					>
						Limpiar filtros
					</Button>
				</div>
			)}
			<div
				data-slot="table-wrap"
				className="min-w-0 [&_caption]:sr-only [&_table]:table-auto"
			>
				<DataTable caption="Directorio del personal" variant="card">
					<thead>
						<tr>
							<th scope="col">Nombre</th>
							<th scope="col">Responsabilidad</th>
							<th scope="col">Materias</th>
							<th scope="col">Grupos</th>
							<th scope="col">Horas/semana</th>
							<th scope="col" className="whitespace-nowrap">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{visible.map((x) => {
							const load = staffWorkload(s, x.name);
							return (
								<tr key={x.id}>
									<th scope="row" className="align-middle text-sm">
										<span
											data-slot="staff-identity"
											className="inline-flex items-center gap-3"
										>
											<Avatar name={x.name} />
											<span>{x.name}</span>
										</span>
									</th>
									<td className="align-middle text-sm">
										<Badge tone="neutral" className="align-middle text-sm">
											{x.role}
										</Badge>
										{x.history.length > 0 && (
											<span
												data-slot="staff-history-count"
												className="ml-2 text-sm whitespace-nowrap text-muted-foreground"
											>
												{x.history.length === 1
													? "1 cambio"
													: `${x.history.length} cambios`}
											</span>
										)}
									</td>
									<td className="align-middle text-sm">
										<ChipTooltip
											items={load.subjects}
											one="materia"
											many="materias"
										/>
									</td>
									<td className="align-middle text-sm">
										<ChipTooltip
											items={load.groups}
											one="grupo"
											many="grupos"
										/>
									</td>
									<td className="align-middle text-sm">
										{load.hours ? load.hours.toLocaleString("es-MX") : "—"}
									</td>
									<td className="align-middle">
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
			</div>
		</section>
	);
}
