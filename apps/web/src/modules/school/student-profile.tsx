import "./student-profile.css";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "../../components/ui/icon";
import { WorkspaceTabs } from "../../components/ui/workspace-tabs";
import { summarizeAttendance } from "./attendance-record";
import {
	DEMO_ATTENDANCE,
	DEMO_CUTOFF,
	DEMO_JUSTIFIED,
	DEMO_RULES,
} from "./attendance-record-demo";
import { AttendanceView, formatDay } from "./attendance-view";
import { ConductView } from "./conduct-view";
import { cycleStartYear } from "./experience";
import { ProfileBadge } from "./profile-badge";
import { StudentGrades } from "./student-grades";
import { summarizeGrades } from "./student-summary";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import {
	activeGroup,
	isVerifiedGuardian,
	type State,
	wasEnrolled,
} from "./workflows";

const tabs = ["Resumen", "Asistencia", "Calificaciones", "Conducta"] as const;
export type ProfileTab = (typeof tabs)[number];

type Student = State["students"][number];
type Link = State["links"][number];

const missing = "Sin registrar";
const decimal = new Intl.NumberFormat("es-MX", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase())
		.join("");

const guardianTone = (status: string) =>
	isVerifiedGuardian(status) ? "ok" : status === "Revocado" ? "off" : "warn";
const guardianStatus = (status: string) =>
	isVerifiedGuardian(status) ? "Verificado en el registro" : status;

type Tone = "sky" | "lilac" | "teal" | "peach" | "mustard";

/** One block of the Resumen: header bar (tone chip, title, meta, quiet action), body, optional footer. */
function Card({
	heading,
	tone,
	icon,
	meta,
	action,
	footer,
	flush,
	children,
}: {
	heading: string;
	tone: Tone;
	icon: IconName;
	meta?: ReactNode;
	action?: ReactNode;
	footer?: ReactNode;
	flush?: boolean;
	children: ReactNode;
}) {
	const headingId = useId();
	return (
		<section
			className={`panel ui-panel profile-card profile-card--${tone}`}
			aria-labelledby={headingId}
		>
			<header className="profile-card-head">
				<div className="profile-card-title">
					<span className="profile-card-chip" aria-hidden="true">
						<Icon name={icon} size={18} />
					</span>
					<h2 id={headingId}>{heading}</h2>
					{meta && <span className="profile-card-meta">{meta}</span>}
				</div>
				{action}
			</header>
			{flush ? children : <div className="profile-card-body">{children}</div>}
			{footer && <div className="profile-card-foot">{footer}</div>}
		</section>
	);
}

function CardLink({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			className="link-button profile-card-action"
			onClick={onClick}
		>
			{label}
			<Icon name="arrow" size={14} />
		</button>
	);
}

type Stat = {
	label: string;
	value: ReactNode;
	caption?: string;
	primary?: boolean;
	/** Secondary metric with a status dot; the label already names what it means. */
	status?: "ok" | "warn" | "danger" | "muted";
	/** Decorative bar for focal numbers; the value text carries the meaning. */
	meter?: { percent: number; minimum: number };
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function Meter({ percent, minimum }: { percent: number; minimum: number }) {
	return (
		<span className="profile-meter" aria-hidden="true">
			<span style={{ width: `${clamp(percent)}%` }} />
			<i style={{ left: `${clamp(minimum)}%` }} />
		</span>
	);
}

function Stats({ items, compact }: { items: Stat[]; compact?: boolean }) {
	return (
		<div className="profile-stats-clip">
			<dl
				className={`profile-stats${compact ? " profile-stats--compact" : ""}`}
			>
				{items.map((x) => (
					<div
						key={x.label}
						className={
							[
								x.primary && "profile-stat--primary",
								x.status && `profile-stat--dot profile-stat--${x.status}`,
							]
								.filter(Boolean)
								.join(" ") || undefined
						}
					>
						<dt>{x.label}</dt>
						<dd>{x.value}</dd>
						{x.meter && (
							<dd className="profile-stat-meter" aria-hidden="true">
								<Meter {...x.meter} />
							</dd>
						)}
						{x.caption && <dd className="profile-stat-caption">{x.caption}</dd>}
					</div>
				))}
			</dl>
		</div>
	);
}

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
	const cycleName = (id: string) =>
		s.cycles.find((c) => c.id === id)?.name || id;
	const current = [...selected.enrollments].sort(
		(a, b) =>
			(cycleStartYear(s, b.cycle) ?? 0) - (cycleStartYear(s, a.cycle) ?? 0),
	)[0];
	const currentGroup = current
		? activeGroup(s, studentId, current.cycle)
		: undefined;
	const group = s.groups.find((g) => g.id === currentGroup);
	const withdrawn =
		!!current &&
		s.withdrawals.some(
			(w) => w.student === studentId && w.cycle === current.cycle,
		);
	// Grades captured before a transfer belong to the cycle, so every group of it counts.
	const cycleGroups = s.groups
		.filter(
			(g) => g.cycle === current?.cycle && wasEnrolled(s, studentId, g.id),
		)
		.map((g) => g.id);
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
	const headline = [
		`Matrícula ${selected.matricula}`,
		...(group && !withdrawn ? [group.name] : []),
		...(current ? [cycleName(current.cycle)] : ["Sin inscripción"]),
	].join(" · ");
	return (
		<>
			<section className="workspace-heading student-heading">
				<div>
					<h2>{selected.name}</h2>
					<p>
						{headline}
						{withdrawn && (
							<>
								{" "}
								<ProfileBadge tone="off">Baja</ProfileBadge>
							</>
						)}
					</p>
				</div>
				<div className="actions">
					<button
						type="button"
						disabled={!currentGroup}
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
					<button
						type="button"
						className="button-danger"
						disabled={!currentGroup}
						onClick={() => openWithdraw(open, selected)}
					>
						Dar de baja
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
					<div className="profile-main">
						<Card heading="Grado y grupo" tone="sky" icon="layers" flush>
							{current && currentGroup && group ? (
								<Stats
									compact
									items={[
										{ label: "Grado", value: group.grade || "Sin grado" },
										{
											label: "Grupo",
											value: (
												<button
													type="button"
													className="link-button"
													aria-label={`Abrir grupo ${group.name}`}
													onClick={() => onGroup(group.id)}
												>
													{group.name}
													<Icon name="arrow" size={14} />
												</button>
											),
										},
										{ label: "Ciclo", value: cycleName(current.cycle) },
										...(group.shift
											? [{ label: "Turno", value: group.shift }]
											: []),
									]}
								/>
							) : (
								<p className="profile-stats-empty">
									{withdrawn && current
										? `Alumno dado de baja en ${cycleName(current.cycle)}.`
										: "Sin inscripción activa."}
								</p>
							)}
						</Card>
						<GradesSummary
							s={s}
							studentId={studentId}
							groups={cycleGroups}
							onTab={setTab}
						/>
						<AttendanceSummary onTab={setTab} />
					</div>
					<div className="profile-side">
						<Guardians s={s} open={open} student={selected} />
						<Credential s={s} open={open} student={selected} />
					</div>
				</div>
			)}
			{tab === "Asistencia" && <AttendanceView />}
			{tab === "Calificaciones" && (
				<StudentGrades s={individual} open={open} studentName={selected.name} />
			)}
			{tab === "Conducta" && (
				<ConductView
					s={individual}
					open={open}
					students={options("student", "Alumno", [selected])}
					studentName={() => selected.name}
					studentId={studentId}
					groupId={currentGroup}
				/>
			)}
		</>
	);
}

export const openWithdraw = (open: ViewProps["open"], student: Student) =>
	open(
		"withdraw",
		`Dar de baja a ${student.name}`,
		[reason],
		{ student: student.id },
		[
			"El alumno sale de las listas del grupo y de los avisos a sus tutores. Sus registros se conservan.",
		],
	);

function GradesSummary({
	s,
	studentId,
	groups,
	onTab,
}: {
	s: State;
	studentId: string;
	groups: string[];
	onTab: (tab: ProfileTab) => void;
}) {
	const g = summarizeGrades(s, studentId, groups);
	const { passing } = s.evaluationRules;
	return (
		<Card
			heading="Calificaciones"
			tone="lilac"
			icon="book"
			flush
			action={
				<CardLink
					label="Ver calificaciones"
					onClick={() => onTab("Calificaciones")}
				/>
			}
		>
			<Stats
				items={[
					{
						label: "Promedio",
						value: g.average === null ? "—" : decimal.format(g.average),
						caption:
							g.average === null
								? "Sin calificaciones publicadas"
								: "calificaciones publicadas",
						primary: true,
						meter:
							g.average === null
								? undefined
								: { percent: g.average * 10, minimum: passing * 10 },
					},
					{
						label: "Materias calificadas",
						value: `${g.graded} de ${g.subjects}`,
					},
					{
						label: `Bajo el mínimo (${passing})`,
						value: g.failing,
						status: g.failing > 0 ? "danger" : "ok",
					},
					{
						label: "En borrador",
						value: g.drafts,
						status: g.drafts > 0 ? "warn" : "muted",
					},
				]}
			/>
		</Card>
	);
}

function AttendanceSummary({ onTab }: { onTab: (tab: ProfileTab) => void }) {
	const { general, subjects, pending } = summarizeAttendance(
		DEMO_ATTENDANCE,
		DEMO_JUSTIFIED,
		DEMO_RULES,
	);
	const risk = subjects.filter((x) => x.atRisk).length;
	return (
		<Card
			heading="Asistencia"
			tone="teal"
			icon="calendar"
			flush
			meta={
				<>
					<span>al {formatDay(DEMO_CUTOFF)}</span>
					<ProfileBadge tone="neutral">Datos de muestra</ProfileBadge>
				</>
			}
			action={
				<CardLink label="Ver asistencia" onClick={() => onTab("Asistencia")} />
			}
		>
			{general.percent === null ? (
				<p className="profile-stats-empty">
					El ciclo todavía no tiene días de clase transcurridos.
				</p>
			) : (
				<Stats
					items={[
						{
							label: "Entradas al plantel",
							value: `${general.percent} %`,
							caption: `${general.attended} de ${general.total} días con entrada`,
							primary: true,
							meter: {
								percent: general.percent,
								minimum: DEMO_RULES.minimumPercent,
							},
						},
						{
							label: "Materias en riesgo",
							value: risk,
							caption: "pase de lista por materia",
							status: risk > 0 ? "danger" : "ok",
						},
						{
							label: "Faltas por justificar",
							value: pending.length,
							status: pending.length > 0 ? "warn" : "ok",
						},
					]}
				/>
			)}
		</Card>
	);
}

/** Two guardians at most: usable links first, revoked ones only fill spare slots. */
const shownGuardians = (links: Link[]) =>
	[...links]
		.sort((a, b) => +(a.status === "Revocado") - +(b.status === "Revocado"))
		.slice(0, 2);

function Guardians({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: Student }) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const links = s.links.filter((l) => l.student === student.id);
	const usable = links.filter((l) => l.status !== "Revocado").length;
	const selected = links.find((l) => l.id === selectedId);
	return (
		<Card
			heading="Tutores"
			tone="peach"
			icon="users"
			flush
			meta={`${shownGuardians(links).length} de 2`}
			footer={
				usable < 2 ? (
					<button
						type="button"
						className="link-button"
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
				) : undefined
			}
		>
			{!links.length && (
				<p className="profile-empty">Sin tutores vinculados.</p>
			)}
			<ul className="profile-list">
				{shownGuardians(links).map((l, i) => (
					<li key={l.id}>
						<button
							type="button"
							className="profile-guardian"
							aria-haspopup="dialog"
							aria-label={`Ver datos de ${l.name}`}
							onClick={() => setSelectedId(l.id)}
						>
							<span
								className={`profile-initials profile-initials--${i % 2 ? "lilac" : "peach"}`}
								aria-hidden="true"
							>
								{initials(l.name)}
							</span>
							<span className="profile-guardian-name">
								<strong>{l.name}</strong>
								<span className="profile-guardian-meta">
									{l.relation && <span>{l.relation}</span>}
									<ProfileBadge tone={guardianTone(l.status)}>
										{guardianStatus(l.status)}
									</ProfileBadge>
								</span>
							</span>
							<Icon name="chevron" size={16} />
						</button>
					</li>
				))}
			</ul>
			<GuardianDialog
				link={selected}
				open={open}
				onClose={() => setSelectedId(null)}
			/>
		</Card>
	);
}

function GuardianDialog({
	link,
	open,
	onClose,
}: Pick<ViewProps, "open"> & { link?: Link; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = ref.current;
		if (link && dialog && !dialog.open) dialog.showModal();
	}, [link]);
	// Native close restores focus to the row that opened the dialog.
	const close = () => ref.current?.close();
	return (
		<dialog
			ref={ref}
			className="profile-dialog"
			aria-labelledby="guardian-dialog-title"
			onClose={onClose}
		>
			{link && (
				<>
					<div className="dialog-head">
						<button
							type="button"
							className="dialog-close"
							onClick={close}
							aria-label="Cerrar"
						>
							<Icon name="close" size={18} />
						</button>
					</div>
					<GuardianDetail link={link} open={open} onClose={close} />
				</>
			)}
		</dialog>
	);
}

/** Dialog content. Editing closes this dialog first, then opens the shared flow. */
export function GuardianDetail({
	link,
	open,
	onClose,
}: Pick<ViewProps, "open"> & { link: Link; onClose: () => void }) {
	return (
		<>
			<h2 id="guardian-dialog-title">{link.name}</h2>
			<dl className="profile-facts">
				<div>
					<dt>Parentesco</dt>
					<dd>{link.relation || missing}</dd>
				</div>
				<div>
					<dt>Teléfono</dt>
					<dd>{link.phone || missing}</dd>
				</div>
				<div>
					<dt>Correo</dt>
					<dd>{link.email || missing}</dd>
				</div>
				<div>
					<dt>Estado</dt>
					<dd>{guardianStatus(link.status)}</dd>
				</div>
			</dl>
			<div className="actions">
				<button
					type="button"
					onClick={() => {
						onClose();
						open(
							"guardian-edit",
							`Editar datos de ${link.name}`,
							[
								field("name", "Nombre"),
								{ ...field("relation", "Parentesco"), optional: true },
								{ ...field("phone", "Teléfono", "tel"), optional: true },
								{ ...field("email", "Correo", "email"), optional: true },
							],
							{
								id: link.id,
								name: link.name,
								relation: link.relation ?? "",
								phone: link.phone ?? "",
								email: link.email ?? "",
							},
						);
					}}
				>
					Editar datos
				</button>
				<button
					type="button"
					className="button-danger"
					disabled={link.status === "Revocado"}
					onClick={() => {
						onClose();
						open(
							"guardian-status",
							`Cambiar vínculo de ${link.name}`,
							[
								options("status", "Nuevo estado", [
									{ id: "Restringido", name: "Restringido" },
									{ id: "Revocado", name: "Revocado" },
								]),
								reason,
							],
							{ id: link.id },
						);
					}}
				>
					Restringir o revocar
				</button>
			</div>
		</>
	);
}

export const credentialPreview = (student: Student, reissue: boolean) => [
	`Alumno: ${student.name} · ${student.matricula}`,
	"MODELO NO VÁLIDO · Sin código escaneable",
	...(reissue ? ["Reemitir revoca la revisión anterior."] : []),
];

function Credential({
	s,
	open,
	student,
}: Pick<ViewProps, "s" | "open"> & { student: Student }) {
	const active = s.credentials.find(
		(c) => c.student === student.id && c.active,
	);
	const action = active ? "Reemitir credencial" : "Emitir credencial";
	return (
		<Card
			heading="Credencial"
			tone="mustard"
			icon="card"
			footer={
				<button
					type="button"
					onClick={() =>
						open(
							"credential",
							`${action} de ${student.name}`,
							[reason],
							{ student: student.id },
							credentialPreview(student, !!active),
						)
					}
				>
					{action}
				</button>
			}
		>
			{active ? (
				<div className="profile-credential">
					<div className="profile-id-card">
						<span className="profile-id-band" aria-hidden="true" />
						<div className="profile-id-body">
							<span className="profile-id-school">{s.school.name}</span>
							<span className="profile-id-name">{student.name}</span>
							<strong className="profile-id-number">{student.matricula}</strong>
							<span className="profile-id-rev">Revisión {active.revision}</span>
						</div>
					</div>
					<div className="profile-row">
						<ProfileBadge tone="ok">Vigente</ProfileBadge>
					</div>
				</div>
			) : (
				<div className="profile-credential-empty">
					<strong>Sin credencial vigente</strong>
					<p>
						Puedes emitir una credencial para este alumno con el botón de abajo.
					</p>
				</div>
			)}
			<p className="profile-notice">
				<Icon name="help" size={14} />
				Modelo sin código escaneable; no sirve para acceso.
			</p>
		</Card>
	);
}
