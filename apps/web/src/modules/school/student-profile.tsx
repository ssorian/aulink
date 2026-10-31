import "./student-profile.css";
import { useState } from "react";
import { Icon } from "../../components/ui/icon";
import { Panel } from "../../components/ui/panel";
import { WorkspaceTabs } from "../../components/ui/workspace-tabs";
import { AttendanceView } from "./attendance-view";
import { ConductView } from "./conduct-view";
import { cycleStartYear } from "./experience";
import { GradeRecords } from "./grades-view";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import { activeGroup, isVerifiedGuardian, type State } from "./workflows";

const tabs = ["Resumen", "Asistencia", "Calificaciones", "Conducta"] as const;
export type ProfileTab = (typeof tabs)[number];

const plural = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`;

/** One status vocabulary for the whole profile: ok, warn, off or current. */
export function ProfileBadge({
	tone,
	children,
}: {
	tone: "ok" | "warn" | "off" | "current";
	children: string;
}) {
	return (
		<span className={`profile-badge profile-badge--${tone}`}>{children}</span>
	);
}

const guardianTone = (status: string) =>
	isVerifiedGuardian(status) ? "ok" : status === "Revocado" ? "off" : "warn";

export function StudentProfile({
	s,
	open,
	studentId,
	onGroup,
	initialTab = "Resumen",
}: Pick<ViewProps, "s" | "open"> & {
	studentId: string;
	onGroup: (id: string) => void;
	initialTab?: ProfileTab;
}) {
	const [tab, setTab] = useState<ProfileTab>(initialTab);
	const selected = s.students.find((x) => x.id === studentId);
	if (!selected) return null;
	const groupName = (id: string) =>
		s.groups.find((g) => g.id === id)?.name || id;
	const cycleName = (id: string) =>
		s.cycles.find((c) => c.id === id)?.name || id;
	const enrollments = [...selected.enrollments].sort(
		(a, b) =>
			(cycleStartYear(s, b.cycle) ?? 0) - (cycleStartYear(s, a.cycle) ?? 0),
	);
	const current = enrollments[0];
	const currentGroup = current
		? activeGroup(s, studentId, current.cycle) || current.group
		: undefined;
	const individual = {
		...s,
		students: [selected],
		events: s.events.filter((e) => e.student === studentId),
		conduct: s.conduct.filter((c) => c.student === studentId),
		grades: s.grades.filter((g) => g.student === studentId),
	};
	const groupOption = (g: State["groups"][number]) => ({
		id: g.id,
		name: `${g.name} · ${cycleName(g.cycle)}`,
	});
	return (
		<>
			<section className="workspace-heading student-heading">
				<div>
					<h2>{selected.name}</h2>
					<p>
						Matrícula {selected.matricula} ·{" "}
						{current && currentGroup
							? `${groupName(currentGroup)} · ${cycleName(current.cycle)}`
							: "Sin inscripción"}
					</p>
				</div>
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
											.map(groupOption),
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
											.map(groupOption),
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
			<WorkspaceTabs
				label="Expediente del alumno"
				items={tabs}
				value={tab}
				onChange={setTab}
			/>
			{tab === "Resumen" && (
				<div className="profile-summary">
					<PendingWork s={individual} onTab={setTab} />
					<Panel heading="Inscripción">
						{!current && <p>Sin inscripciones registradas.</p>}
						{current && (
							<CycleRecord
								s={s}
								studentId={studentId}
								enrollment={current}
								isCurrent
								onGroup={onGroup}
							/>
						)}
						{enrollments.length > 1 && (
							<details className="profile-history">
								<summary>Ciclos anteriores ({enrollments.length - 1})</summary>
								{enrollments.slice(1).map((e) => (
									<CycleRecord
										key={e.cycle}
										s={s}
										studentId={studentId}
										enrollment={e}
										onGroup={onGroup}
									/>
								))}
							</details>
						)}
					</Panel>
					<Guardians s={s} open={open} student={selected} />
					<Credential s={s} open={open} student={selected} />
				</div>
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

function PendingWork({
	s,
	onTab,
}: {
	s: State;
	onTab: (tab: ProfileTab) => void;
}) {
	const drafts = s.grades.filter((g) => !g.published).length;
	const reports = s.conduct.filter((c) => !c.published).length;
	return (
		<section className="profile-pending" aria-labelledby="profile-pending">
			<h2 id="profile-pending">Pendientes</h2>
			{!drafts && !reports ? (
				<p>Sin pendientes de publicación.</p>
			) : (
				<ul>
					{drafts > 0 && (
						<li>
							<button
								type="button"
								className="link-button"
								onClick={() => onTab("Calificaciones")}
							>
								{plural(
									drafts,
									"calificación en borrador",
									"calificaciones en borrador",
								)}
							</button>
						</li>
					)}
					{reports > 0 && (
						<li>
							<button
								type="button"
								className="link-button"
								onClick={() => onTab("Conducta")}
							>
								{plural(
									reports,
									"reporte de conducta sin publicar",
									"reportes de conducta sin publicar",
								)}
							</button>
						</li>
					)}
				</ul>
			)}
		</section>
	);
}

function CycleRecord({
	s,
	studentId,
	enrollment,
	isCurrent = false,
	onGroup,
}: {
	s: State;
	studentId: string;
	enrollment: State["students"][number]["enrollments"][number];
	isCurrent?: boolean;
	onGroup: (id: string) => void;
}) {
	const groupName = (id: string) =>
		s.groups.find((g) => g.id === id)?.name || id;
	const active =
		activeGroup(s, studentId, enrollment.cycle) || enrollment.group;
	const transfers = s.transfers.filter(
		(t) => t.student === studentId && t.cycle === enrollment.cycle,
	);
	return (
		<article className="profile-cycle">
			<header>
				<h3>{s.cycles.find((c) => c.id === enrollment.cycle)?.name}</h3>
				{isCurrent && <ProfileBadge tone="current">Actual</ProfileBadge>}
			</header>
			<dl className="profile-facts">
				<div>
					<dt>Grupo</dt>
					<dd>
						<button
							type="button"
							className="link-button"
							aria-label={`Abrir grupo ${groupName(active)}`}
							onClick={() => onGroup(active)}
						>
							{groupName(active)}
							<Icon name="arrow" size={14} />
						</button>
					</dd>
				</div>
				{enrollment.group !== active && (
					<div>
						<dt>Inscripción original</dt>
						<dd>{groupName(enrollment.group)}</dd>
					</div>
				)}
			</dl>
			{transfers.length > 0 && (
				<ol className="profile-transfers" aria-label="Cambios de grupo">
					{transfers.map((t) => (
						<li key={t.id}>
							<strong>
								{groupName(t.from)} <Icon name="arrow" size={14} />{" "}
								{groupName(t.to)}
							</strong>
							<dl className="profile-facts">
								<div>
									<dt>Motivo</dt>
									<dd>{t.reason}</dd>
								</div>
								<div>
									<dt>Registró</dt>
									<dd>{t.author}</dd>
								</div>
							</dl>
						</li>
					))}
				</ol>
			)}
		</article>
	);
}

function Guardians({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: State["students"][number] }) {
	const links = s.links.filter((l) => l.student === student.id);
	return (
		<Panel heading="Padres o tutores">
			{!links.length && <p>Sin padres o tutores vinculados.</p>}
			<ul className="profile-list">
				{links.map((l) => (
					<li key={l.id}>
						<div className="profile-guardian">
							<div className="profile-row">
								<strong>{l.name}</strong>
								<ProfileBadge tone={guardianTone(l.status)}>
									{isVerifiedGuardian(l.status)
										? "Verificado en el registro"
										: l.status}
								</ProfileBadge>
							</div>
							<button
								type="button"
								aria-label={`Restringir o revocar a ${l.name}`}
								disabled={l.status === "Revocado"}
								onClick={() =>
									open(
										"guardian-status",
										`Cambiar vínculo de ${l.name}`,
										[
											options("status", "Nuevo estado", [
												{ id: "Restringido", name: "Restringido" },
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
						{l.history.length > 0 && (
							<details className="profile-history">
								<summary>Historial del vínculo</summary>
								<ul>
									{l.history.map((h) => (
										<li key={h.id}>
											{h.value} · {h.reason} · {h.author}
										</li>
									))}
								</ul>
							</details>
						)}
					</li>
				))}
			</ul>
			<div className="actions">
				<button
					type="button"
					onClick={() =>
						open(
							"guardian",
							`Vincular tutor a ${student.name}`,
							[field("name", "Nombre del padre, madre o tutor"), reason],
							{ student: student.id },
							[
								"Vínculo registrado sin verificación de identidad externa. Reutiliza el mismo nombre para vincular varios hijos. No se envía invitación.",
							],
						)
					}
				>
					Vincular tutor
				</button>
			</div>
		</Panel>
	);
}

function Credential({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: State["students"][number] }) {
	const all = s.credentials
		.filter((c) => c.student === student.id)
		.sort((a, b) => b.revision - a.revision);
	const active = all.find((c) => c.active);
	const earlier = all.filter((c) => c !== active);
	const action = active ? "Reemitir credencial" : "Emitir credencial";
	return (
		<Panel
			heading="Credencial"
			description="Modelo sin código escaneable; no sirve para acceso. Reemitir revoca la revisión anterior."
		>
			{active ? (
				<div className="profile-credential">
					<div className="profile-row">
						<strong>Revisión {active.revision}</strong>
						<ProfileBadge tone="ok">Vigente</ProfileBadge>
					</div>
					<p>{active.reason}</p>
				</div>
			) : (
				<p>Sin credencial vigente.</p>
			)}
			{earlier.length > 0 && (
				<details className="profile-history">
					<summary>Revisiones anteriores ({earlier.length})</summary>
					<ul>
						{earlier.map((c) => (
							<li key={c.id}>
								Revisión {c.revision} · {c.active ? "Vigente" : "Revocada"} ·{" "}
								{c.reason}
							</li>
						))}
					</ul>
				</details>
			)}
			<div className="actions">
				<button
					type="button"
					onClick={() =>
						open(
							"credential",
							`${action} de ${student.name}`,
							[reason],
							{ student: student.id },
							[
								`Alumno: ${student.name} · ${student.matricula}`,
								"MODELO NO VÁLIDO · Sin código escaneable",
							],
						)
					}
				>
					{action}
				</button>
			</div>
		</Panel>
	);
}
