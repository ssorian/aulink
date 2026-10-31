import "./students-view.css";
import { DataTable, EmptyTableRow } from "../../components/ui/data-table";
import { Icon } from "../../components/ui/icon";
import {
	DirectoryFilterChip,
	DirectoryHeader,
	DirectoryIdentity,
	DirectorySearch,
} from "./directory-components";
import { studentPlacement } from "./experience";
import type { ViewProps } from "./view-types";
export function StudentsView({
	s,
	open,
	groupName,
	query,
	setQuery,
	groupFilter,
	setGroupFilter,
	setProfile,
	csv,
	setCSV,
	csvPreview,
	setCSVPreview,
	rows,
	visible,
	addStudent,
	cycleFilter,
	onClearFilters,
	onCycleFilterChange,
}: {
	cycleFilter: string;
	onClearFilters: () => void;
	onCycleFilterChange: (value: string) => void;
} & Pick<
	ViewProps,
	| "s"
	| "open"
	| "groups"
	| "groupName"
	| "query"
	| "setQuery"
	| "groupFilter"
	| "setGroupFilter"
	| "profile"
	| "setProfile"
	| "selected"
	| "csv"
	| "setCSV"
	| "csvPreview"
	| "setCSVPreview"
	| "rows"
	| "visible"
	| "addStudent"
>) {
	const shownCycle =
		cycleFilter || s.groups.find((g) => g.id === groupFilter)?.cycle || "";
	return (
		<section className="student-directory" aria-label="Directorio de alumnos">
			<DirectoryHeader
				title="Directorio de alumnos"
				count={`${visible.length} de ${s.students.length} alumnos`}
			>
				<button className="primary" type="button" onClick={addStudent}>
					<Icon name="plus" size={18} />
					Inscribir alumno
				</button>
				<button
					type="button"
					aria-expanded={csvPreview}
					aria-controls="directory-import"
					onClick={() => setCSVPreview(!csvPreview)}
				>
					<Icon name="upload" size={18} />
					Importar CSV
				</button>
			</DirectoryHeader>
			{csvPreview && (
				<section
					className="directory-import"
					id="directory-import"
					aria-label="Importación con revisión"
				>
					<h2>Importación con revisión</h2>
					<p>
						CSV simple sin comas dentro de campos. Encabezado:
						Nombre,Matrícula,Grupo. Usa el ID del grupo:{" "}
						{s.groups.map((g) => `${g.name}: ${g.id}`).join(" · ")}.
					</p>
					<label htmlFor="directory-csv">
						Contenido CSV
						<textarea
							id="directory-csv"
							value={csv}
							onChange={(e) => setCSV(e.target.value)}
						/>
					</label>
					{rows.map((r) => (
						<p key={r.row} className={r.error ? "error" : ""}>
							Fila {r.row}: {r.name} · {r.matricula} · {r.error || "Válida"}
						</p>
					))}
					<button
						type="button"
						disabled={!rows.some((r) => !r.error)}
						onClick={() =>
							open(
								"import",
								"Confirmar importación",
								[],
								{},
								rows
									.filter((r) => !r.error)
									.map(
										(r) => `${r.name} · ${r.matricula} · ${groupName(r.group)}`,
									),
							)
						}
					>
						Revisar filas válidas ({rows.filter((r) => !r.error).length})
					</button>
				</section>
			)}
			<div className="directory-filters">
				<DirectorySearch
					id="directory-query"
					label="Buscar alumno"
					placeholder="Nombre o matrícula"
					value={query}
					onChange={setQuery}
				/>
				<label htmlFor="directory-cycle">
					Ciclo del directorio
					<select
						id="directory-cycle"
						value={cycleFilter}
						onChange={(e) => onCycleFilterChange(e.target.value)}
					>
						<option value="">Todos los ciclos</option>
						{s.cycles.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</label>
				<label htmlFor="directory-group">
					Filtrar grupo
					<select
						id="directory-group"
						value={groupFilter}
						onChange={(e) => setGroupFilter(e.target.value)}
					>
						<option value="">Todos</option>
						{s.groups
							.filter((g) => !cycleFilter || g.cycle === cycleFilter)
							.map((g) => (
								<option key={g.id} value={g.id}>
									{g.name} · {s.cycles.find((c) => c.id === g.cycle)?.name}
								</option>
							))}
					</select>
				</label>
			</div>
			<div className="result-toolbar">
				{cycleFilter && (
					<DirectoryFilterChip
						label="Quitar filtro de ciclo"
						onRemove={() => onCycleFilterChange("")}
					>
						{s.cycles.find((c) => c.id === cycleFilter)?.name}
					</DirectoryFilterChip>
				)}
				{groupFilter && (
					<DirectoryFilterChip
						label="Quitar filtro de grupo"
						onRemove={() => setGroupFilter("")}
					>
						{groupName(groupFilter)}
					</DirectoryFilterChip>
				)}
				{(query || groupFilter || cycleFilter) && (
					<button type="button" onClick={onClearFilters}>
						Limpiar filtros
					</button>
				)}
			</div>
			<DataTable
				caption="Alumnos con grado, grupo y generación"
				variant="card"
				scrollClassName="table-scroll"
				scrollLabel="Resultados de alumnos, desplazamiento horizontal"
			>
				<thead>
					<tr>
						<th scope="col">Alumno</th>
						<th scope="col">Matrícula</th>
						<th scope="col">Grado</th>
						<th scope="col">Grupo</th>
						<th scope="col">Generación</th>
						<th scope="col">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{visible.map((x) => {
						const place = studentPlacement(s, x, shownCycle);
						return (
							<tr key={x.id}>
								<td>
									<DirectoryIdentity
										name={
											<button
												id={`student-${x.id}`}
												className="directory-profile"
												aria-label={`Abrir ${x.name}`}
												type="button"
												onClick={() => setProfile(x.id)}
											>
												{x.name}
											</button>
										}
									/>
								</td>
								<td>{x.matricula}</td>
								<td>{place.grade}</td>
								<td>{place.group}</td>
								<td>{place.generation}</td>
								<td>
									<button
										type="button"
										className="directory-open"
										aria-label={`Abrir expediente de ${x.name}`}
										onClick={() => setProfile(x.id)}
									>
										<Icon name="arrow" size={16} />
									</button>
								</td>
							</tr>
						);
					})}
					{!visible.length && (
						<EmptyTableRow columns={6}>
							No se encontraron alumnos. Limpia los filtros o inscribe uno.
						</EmptyTableRow>
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
