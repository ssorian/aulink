import { DataTable } from "../../components/ui/data-table";
import { cycleStartYear } from "./experience";
import { ProfileBadge } from "./profile-badge";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";

export function StudentGrades({
	s,
	open,
	studentName,
}: Pick<ViewProps, "s" | "open"> & { studentName: string }) {
	const rows = s.grades.map((grade) => {
		const assignment = s.assignments.find((a) => a.id === grade.assignment);
		const group = s.groups.find((g) => g.id === assignment?.group);
		return { grade, assignment, group, cycle: group?.cycle ?? "" };
	});
	const cycles = [...new Set(rows.map((row) => row.cycle))].sort(
		(a, b) => (cycleStartYear(s, b) ?? 0) - (cycleStartYear(s, a) ?? 0),
	);
	return (
		<section className="panel profile-grades">
			<h2>Calificaciones</h2>
			{!rows.length && <p>Sin calificaciones capturadas para este alumno.</p>}
			{cycles.map((cycle) => {
				const cycleRows = rows
					.filter((row) => row.cycle === cycle)
					.sort(
						(a, b) =>
							(a.assignment?.subject ?? "").localeCompare(
								b.assignment?.subject ?? "",
								"es",
							) ||
							(a.assignment?.period ?? "").localeCompare(
								b.assignment?.period ?? "",
								"es",
							),
					);
				const groups = [
					...new Set(
						cycleRows.map((row) => row.group?.name ?? "Grupo desconocido"),
					),
				];
				const caption = `${s.cycles.find((c) => c.id === cycle)?.name ?? "Ciclo desconocido"} · ${groups.join(", ")}`;
				return (
					<DataTable
						key={cycle}
						caption={caption}
						scrollClassName="profile-grades-scroll"
					>
						<thead>
							<tr>
								<th scope="col">Materia</th>
								<th scope="col">Evaluación</th>
								<th scope="col">Calificación</th>
								<th scope="col">Estado</th>
								<th scope="col">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{cycleRows.map(({ grade: g, assignment: a, group }) => {
								const subject = a?.subject ?? "Materia desconocida";
								const period = a?.period ?? "Periodo desconocido";
								return (
									<tr key={g.id}>
										<th scope="row">
											{subject}
											{groups.length > 1 && (
												<small className="profile-grade-scale">
													{group?.name ?? "Grupo desconocido"}
												</small>
											)}
										</th>
										<td>{period}</td>
										<td className="profile-grade-value">
											{g.value}
											{a && (
												<small className="profile-grade-scale">
													de {a.min}–{a.max}
												</small>
											)}
										</td>
										<td>
											<ProfileBadge tone={g.published ? "ok" : "warn"}>
												{g.published ? "Publicado" : "Borrador"}
											</ProfileBadge>
											{g.history.length > 0 && (
												<details className="profile-history">
													<summary>Historial ({g.history.length})</summary>
													<ul>
														{g.history.map((h) => (
															<li key={h.id}>
																{h.value} · {h.reason} · {h.author}
															</li>
														))}
													</ul>
												</details>
											)}
										</td>
										<td>
											<div className="actions profile-grade-actions">
												<button
													type="button"
													aria-label={`Corregir calificación de ${subject} · ${period}`}
													onClick={() =>
														open(
															"grade",
															`Corregir calificación de ${studentName}`,
															[
																field("value", "Nueva calificación", "number"),
																reason,
															],
															{
																assignment: g.assignment,
																student: g.student,
																value: String(g.value),
															},
														)
													}
												>
													Corregir con motivo
												</button>
												<button
													type="button"
													aria-label={`Revisar publicación de ${subject} · ${period}`}
													disabled={g.published}
													onClick={() =>
														open(
															"grade-publish",
															`Publicar calificación de ${studentName}`,
															[],
															{ id: g.id },
															[`${g.value} · ${a?.subject}`],
														)
													}
												>
													Revisar publicación
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</DataTable>
				);
			})}
		</section>
	);
}
