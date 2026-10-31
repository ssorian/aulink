import { ProfileBadge } from "./profile-badge";
import { Empty, field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function ConductView({
	s,
	open,
	students,
	studentName,
	hideCreate = false,
	studentId,
	groupId,
}: Pick<ViewProps, "s" | "open" | "students" | "studentName"> & {
	hideCreate?: boolean;
	studentId?: string;
	groupId?: string;
}) {
	return (
		<>
			{studentId && <h2 className="profile-section-title">Conducta</h2>}
			{!hideCreate && (
				<button
					className="primary"
					type="button"
					disabled={studentId ? !groupId : undefined}
					onClick={() =>
						open(
							"conduct",
							"Registrar acompañamiento",
							[
								...(!studentId ? [students] : []),
								options("kind", "Tipo", [
									{ id: "Reconocimiento", name: "Reconocimiento" },
									{ id: "Incidente", name: "Incidente" },
								]),
								field("text", "Contenido del reporte", "textarea"),
								{
									...field(
										"internal",
										"Notas internas (no compartidas)",
										"textarea",
									),
									optional: true,
								},
								field("followup", "Seguimiento acordado", "textarea"),
								options("shared", "Visibilidad", [
									{ id: "Interno", name: "Solo interno" },
									{
										id: "Compartido",
										name: "Contenido público",
									},
								]),
							],
							studentId && groupId
								? { student: studentId, group: groupId }
								: undefined,
						)
					}
				>
					{studentId
						? "Registrar reconocimiento o incidente"
						: "Registrar reconocimiento / incidente"}
				</button>
			)}
			{studentId && !groupId && (
				<p>Se necesita un grupo activo para registrar conducta.</p>
			)}
			{s.conduct.map((c) => (
				<section className="panel" key={c.id}>
					{studentId ? (
						<ProfileBadge tone={c.published ? "ok" : "warn"}>
							{c.published ? "Publicado" : "Borrador"}
						</ProfileBadge>
					) : (
						<span className="pill">
							{c.published ? "Publicado" : "Borrador"}
						</span>
					)}
					{studentId ? (
						<h3>{c.kind}</h3>
					) : (
						<h2>
							{c.kind} · {studentName(c.student)}
						</h2>
					)}
					<p>
						{c.shared}: {c.text}
					</p>
					<p>
						{c.group
							? `${s.groups.find((g) => g.id === c.group)?.name || c.group} · ${s.cycles.find((x) => x.id === c.cycle)?.name || c.cycle}`
							: "Grupo/ciclo histórico no determinado"}
					</p>
					<div className="internal">
						<strong>Solo personal · notas internas</strong>
						<p>{c.internal || "Sin notas internas"}</p>
					</div>
					<p style={{ whiteSpace: "pre-line" }}>Seguimiento: {c.followup}</p>
					<button
						type="button"
						onClick={() =>
							open(
								"conduct-followup",
								`Agregar seguimiento: ${c.id}`,
								[field("followup", "Nuevo seguimiento", "textarea"), reason],
								{ id: c.id },
								["Se agrega al seguimiento previo sin borrarlo."],
							)
						}
					>
						Agregar seguimiento
					</button>
					<button
						type="button"
						disabled={c.published}
						onClick={() =>
							open(
								"conduct-publish",
								`Revisar reporte de ${studentName(c.student)}`,
								[],
								{ id: c.id },
								[
									`${c.shared}: ${c.text}`,
									`Seguimiento: ${c.followup}`,
									"Las notas internas no forman parte del contenido compartido.",
								],
							)
						}
					>
						Revisar publicación
					</button>
				</section>
			))}
			{!s.conduct.length && (
				<Empty
					text={
						studentId && !groupId
							? "No hay registros de conducta."
							: "Registra un reconocimiento o incidente con seguimiento concreto."
					}
				/>
			)}
		</>
	);
}
