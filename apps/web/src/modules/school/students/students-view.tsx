import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Field, Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Icon } from "../../../components/ui/icon";
import { Stat, StatGrid } from "../../../components/ui/stat";
import type { ViewProps } from "../shared/view-types";
import { studentPlacement } from "./experience";
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
	const validRows = rows.filter((r) => !r.error);
	return (
		<section
			data-slot="student-directory"
			className="grid min-w-0 max-w-full gap-4"
			aria-label="Directorio de alumnos"
		>
			<header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<div>
					<h2 className="m-0 text-xl font-semibold tracking-tight">
						Directorio de alumnos
					</h2>
					<output aria-live="polite" className="text-sm text-muted-foreground">
						{`${visible.length} de ${s.students.length} alumnos`}
					</output>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="primary" onClick={addStudent}>
						<Icon name="plus" size={18} />
						Inscribir alumno
					</Button>
					<Button
						aria-expanded={csvPreview}
						aria-controls="directory-import"
						onClick={() => setCSVPreview(!csvPreview)}
					>
						<Icon name="upload" size={18} />
						Importar CSV
					</Button>
				</div>
			</header>
			<Card>
				<StatGrid label="Resumen del directorio" className="md:grid-cols-3">
					<Stat label="Alumnos" value={s.students.length} tone="teal" />
					<Stat label="Grupos" value={s.groups.length} tone="sky" />
					<Stat label="Ciclos" value={s.cycles.length} tone="lilac" />
				</StatGrid>
			</Card>
			{csvPreview && (
				<Card id="directory-import" aria-label="Importación con revisión">
					<h2 className="m-0 mb-2 text-lg font-semibold tracking-tight">
						Importación con revisión
					</h2>
					<p className="m-0 mb-4 max-w-none text-sm text-muted-foreground">
						CSV simple sin comas dentro de campos. Encabezado:
						Nombre,Matrícula,Grupo. Usa el ID del grupo:{" "}
						{s.groups.map((g) => `${g.name}: ${g.id}`).join(" · ")}.
					</p>
					<label
						htmlFor="directory-csv"
						className="mb-3 grid gap-1.5 text-sm font-semibold"
					>
						Contenido CSV
						<textarea
							id="directory-csv"
							value={csv}
							onChange={(e) => setCSV(e.target.value)}
							className="min-h-28 w-full resize-y rounded-lg border border-input bg-card p-3 text-sm font-normal"
						/>
					</label>
					{rows.map((r) => (
						<p
							key={r.row}
							data-state={r.error ? "error" : "valid"}
							className="m-0 py-1 text-sm text-muted-foreground data-[state=error]:text-destructive"
						>
							Fila {r.row}: {r.name} · {r.matricula} · {r.error || "Válida"}
						</p>
					))}
					<Button
						className="mt-3"
						disabled={!validRows.length}
						onClick={() =>
							open(
								"import",
								"Confirmar importación",
								[],
								{},
								validRows.map(
									(r) => `${r.name} · ${r.matricula} · ${groupName(r.group)}`,
								),
							)
						}
					>
						Revisar filas válidas ({validRows.length})
					</Button>
				</Card>
			)}
			<FilterBar label="Filtros del directorio" className="m-0 max-sm:flex-col">
				<Field id="directory-query" label="Buscar alumno" className="min-w-60">
					<Icon name="search" size={18} />
					<input
						id="directory-query"
						type="search"
						placeholder="Nombre o matrícula"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 font-semibold text-foreground outline-none focus-visible:outline-none"
					/>
					{query && (
						<Button
							variant="icon"
							aria-label="Limpiar búsqueda"
							onClick={() => {
								setQuery("");
								document.getElementById("directory-query")?.focus();
							}}
						>
							<Icon name="close" size={16} />
						</Button>
					)}
				</Field>
				<Select
					id="directory-cycle"
					label="Ciclo del directorio"
					value={cycleFilter}
					all="Todos los ciclos"
					items={s.cycles.map((c) => ({ value: c.id, label: c.name }))}
					onChange={onCycleFilterChange}
				/>
				<Select
					id="directory-group"
					label="Filtrar grupo"
					value={groupFilter}
					all="Todos"
					items={s.groups
						.filter((g) => !cycleFilter || g.cycle === cycleFilter)
						.map((g) => ({
							value: g.id,
							label: `${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
						}))}
					onChange={setGroupFilter}
				/>
			</FilterBar>
			{(query || groupFilter || cycleFilter) && (
				<div className="flex flex-wrap items-center gap-2">
					{cycleFilter && (
						<Button
							size="sm"
							aria-label="Quitar filtro de ciclo"
							onClick={() => onCycleFilterChange("")}
						>
							{s.cycles.find((c) => c.id === cycleFilter)?.name}
							<Icon name="close" size={14} />
						</Button>
					)}
					{groupFilter && (
						<Button
							size="sm"
							aria-label="Quitar filtro de grupo"
							onClick={() => setGroupFilter("")}
						>
							{groupName(groupFilter)}
							<Icon name="close" size={14} />
						</Button>
					)}
					<Button variant="link" onClick={onClearFilters}>
						Limpiar filtros
					</Button>
				</div>
			)}
			<div
				data-slot="table-wrap"
				className="min-w-0 [&_caption]:sr-only [&_table]:table-auto [&_td]:align-middle [&_th]:align-middle [&_td]:text-sm"
			>
				<DataTable
					caption="Alumnos con grado, grupo y generación"
					variant="card"
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
									<th scope="row" className="text-sm">
										<span
											data-slot="student-identity"
											className="inline-flex items-center gap-3"
										>
											<Avatar name={x.name} />
											<Button
												id={`student-${x.id}`}
												variant="link"
												aria-label={`Abrir ${x.name}`}
												className="min-h-11 text-start font-semibold whitespace-normal [overflow-wrap:anywhere]"
												onClick={() => setProfile(x.id)}
											>
												{x.name}
											</Button>
										</span>
									</th>
									<td>{x.matricula}</td>
									<td>{place.grade}</td>
									<td>{place.group}</td>
									<td>{place.generation}</td>
									<td>
										<Button
											variant="icon"
											aria-label={`Abrir expediente de ${x.name}`}
											onClick={() => setProfile(x.id)}
										>
											<Icon name="arrow" size={16} />
										</Button>
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
			</div>
		</section>
	);
}
