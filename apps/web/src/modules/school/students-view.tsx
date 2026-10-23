import { Icon } from "../../components/ui/icon";
import type { ViewProps } from "./view-types";
import { activeGroup } from "./workflows";
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
}: { cycleFilter: string; onClearFilters: () => void } & Pick<
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
	return (
		<>
			<div className="actions">
				<button className="primary" type="button" onClick={addStudent}>
					<Icon name="plus" size={18} />
					Inscribir alumno
				</button>
				<button type="button" onClick={() => setCSVPreview(!csvPreview)}>
					<Icon name="upload" size={18} />
					Importar CSV
				</button>
			</div>
			{csvPreview && (
				<section className="panel">
					<h2>Importación con revisión</h2>
					<p>
						CSV simple sin comas dentro de campos. Encabezado:
						Nombre,Matrícula,Grupo. Usa el ID del grupo:{" "}
						{s.groups.map((g) => `${g.name}: ${g.id}`).join(" · ")}.
					</p>
					<label>
						Contenido CSV
						<textarea value={csv} onChange={(e) => setCSV(e.target.value)} />
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
			<section
				className="panel student-directory"
				aria-label="Directorio de alumnos"
			>
				<div className="filters">
					<label>
						Buscar alumno
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Nombre o matrícula"
						/>
					</label>
					<label>
						Filtrar grupo
						<select
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
					<output aria-live="polite">
						{visible.length} de {s.students.length} alumnos
					</output>
					{(query || groupFilter || cycleFilter) && (
						<button type="button" onClick={onClearFilters}>
							Limpiar filtros
						</button>
					)}
				</div>
				<section
					className="table-scroll"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: enables keyboard scrolling of the table.
					tabIndex={0}
					aria-label="Resultados de alumnos, desplazamiento horizontal"
				>
					<table>
						<caption className="sr-only">
							Alumnos y grupos históricos por ciclo escolar
						</caption>
						<thead>
							<tr>
								<th scope="col">Alumno</th>
								<th scope="col">Matrícula</th>
								<th scope="col">Grupos por ciclo</th>
								<th scope="col">Expediente</th>
							</tr>
						</thead>
						<tbody>
							{visible.map((x) => (
								<tr key={x.id}>
									<td>
										<strong>{x.name}</strong>
									</td>
									<td>{x.matricula}</td>
									<td>
										{x.enrollments.map((e) => (
											<p key={e.cycle}>
												{groupName(activeGroup(s, x.id, e.cycle))} ·{" "}
												{s.cycles.find((c) => c.id === e.cycle)?.name}
											</p>
										))}
									</td>
									<td>
										<button
											id={`student-${x.id}`}
											type="button"
											onClick={() => setProfile(x.id)}
										>
											Abrir {x.name}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
				{!visible.length && (
					<p>No se encontraron alumnos. Limpia los filtros o inscribe uno.</p>
				)}
			</section>
		</>
	);
}
