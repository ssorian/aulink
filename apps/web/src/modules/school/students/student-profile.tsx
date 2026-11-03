import { useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import { WorkspaceTabs } from "../../../components/ui/workspace-tabs";
import { AttendanceView } from "../attendance/attendance-view";
import { ConductView } from "../conduct/conduct-view";
import { StudentGrades } from "../grades/student-grades";
import { options, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { activeGroup, type State, wasEnrolled } from "../shared/workflows";
import { cycleStartYear } from "./experience";
import { AttendanceSummary } from "./profile/attendance-summary";
import { Credential } from "./profile/credential";
import { Facts } from "./profile/facts";
import { GradesSummary } from "./profile/grades-summary";
import { Guardians } from "./profile/guardians";
import { type ProfileTab, profileTabs } from "./profile/profile-tab";
import { SummaryCard } from "./profile/summary-card";

export type { ProfileTab };

type Student = State["students"][number];

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
			<section
				data-slot="student-heading"
				className="mt-6 mb-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-3"
			>
				<div className="min-w-0">
					<h2 className="m-0 text-2xl font-semibold tracking-tight">
						{selected.name}
					</h2>
					<p className="m-0 mt-1 flex max-w-none flex-wrap items-center gap-2 text-sm text-muted-foreground">
						{headline}
						{withdrawn && <Badge tone="danger">Baja</Badge>}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
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
					</Button>
					<Button
						variant="danger"
						disabled={!currentGroup}
						onClick={() => openWithdraw(open, selected)}
					>
						Dar de baja
					</Button>
				</div>
			</section>
			<WorkspaceTabs
				label="Expediente del alumno"
				items={profileTabs}
				value={tab}
				onChange={setTab}
			/>
			<div className="mt-5">
				{tab === "Resumen" && (
					<div
						data-slot="profile-summary"
						className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
					>
						<div className="grid min-w-0 gap-4">
							<SummaryCard heading="Grado y grupo">
								{current && currentGroup && group ? (
									<Facts
										items={[
											{ label: "Grado", value: group.grade || "Sin grado" },
											{
												label: "Grupo",
												value: (
													<Button
														variant="link"
														className="-my-2.5 min-h-11 text-base"
														aria-label={`Abrir grupo ${group.name}`}
														onClick={() => onGroup(group.id)}
													>
														{group.name}
														<Icon name="arrow" size={14} />
													</Button>
												),
											},
											{ label: "Ciclo", value: cycleName(current.cycle) },
											...(group.shift
												? [{ label: "Turno", value: group.shift }]
												: []),
										]}
									/>
								) : (
									<p className="m-0 text-sm text-muted-foreground">
										{withdrawn && current
											? `Alumno dado de baja en ${cycleName(current.cycle)}.`
											: "Sin inscripción activa."}
									</p>
								)}
							</SummaryCard>
							<GradesSummary
								s={s}
								studentId={studentId}
								groups={cycleGroups}
								onTab={setTab}
							/>
							<AttendanceSummary onTab={setTab} />
						</div>
						<div className="grid min-w-0 gap-4">
							<Guardians s={s} open={open} student={selected} />
							<Credential s={s} open={open} student={selected} />
						</div>
					</div>
				)}
				{tab === "Asistencia" && <AttendanceView />}
				{tab === "Calificaciones" && (
					<StudentGrades
						s={individual}
						open={open}
						studentName={selected.name}
					/>
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
			</div>
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
