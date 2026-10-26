import "./students-view.css";
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
	return (
		<section
			className="panel student-directory"
			aria-label="Directorio de alumnos"
		>
			<header className="directory-header">
				<div>
					<h2>Directorio de alumnos</h2>
					<output aria-live="polite">
						{visible.length} de {s.students.length} alumnos
					</output>
				</div>
				<div className="actions">
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
				</div>
			</header>
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
				<label htmlFor="directory-query">
					Buscar alumno
					<input
						id="directory-query"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Nombre o matrícula"
					/>
				</label>
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
				{(query || groupFilter || cycleFilter) && (
					<button type="button" onClick={onClearFilters}>
						Limpiar filtros
					</button>
				)}
			</div>
			<p className="directory-scroll-hint" id="directory-scroll-hint">
				Desliza la tabla para ver grupos y expedientes.
			</p>
			<section
				className="table-scroll"
				aria-describedby="directory-scroll-hint"
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
							<th scope="col">Grupos por ciclo</th>
							<th scope="col">Expediente</th>
						</tr>
					</thead>
					<tbody>
						{visible.map((x) => (
							<tr key={x.id}>
								<td>
									<strong>{x.name}</strong>
									<span className="directory-matricula">{x.matricula}</span>
								</td>
								<td>
									{x.enrollments.map((e) => (
										<p className="directory-enrollment" key={e.cycle}>
											<span className="directory-group">
												{groupName(activeGroup(s, x.id, e.cycle))}
											</span>{" "}
											{s.cycles.find((c) => c.id === e.cycle)?.name}
										</p>
									))}
								</td>
								<td>
									<button
										id={`student-${x.id}`}
										className="directory-profile"
										aria-label={`Abrir ${x.name}`}
										type="button"
										onClick={() => setProfile(x.id)}
									>
										Ver expediente
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
	);
}
