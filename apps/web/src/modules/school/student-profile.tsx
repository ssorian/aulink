import { useState } from "react";
import { WorkspaceTabs } from "../../components/ui/workspace-tabs";
import { AttendanceView } from "./attendance-view";
import { ConductView } from "./conduct-view";
import { CredentialsView } from "./credentials-view";
import { GradeRecords } from "./grades-view";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import { activeGroup, isVerifiedGuardian } from "./workflows";

const tabs = [
	"Inscripciones",
	"Tutores",
	"Credenciales",
	"Asistencia",
	"Calificaciones",
	"Conducta",
];
export function StudentProfile({
	s,
	open,
	studentId,
	onBack,
	onGroup,
	backLabel = "Volver a Alumnos",
}: Pick<ViewProps, "s" | "open"> & {
	studentId: string;
	backLabel?: string;
	onBack: () => void;
	onGroup: (id: string) => void;
}) {
	const [tab, setTab] = useState("Inscripciones");
	const selected = s.students.find((x) => x.id === studentId);
	if (!selected) return null;
	const groupName = (id: string) =>
		s.groups.find((g) => g.id === id)?.name || id;
	const individual = {
		...s,
		students: [selected],
		events: s.events.filter((e) => e.student === studentId),
		conduct: s.conduct.filter((c) => c.student === studentId),
		grades: s.grades.filter((g) => g.student === studentId),
	};
	return (
		<>
			<button type="button" onClick={onBack}>
				← {backLabel}
			</button>
			<section className="workspace-heading">
				<div>
					<h2>{selected.name}</h2>
					<p>Matrícula: {selected.matricula}</p>
				</div>
			</section>
			<WorkspaceTabs
				label="Expediente del alumno"
				items={tabs}
				value={tab}
				onChange={setTab}
			/>
			{tab === "Inscripciones" && (
				<section className="panel">
					<h2>Inscripción e historial de grupos</h2>
					{selected.enrollments.map((e) => (
						<article className="list-row" key={e.cycle}>
							<h3>{s.cycles.find((c) => c.id === e.cycle)?.name}</h3>
							<p>Inscripción original: {groupName(e.group)}</p>
							<p>
								Grupo activo de este ciclo:{" "}
								{groupName(activeGroup(s, studentId, e.cycle) || e.group)}
							</p>
							<button
								type="button"
								onClick={() =>
									onGroup(activeGroup(s, studentId, e.cycle) || e.group)
								}
							>
								Abrir grupo
							</button>
							{s.transfers
								.filter((t) => t.student === studentId && t.cycle === e.cycle)
								.map((t) => (
									<p key={t.id}>
										{groupName(t.from)} → {groupName(t.to)} · {t.reason} ·{" "}
										{t.author}
									</p>
								))}
						</article>
					))}
					<div className="actions">
						<button
							type="button"
							onClick={() =>
								open(
									"enroll",
									`Reinscribir a ${selected.name}`,
									[
										options(
											"group",
											"Grupo de otro ciclo",
											s.groups
												.filter(
													(g) =>
														!selected.enrollments.some(
															(e) => e.cycle === g.cycle,
														),
												)
												.map((g) => ({
													id: g.id,
													name: `${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
												})),
										),
									],
									{ student: studentId },
								)
							}
						>
							Reinscribir en otro ciclo
						</button>
						<button
							type="button"
							onClick={() =>
								open(
									"transfer",
									`Cambiar de grupo a ${selected.name}`,
									[
										options(
											"group",
											"Grupo destino del mismo ciclo",
											s.groups
												.filter(
													(g) =>
														selected.enrollments.some(
															(e) => e.cycle === g.cycle,
														) && activeGroup(s, studentId, g.cycle) !== g.id,
												)
												.map((g) => ({
													id: g.id,
													name: `${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
												})),
										),
										reason,
									],
									{ student: studentId },
									[
										"La inscripción original y los eventos previos se conservan. Solo cambia el grupo activo de ese ciclo.",
									],
								)
							}
						>
							Cambiar de grupo
						</button>
					</div>
				</section>
			)}
			{tab === "Tutores" && (
				<section className="panel">
					<h3>Vínculos familiares</h3>
					<button
						type="button"
						onClick={() =>
							open(
								"guardian",
								`Vincular tutor a ${selected.name}`,
								[field("name", "Nombre del tutor"), reason],
								{ student: selected.id },
								[
									"Vínculo registrado sin verificación de identidad externa. Reutiliza el mismo nombre para vincular varios hijos. No se envía invitación.",
								],
							)
						}
					>
						Vincular tutor
					</button>
					{s.links
						.filter((l) => l.student === selected.id)
						.map((l) => (
							<article className="list-row" key={l.id}>
								<strong>{l.name}</strong>{" "}
								<span className="pill">
									{isVerifiedGuardian(l.status)
										? "Verificado en el registro"
										: l.status}
								</span>
								<div className="actions">
									<button
										type="button"
										disabled={l.status === "Revocado"}
										onClick={() =>
											open(
												"guardian-status",
												`Cambiar vínculo de ${l.name}`,
												[
													options("status", "Nuevo estado", [
														{
															id: "Restringido",
															name: "Restringido",
														},
														{ id: "Revocado", name: "Revocado" },
													]),
													reason,
												],
												{ id: l.id },
											)
										}
									>
										Restringir o revocar
									</button>
								</div>
								{l.history.map((h) => (
									<p key={h.id}>
										{h.value} · {h.reason} · {h.author}
									</p>
								))}
							</article>
						))}
				</section>
			)}
			{tab === "Credenciales" && (
				<CredentialsView s={s} open={open} studentId={studentId} />
			)}
			{tab === "Asistencia" && (
				<AttendanceView
					s={individual}
					open={open}
					studentName={() => selected.name}
				/>
			)}
			{tab === "Calificaciones" && (
				<GradeRecords
					s={individual}
					open={open}
					studentName={() => selected.name}
				/>
			)}
			{tab === "Conducta" && (
				<ConductView
					s={individual}
					open={open}
					students={options("student", "Alumno", [selected])}
					studentName={() => selected.name}
					hideCreate
				/>
			)}
		</>
	);
}
