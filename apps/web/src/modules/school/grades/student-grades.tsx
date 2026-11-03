import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import { DataTable } from "../../../components/ui/data-table";
import { EmptyState } from "../../../components/ui/empty-state";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Icon } from "../../../components/ui/icon";
import { cn } from "../../../lib/utils";
import { field, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import { cycleStartYear } from "../students/experience";
import { average, periodRows, periodState, situation } from "./grades-record";
import { DEMO_PERIODS, demoPeriod, GRADES_TODAY } from "./grades-record-demo";

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
	const item = "w-full justify-start font-medium text-foreground";
	return (
		<>
			<button
				type="button"
				data-slot="button"
				data-variant="icon"
				ref={trigger}
				aria-label={`Acciones de ${subject}`}
				aria-haspopup="dialog"
				aria-controls={id}
				className={cn(
					buttonVariants({ variant: "icon" }),
					"text-muted-foreground",
				)}
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
				className="fixed inset-auto m-0 w-max min-w-56 max-w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-card p-1.5 text-foreground shadow-lg"
			>
				<div hidden={history}>
					<Button
						variant="ghost"
						className={item}
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
					</Button>
					{closed && (
						<span className="block px-3 pb-1.5 text-sm text-muted-foreground">
							{hint}
						</span>
					)}
					<Button
						variant="ghost"
						className={item}
						onClick={() => setHistory(true)}
					>
						Ver historial
					</Button>
				</div>
				<div hidden={!history}>
					<strong className="block px-3 pt-2">Historial de {subject}</strong>
					<p className="mx-0 my-1.5 px-3 text-sm">Valor original: {original}</p>
					{grade.history.length ? (
						<ul className="my-1.5 pr-3 pl-7 text-sm">
							{grade.history.map((h) => (
								<li key={h.id}>
									{h.value} · {h.reason} · {h.author}
								</li>
							))}
						</ul>
					) : (
						<p className="mx-0 my-1.5 px-3 text-sm">Sin correcciones</p>
					)}
					<button
						type="button"
						data-slot="button"
						data-variant="ghost"
						ref={closeHistory}
						className={cn(buttonVariants({ variant: "ghost" }), item)}
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
		<section data-slot="student-grades" className="grid min-w-0 gap-4">
			{!cycles.length ? (
				<EmptyState
					title="Sin calificaciones"
					text="Sin calificaciones capturadas para este alumno."
				/>
			) : (
				<>
					<FilterBar
						label="Filtros de calificaciones"
						className="m-0 items-center gap-3"
					>
						<fieldset
							aria-label="Periodo"
							className="m-0 flex min-w-0 max-w-full gap-2 overflow-x-auto border-0 p-0"
						>
							{[...names, "Final"].map((name) => (
								<Button
									key={name}
									size="sm"
									variant={
										(isFinal ? name === "Final" : name === selectedPeriod?.name)
											? "primary"
											: "default"
									}
									aria-pressed={
										isFinal ? name === "Final" : name === selectedPeriod?.name
									}
									className="shrink-0 whitespace-nowrap"
									onClick={() => setSelected(name)}
								>
									{name}
								</Button>
							))}
						</fieldset>
						{cycles.length > 1 && (
							<Select
								id="student-grades-cycle"
								label="Ciclo"
								value={cycle}
								items={cycles.map((id) => ({
									value: id,
									label: s.cycles.find((c) => c.id === id)?.name ?? id,
								}))}
								onChange={(value) => {
									setCycle(value);
									setSelected(undefined);
								}}
								className="flex-none"
							/>
						)}
					</FilterBar>
					<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
						{isFinal ? (
							<p className="m-0">Promedio de los periodos calificados</p>
						) : selectedPeriod && state === "open" ? (
							<Badge tone="success">{`Abierto hasta el ${dateLabel(selectedPeriod.end)}`}</Badge>
						) : selectedPeriod && state === "closed" ? (
							<p className="m-0">{`Cerrado el ${dateLabel(selectedPeriod.end)}`}</p>
						) : (
							selectedPeriod && (
								<p className="m-0">{`Inicia el ${dateLabel(selectedPeriod.start)}`}</p>
							)
						)}
						<Badge>Datos de muestra</Badge>
					</div>
					<div className="min-w-0 [&_caption]:sr-only [&_table]:table-auto [&_td]:align-middle [&_td]:text-sm [&_th]:align-middle [&_thead_th]:whitespace-nowrap">
						<DataTable
							caption={`Calificaciones · ${isFinal ? "Final" : selectedPeriod?.name}`}
							variant="card"
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
											demoPeriod(a.period, recent).name ===
											selectedPeriod?.name,
									);
									const grade =
										state === "upcoming"
											? undefined
											: cycleGrades.find(
													(g) => g.assignment === assignment?.id,
												);
									const value = isFinal
										? average(periods.map((p) => row.values[p.name]))
										: (grade?.value ?? null);
									const status = situation(value, s.evaluationRules.passing);
									return (
										<tr key={row.subject}>
											<th scope="row" className="text-sm">
												{row.subject}
											</th>
											{isFinal ? (
												periods.map((p) => (
													<td key={p.name}>{row.values[p.name] ?? "—"}</td>
												))
											) : (
												<td className="text-muted-foreground">
													{assignment?.teacher ??
														row.assignments[0]?.teacher ??
														"—"}
												</td>
											)}
											<td className="font-semibold tabular-nums">
												{value == null
													? "—"
													: isFinal
														? numberLabel(value)
														: value}
											</td>
											<td>
												{status === "Reprueba" ? (
													<Badge tone="danger">Reprueba</Badge>
												) : status ? (
													"Aprueba"
												) : (
													<span className="text-muted-foreground">
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
					</div>
				</>
			)}
		</section>
	);
}
