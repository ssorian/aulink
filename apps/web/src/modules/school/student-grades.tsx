import { useEffect, useId, useRef, useState } from "react";
import { DataTable } from "../../components/ui/data-table";
import { Icon } from "../../components/ui/icon";
import { cycleStartYear } from "./experience";
import { average, periodRows, periodState, situation } from "./grades-record";
import { DEMO_PERIODS, demoPeriod, GRADES_TODAY } from "./grades-record-demo";
import { ProfileBadge } from "./profile-badge";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";

type Grade = State["grades"][number];
const dateLabel = (date: string) =>
	new Date(`${date}T12:00:00Z`)
		.toLocaleDateString("es-MX", {
			day: "numeric",
			month: "short",
			timeZone: "UTC",
		})
		.replace(/\.$/, "");
const numberLabel = (value: number) =>
	value.toLocaleString("es-MX", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});

function GradeActions({
	grade,
	subject,
	closed,
	hint,
	studentName,
	open,
}: {
	grade: Grade;
	subject: string;
	closed: boolean;
	hint: string;
	studentName: string;
	open: ViewProps["open"];
}) {
	const id = useId();
	const popup = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const closeHistory = useRef<HTMLButtonElement>(null);
	const [history, setHistory] = useState(false);
	useEffect(() => {
		if (history) closeHistory.current?.focus();
	}, [history]);
	useEffect(() => {
		const node = popup.current;
		if (!node) return;
		const toggle = () => {
			if (!node.matches(":popover-open")) {
				if (
					node.contains(document.activeElement) ||
					document.activeElement === document.body
				)
					trigger.current?.focus();
				setHistory(false);
			}
		};
		node.addEventListener("toggle", toggle);
		return () => node.removeEventListener("toggle", toggle);
	}, []);
	const show = () => {
		const node = popup.current;
		const rect = trigger.current?.getBoundingClientRect();
		if (!node || !rect) return;
		// Measure at the origin so the menu never widens the page before placement.
		node.style.left = "0px";
		node.style.top = "0px";
		node.showPopover();
		// Right-aligned to the trigger: the actions column is the last one.
		node.style.left = `${Math.max(12, Math.min(rect.right - node.offsetWidth, window.innerWidth - node.offsetWidth - 12))}px`;
		node.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - node.offsetHeight - 12))}px`;
		node.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
	};
	const original = grade.history.length
		? grade.history[0].value.includes("→")
			? grade.history[0].value.split("→")[0].trim()
			: "No disponible"
		: String(grade.value);
	return (
		<>
			<button
				type="button"
				ref={trigger}
				aria-label={`Acciones de ${subject}`}
				aria-haspopup="dialog"
				aria-controls={id}
				className="profile-grade-trigger"
				onClick={show}
			>
				<Icon name="more" size={18} />
			</button>
			<div
				id={id}
				ref={popup}
				popover="auto"
				role="dialog"
				aria-label={`Acciones de ${subject}`}
				className="profile-grade-popover"
			>
				<div hidden={history}>
					<button
						type="button"
						disabled={closed}
						onClick={() => {
							popup.current?.hidePopover();
							open(
								"grade",
								`Corregir calificación de ${studentName}`,
								[field("value", "Nueva calificación", "number"), reason],
								{
									assignment: grade.assignment,
									student: grade.student,
									value: String(grade.value),
								},
							);
						}}
					>
						Corregir calificación…
					</button>
					{closed && <span>{hint}</span>}
					<button type="button" onClick={() => setHistory(true)}>
						Ver historial
					</button>
				</div>
				<div hidden={!history}>
					<strong>Historial de {subject}</strong>
					<p>Valor original: {original}</p>
					{grade.history.length ? (
						<ul>
							{grade.history.map((h) => (
								<li key={h.id}>
									{h.value} · {h.reason} · {h.author}
								</li>
							))}
						</ul>
					) : (
						<p>Sin correcciones</p>
					)}
					<button
						ref={closeHistory}
						type="button"
						onClick={() => popup.current?.hidePopover()}
					>
						Cerrar
					</button>
				</div>
			</div>
		</>
	);
}

export function StudentGrades({
	s,
	open,
	studentName,
	initialPeriod,
}: Pick<ViewProps, "s" | "open"> & {
	studentName: string;
	initialPeriod?: string;
}) {
	const cycles = [
		...new Set(
			s.grades
				.map(
					(g) =>
						s.groups.find(
							(group) =>
								group.id ===
								s.assignments.find((a) => a.id === g.assignment)?.group,
						)?.cycle,
				)
				.filter((v): v is string => !!v),
		),
	].sort((a, b) => (cycleStartYear(s, b) ?? 0) - (cycleStartYear(s, a) ?? 0));
	const [cycle, setCycle] = useState(cycles[0] ?? "");
	const recent = cycle === cycles[0];
	const cycleGrades = s.grades.filter(
		(g) =>
			s.groups.find(
				(group) =>
					group.id === s.assignments.find((a) => a.id === g.assignment)?.group,
			)?.cycle === cycle,
	);
	const groupIds = new Set([
		...cycleGrades.map(
			(g) => s.assignments.find((a) => a.id === g.assignment)?.group,
		),
		...s.students.flatMap((student) =>
			student.enrollments.filter((e) => e.cycle === cycle).map((e) => e.group),
		),
	]);
	const assignments = s.assignments.filter((a) => groupIds.has(a.group));
	const names = [
		...new Set([
			...DEMO_PERIODS.map((p) => p.name),
			...assignments.map((a) => demoPeriod(a.period, recent).name),
		]),
	];
	const periods = names.map((name) => demoPeriod(name, recent));
	const defaultPeriod =
		periods.find((p) => periodState(p, GRADES_TODAY) === "open")?.name ??
		[...periods]
			.reverse()
			.find((p) =>
				cycleGrades.some(
					(g) =>
						demoPeriod(
							s.assignments.find((a) => a.id === g.assignment)?.period ?? "",
							recent,
						).name === p.name,
				),
			)?.name ??
		periods[0]?.name;
	const [selected, setSelected] = useState<string | undefined>(
		initialPeriod ?? defaultPeriod,
	);
	const selectedPeriod =
		periods.find((p) => p.name === selected) ??
		periods.find((p) => p.name === defaultPeriod);
	const rows = [...new Set(assignments.map((a) => a.subject))].map(
		(subject) => {
			const subjectAssignments = assignments.filter(
				(a) => a.subject === subject,
			);
			const values: Record<string, number | undefined> = {};
			for (const a of subjectAssignments) {
				const grade = cycleGrades.find((g) => g.assignment === a.id);
				if (grade) values[demoPeriod(a.period, recent).name] = grade.value;
			}
			return { subject, assignments: subjectAssignments, values };
		},
	);
	const isFinal = selected === "Final";
	const state = selectedPeriod
		? periodState(selectedPeriod, GRADES_TODAY)
		: "closed";
	return (
		<section className="profile-grades">
			{!cycles.length ? (
				<p>Sin calificaciones capturadas para este alumno.</p>
			) : (
				<>
					<div className="profile-grades-toolbar">
						<fieldset className="profile-grades-periods" aria-label="Periodo">
							{[...names, "Final"].map((name) => (
								<button
									key={name}
									type="button"
									aria-pressed={
										isFinal ? name === "Final" : name === selectedPeriod?.name
									}
									onClick={() => setSelected(name)}
								>
									{name}
								</button>
							))}
						</fieldset>
						<p className="profile-grades-state">
							{isFinal ? (
								"Promedio de los periodos calificados"
							) : selectedPeriod && state === "open" ? (
								<ProfileBadge tone="ok">{`Abierto hasta el ${dateLabel(selectedPeriod.end)}`}</ProfileBadge>
							) : selectedPeriod && state === "closed" ? (
								`Cerrado el ${dateLabel(selectedPeriod.end)}`
							) : (
								selectedPeriod && `Inicia el ${dateLabel(selectedPeriod.start)}`
							)}
						</p>
						<div className="profile-grades-meta">
							{cycles.length > 1 && (
								<select
									aria-label="Ciclo"
									value={cycle}
									onChange={(e) => {
										setCycle(e.target.value);
										setSelected(undefined);
									}}
								>
									{cycles.map((id) => (
										<option key={id} value={id}>
											{s.cycles.find((c) => c.id === id)?.name ?? id}
										</option>
									))}
								</select>
							)}
							<ProfileBadge tone="current">Datos de muestra</ProfileBadge>
						</div>
					</div>
					<DataTable
						caption={`Calificaciones · ${isFinal ? "Final" : selectedPeriod?.name}`}
						variant="card"
						scrollClassName="profile-grades-scroll"
					>
						<thead>
							<tr>
								<th scope="col">Materia</th>
								{isFinal ? (
									periods.map((p) => (
										<th key={p.name} scope="col">
											{p.name}
										</th>
									))
								) : (
									<th scope="col">Docente</th>
								)}
								<th scope="col">{isFinal ? "Promedio" : "Calificación"}</th>
								<th scope="col">Situación</th>
								{!isFinal && <th scope="col">Acciones</th>}
							</tr>
						</thead>
						<tbody>
							{periodRows(rows, selectedPeriod?.name ?? "").map((row) => {
								const assignment = row.assignments.find(
									(a) =>
										demoPeriod(a.period, recent).name === selectedPeriod?.name,
								);
								const grade =
									state === "upcoming"
										? undefined
										: cycleGrades.find((g) => g.assignment === assignment?.id);
								const value = isFinal
									? average(periods.map((p) => row.values[p.name]))
									: (grade?.value ?? null);
								const status = situation(value, s.evaluationRules.passing);
								return (
									<tr key={row.subject}>
										<th scope="row">{row.subject}</th>
										{isFinal ? (
											periods.map((p) => (
												<td key={p.name}>{row.values[p.name] ?? "—"}</td>
											))
										) : (
											<td className="profile-grade-muted">
												{assignment?.teacher ??
													row.assignments[0]?.teacher ??
													"—"}
											</td>
										)}
										<td className="profile-grade-value">
											{value == null
												? "—"
												: isFinal
													? numberLabel(value)
													: value}
										</td>
										<td>
											{status === "Reprueba" ? (
												<ProfileBadge tone="off">Reprueba</ProfileBadge>
											) : status ? (
												"Aprueba"
											) : (
												<span className="profile-grade-muted">
													Sin calificación del docente
												</span>
											)}
										</td>
										{!isFinal && (
											<td>
												{grade && (
													<GradeActions
														grade={grade}
														subject={row.subject}
														closed={state !== "open"}
														hint={
															state === "closed" && selectedPeriod
																? `Periodo cerrado el ${dateLabel(selectedPeriod.end)}`
																: "Aún no inicia"
														}
														studentName={studentName}
														open={open}
													/>
												)}
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</DataTable>
				</>
			)}
		</section>
	);
}
