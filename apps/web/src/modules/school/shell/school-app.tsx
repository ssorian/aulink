import { useEffect, useRef, useState } from "react";
import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Icon } from "../../../components/ui/icon";
import { CommunicationsView } from "../communications/communications-view";
import { EvaluationDashboard } from "../evaluation/evaluation-dashboard";
import { GroupFollowupView } from "../groups/group-followup-view";
import { GroupDirectory, GroupWorkspace } from "../groups/group-workspace";
import { type Field, type Flow, FlowDialog } from "../setup/flow-dialog";
import { SetupView } from "../setup/setup-view";
import { buildMockData, mergeMockData } from "../shared/mock-data";
import { migrateLegacySeed } from "../shared/seed-migration";
import { field, options } from "../shared/view-helpers";
import { apply, previewCSV, restore, type State } from "../shared/workflows";
import { StaffView } from "../staff/staff-view";
import { filterDirectory } from "../students/experience";
import { StudentProfile } from "../students/student-profile";
import { StudentsView } from "../students/students-view";
import { HomeView } from "./home-view";
import {
	type EvaluationPage,
	isEvaluationPage,
	type SchoolPage,
	sectionFor,
} from "./navigation";
import { SidebarNav } from "./sidebar-nav";

export function schoolBreadcrumb(section: string, page: string) {
	return [
		"Administración",
		...(section === "Administración" ? [] : [section]),
		...(page === section ? [] : [page]),
	].join(" / ");
}

export function SchoolApp() {
	const [s, setState] = useState<State>(buildMockData);
	const [ready, setReady] = useState(false);
	const [storage, setStorage] = useState("Cargando almacenamiento local…");
	const [page, setPage] = useState<SchoolPage>("Inicio");
	const section = sectionFor(page);
	const [followupGroup, setFollowupGroup] = useState("");
	const [evaluationCycle, setEvaluationCycle] = useState("");
	const effectiveEvaluationCycle = evaluationCycle || s.cycles[0]?.id || "";
	const [flow, setFlow] = useState<Flow | null>(null);
	const [message, setMessage] = useState("");
	const [query, setQuery] = useState("");
	const [groupFilter, setGroupFilter] = useState("");
	const [profile, setProfile] = useState("");
	const [groupId, setGroupId] = useState("");
	const [profileOrigin, setProfileOrigin] = useState("");
	const directoryPosition = useRef({ x: 0, y: 0, top: 0, left: 0 });
	const groupPosition = useRef({ x: 0, y: 0 });
	const [evaluationVisited, setEvaluationVisited] = useState(false);
	const [evaluationPage, setEvaluationPage] =
		useState<EvaluationPage>("Avance del periodo");
	const evaluationContainer = useRef<HTMLDivElement>(null);
	const evaluationPosition = useRef<{
		x: number;
		y: number;
		trigger: HTMLElement | null;
	} | null>(null);
	useEffect(() => {
		if (!isEvaluationPage(page)) return;
		setEvaluationVisited(true);
		setEvaluationPage(page);
		const position = evaluationPosition.current;
		if (!position) return;
		const frame = requestAnimationFrame(() => {
			window.scrollTo(position.x, position.y);
			if (
				position.trigger?.isConnected &&
				evaluationContainer.current?.contains(position.trigger)
			) {
				position.trigger.focus({ preventScroll: true });
			}
			evaluationPosition.current = null;
		});
		return () => cancelAnimationFrame(frame);
	}, [page]);
	const [groupTabs, setGroupTabs] = useState<Record<string, string>>({});
	const [noticeGroup, setNoticeGroup] = useState("");
	const [cycleFilter, setCycleFilter] = useState("");
	const [csv, setCSV] = useState("Nombre,Matrícula,Grupo");
	const [csvPreview, setCSVPreview] = useState(false);
	useEffect(() => {
		try {
			const raw = localStorage.getItem("aulink-school-demo-v1");
			const saved = raw ? restore(raw) : null;
			const migrated = saved ? migrateLegacySeed(saved) : null;
			const loaded = migrated?.state || buildMockData();
			setState(loaded);
			setCSV(
				`Nombre,Matrícula,Grupo\nValeria Pérez Andrade,AUR-26150,${loaded.groups[0]?.id || ""}`,
			);
			setStorage(
				raw && !saved
					? "Datos locales inválidos: se recuperó el ejemplo inicial."
					: "Datos guardados solo en este navegador.",
			);
			if (migrated?.changed) {
				try {
					localStorage.setItem("aulink-school-demo-v1", JSON.stringify(loaded));
				} catch {
					setStorage(
						"No se pudo guardar: cambios solo en memoria; se perderán al recargar.",
					);
				}
			}
		} catch {
			setStorage(
				"Almacenamiento no disponible: los cambios solo durarán esta sesión.",
			);
		}
		setReady(true);
	}, []);
	function commit(next: State) {
		setState(next);
		try {
			localStorage.setItem("aulink-school-demo-v1", JSON.stringify(next));
			setStorage("Cambios guardados solo en este navegador.");
		} catch {
			setStorage(
				"No se pudo guardar: cambios solo en memoria; se perderán al recargar.",
			);
		}
		setMessage("Cambio aplicado.");
	}
	function open(
		kind: string,
		title: string,
		fields: Field[],
		values: Record<string, string> = {},
		preview?: string[],
		description = "Completa la información, revisa el resumen y confirma. Cancelar conserva la captura sin aplicar cambios.",
	) {
		setFlow({ kind, title, fields, values, preview, description });
	}

	const groups = options(
		"group",
		"Grupo / ciclo",
		s.groups.map((g) => ({
			id: g.id,
			name: `${g.name} · ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
		})),
	);
	const groupName = (id: string | undefined) =>
		s.groups.find((x) => x.id === id)?.name || "Sin grupo";
	const selected = s.students.find((x) => x.id === profile);
	const rows = previewCSV(s, csv);
	const visible = filterDirectory(s, query, groupFilter, cycleFilter);
	const contextGroup = s.groups.find(
		(g) =>
			g.id ===
			(page === "Grupos"
				? groupId
				: page === "Comunicados"
					? noticeGroup
					: page === "Conducta"
						? followupGroup
						: page === "Alumnos" && !profile
							? groupFilter
							: ""),
	);
	const contextCycle =
		contextGroup?.cycle ||
		(isEvaluationPage(page)
			? effectiveEvaluationCycle
			: page === "Alumnos" && !profile
				? cycleFilter
				: "");
	function openDirectoryProfile(id: string) {
		const table = document
			.getElementById(`student-${id}`)
			?.closest<HTMLElement>(".table-scroll");
		directoryPosition.current = {
			x: window.scrollX,
			y: window.scrollY,
			top: table?.scrollTop || 0,
			left: table?.scrollLeft || 0,
		};
		setProfileOrigin("");
		setProfile(id);
		window.scrollTo(0, 0);
	}
	function returnFromProfile() {
		setProfile("");
		if (profileOrigin) {
			setGroupId(profileOrigin);
			setPage("Grupos");
			requestAnimationFrame(() => {
				window.scrollTo(groupPosition.current.x, groupPosition.current.y);
				document
					.getElementById(`group-${profileOrigin}-student-${profile}`)
					?.focus({ preventScroll: true });
			});
		} else {
			requestAnimationFrame(() => {
				const trigger = document.getElementById(`student-${profile}`);
				const table = trigger?.closest<HTMLElement>(".table-scroll");
				const position = directoryPosition.current;
				if (table) {
					table.scrollTop = position.top;
					table.scrollLeft = position.left;
				}
				window.scrollTo(position.x, position.y);
				trigger?.focus({ preventScroll: true });
			});
		}
	}
	function loadExamples() {
		const result = mergeMockData(s);
		open(
			"mock-data",
			"Agregar datos de ejemplo",
			[],
			{},
			[
				"36 alumnos ficticios, 6 grupos, historial, materias, horarios, avisos y equipos de ejemplo. Los registros existentes no se editan ni se borran.",
				`Se agregarán ${result.added} registros nuevos. ${result.conflicts.length} conflictos o dependencias omitidas; se conservan los datos existentes.`,
				...result.conflicts.slice(0, 12),
				...(result.conflicts.length > 12
					? [
							`Otras ${result.conflicts.length - 12} omisiones conservadoras; no se reasignan registros.`,
						]
					: []),
				"Volver a cargar no duplica registros. Sin contactos reales, QR, correo ni push.",
			],
			"Revisa la incorporación de datos sintéticos a este navegador. Cancelar no modifica nada.",
		);
	}
	const storageError =
		/^(Datos locales inválidos|Almacenamiento no disponible|No se pudo guardar)/.test(
			storage,
		);
	const schoolLabel = s.school.name.replace(/\s*·\s*Demo\s*$/, "");
	const addStudent = () =>
		open("student", "Inscribir alumno", [
			field("name", "Nombre del alumno"),
			field("matricula", "Matrícula única"),
			groups,
		]);
	const detail =
		(page === "Grupos" && groupId) || (page === "Alumnos" && profile);
	const backClass =
		"min-h-11 gap-2 text-sm text-primary hover:text-primary-hover hover:underline underline-offset-[3px]";
	return (
		<div data-slot="app" className="min-w-0 [overflow-wrap:anywhere]">
			<a
				data-slot="skip-link"
				className="fixed top-3 left-4 z-100 -translate-y-[160%] rounded-lg bg-primary-hover px-[18px] py-3 text-primary-foreground focus:translate-y-0"
				href="#main"
			>
				Saltar al contenido
			</a>
			<aside
				data-slot="sidebar"
				className="fixed inset-y-0 left-0 flex w-[260px] flex-col overflow-y-auto bg-sidebar pt-7 pb-8 text-sidebar-foreground max-[1150px]:w-[220px] max-[760px]:static max-[760px]:w-auto max-[760px]:overflow-visible max-[760px]:pt-[18px] max-[760px]:pb-2"
			>
				<a
					data-slot="brand"
					className="mx-5 mb-7 flex items-center gap-[9px] text-[32px] font-extrabold tracking-[-.035em] text-sidebar-foreground max-[1150px]:mx-3 max-[760px]:mx-4 max-[760px]:mb-3.5 max-[760px]:text-[27px]"
					href="#main"
				>
					<span className="grid size-[38px] place-items-center rounded-xl bg-teal text-[30px] text-white max-[760px]:size-8 max-[760px]:text-[25px]">
						á
					</span>{" "}
					aulink
					<span className="-ml-[5px] text-[10px] text-lemon">●</span>
				</a>
				<div
					data-slot="school-mark"
					className="mx-5 mb-[29px] flex items-center gap-2.5 rounded-xl border border-sidebar-active px-2.5 py-3.5 max-[1150px]:mx-3 max-[760px]:hidden"
				>
					<Avatar
						name={schoolLabel}
						className="size-[37px] rounded-xl bg-sidebar-active text-sidebar-foreground"
					/>
					<strong className="block text-xs font-semibold">{schoolLabel}</strong>
				</div>
				<SidebarNav
					page={page}
					onNavigate={(destination) => {
						setPage(destination);
						setMessage("");
					}}
				/>
			</aside>
			<div
				data-slot="main-shell"
				className="ml-[260px] min-w-0 max-[1150px]:ml-[220px] max-[760px]:ml-0"
			>
				<header
					data-slot="topbar"
					className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b-4 border-solid bg-card px-10 py-3 text-xs text-muted-foreground [border-image:var(--palette-stripe)_1] max-[1150px]:px-6 max-[760px]:min-h-[55px] max-[760px]:gap-x-3 max-[760px]:gap-y-1.5 max-[760px]:px-[17px] max-[760px]:py-2.5"
				>
					<span>{schoolBreadcrumb(section.label, page)}</span>
					<section
						aria-label="Contexto de consulta"
						className="flex flex-wrap gap-x-[18px] gap-y-2 text-[13px] text-foreground max-[760px]:gap-x-3 max-[760px]:gap-y-1.5 max-[760px]:text-xs [&>span]:text-muted-foreground [&>span+span]:border-l [&>span+span]:border-border [&>span+span]:pl-3 max-[760px]:[&>span+span]:border-0 max-[760px]:[&>span+span]:pl-0"
					>
						<strong className="hidden font-semibold max-[760px]:block max-[760px]:basis-full">
							{schoolLabel}
						</strong>
						<span>
							{s.cycles.find((c) => c.id === contextCycle)?.name ||
								(page === "Alumnos" && profile
									? "Historial completo"
									: "Todos los ciclos")}
						</span>
						{contextGroup && <span>Grupo {contextGroup.name}</span>}
						{page === "Alumnos" && selected && (
							<span>Expediente: {selected.name}</span>
						)}
					</section>
				</header>
				<main
					id="main"
					tabIndex={-1}
					className="mx-auto min-w-0 max-w-[1460px] scroll-mt-28 px-10 pt-6 pb-8 max-[1150px]:px-6 max-[760px]:scroll-mt-3 max-[760px]:px-[17px] max-[760px]:pt-5"
				>
					<div
						data-slot={detail ? "detail-nav" : undefined}
						className={
							detail ? "mb-2 flex flex-wrap items-center gap-x-4" : undefined
						}
					>
						{page === "Grupos" && groupId && (
							<Button
								variant="link"
								className={backClass}
								onClick={() => setGroupId("")}
							>
								<Icon name="back" size={18} />
								Volver a Grupos
							</Button>
						)}
						{page === "Alumnos" && profile && (
							<Button
								variant="link"
								className={backClass}
								onClick={returnFromProfile}
							>
								<Icon name="back" size={18} />
								{profileOrigin
									? "Volver al grupo de origen"
									: "Volver a Alumnos"}
							</Button>
						)}
						<div
							data-slot="page-heading"
							className={detail ? "sr-only" : "mb-4"}
						>
							<h1 className="text-[28px] leading-tight font-extrabold tracking-[-.02em] max-[760px]:text-[26px]">
								{section.pages.length > 1 ? page : section.label}
							</h1>
						</div>
					</div>
					{storageError && (
						<div
							data-slot="notice"
							data-tone="danger"
							className="my-[18px] rounded-xl border border-destructive bg-destructive-bg p-2.5 text-[13px] text-destructive"
							role="alert"
						>
							{storage}
						</div>
					)}
					{message && (
						<output
							data-slot="feedback"
							className="mb-[18px] block rounded-lg border border-success bg-success-bg px-[17px] py-[13px] text-success"
						>
							{message}
						</output>
					)}
					{!ready ? (
						<p className="text-sm text-muted-foreground">Cargando…</p>
					) : (
						<>
							{page === "Inicio" && (
								<HomeView
									s={s}
									onNavigate={(destination) => {
										const pages = {
											students: "Alumnos",
											groups: "Grupos",
											communications: "Comunicados",
											setup: "Terminales",
										} satisfies Record<typeof destination, SchoolPage>;
										setPage(pages[destination]);
										if (destination === "students") {
											setProfile("");
											setProfileOrigin("");
										}
										if (destination === "groups") setGroupId("");
										if (destination === "communications") setNoticeGroup("");
										setMessage("");
										requestAnimationFrame(() =>
											document.getElementById("main")?.focus(),
										);
									}}
								/>
							)}
							{page === "Alumnos" &&
								(profile ? (
									<StudentProfile
										key={profile}
										s={s}
										open={open}
										studentId={profile}
										onGroup={(id) => {
											setGroupId(id);
											setPage("Grupos");
										}}
									/>
								) : (
									<>
										<StudentsView
											s={s}
											open={open}
											groups={groups}
											groupName={groupName}
											query={query}
											setQuery={setQuery}
											groupFilter={groupFilter}
											setGroupFilter={setGroupFilter}
											profile={profile}
											setProfile={openDirectoryProfile}
											cycleFilter={cycleFilter}
											onCycleFilterChange={(value) => {
												setCycleFilter(value);
												setGroupFilter("");
											}}
											onClearFilters={() => {
												setQuery("");
												setGroupFilter("");
												setCycleFilter("");
											}}
											selected={selected}
											csv={csv}
											setCSV={setCSV}
											csvPreview={csvPreview}
											setCSVPreview={setCSVPreview}
											rows={rows}
											visible={visible}
											addStudent={addStudent}
										/>
									</>
								))}
							{page === "Grupos" &&
								(groupId ? (
									<GroupWorkspace
										key={groupId}
										s={s}
										open={open}
										run={(kind, data) => commit(apply(s, { kind, data }))}
										groupId={groupId}
										tab={groupTabs[groupId] || "Alumnos"}
										setTab={(tab) =>
											setGroupTabs({ ...groupTabs, [groupId]: tab })
										}
										onStudent={(id) => {
											groupPosition.current = {
												x: window.scrollX,
												y: window.scrollY,
											};
											setProfileOrigin(groupId);
											setProfile(id);
											setPage("Alumnos");
										}}
										onNotice={(id) => {
											setNoticeGroup(id);
											setPage("Comunicados");
										}}
									/>
								) : (
									<GroupDirectory s={s} open={open} onSelect={setGroupId} />
								))}
							{page === "Comunicados" && (
								<>
									{noticeGroup && (
										<Card
											as="section"
											padding="compact"
											data-slot="notice"
											className="my-[18px] bg-muted text-xs text-muted-foreground"
										>
											<strong className="font-semibold text-foreground">
												Desde {s.groups.find((g) => g.id === noticeGroup)?.name}{" "}
												·{" "}
												{
													s.cycles.find(
														(c) =>
															c.id ===
															s.groups.find((g) => g.id === noticeGroup)?.cycle,
													)?.name
												}
											</strong>
											<div className="mt-3 flex flex-wrap gap-2">
												<Button
													onClick={() => {
														setGroupId(noticeGroup);
														setPage("Grupos");
													}}
												>
													← Volver al grupo
												</Button>
												<Button onClick={() => setNoticeGroup("")}>
													Quitar contexto de grupo
												</Button>
											</div>
										</Card>
									)}
									<CommunicationsView
										s={s}
										open={open}
										contextGroup={noticeGroup}
									/>
								</>
							)}
							{page === "Personal" && <StaffView s={s} open={open} />}
							{(evaluationVisited || isEvaluationPage(page)) && (
								<div ref={evaluationContainer} hidden={!isEvaluationPage(page)}>
									<EvaluationDashboard
										s={s}
										cycleId={effectiveEvaluationCycle}
										tab={isEvaluationPage(page) ? page : evaluationPage}
										onCycleChange={setEvaluationCycle}
										open={open}
										onOpenStudent={(id) => {
											setProfileOrigin("");
											setProfile(id);
											setPage("Alumnos");
											window.scrollTo(0, 0);
										}}
										onOpenGroup={(id) => {
											const active = document.activeElement;
											evaluationPosition.current = {
												x: window.scrollX,
												y: window.scrollY,
												trigger:
													active instanceof HTMLElement &&
													evaluationContainer.current?.contains(active)
														? active
														: null,
											};
											setGroupId(id);
											setGroupTabs({ ...groupTabs, [id]: "Calificaciones" });
											setPage("Grupos");
										}}
									/>
								</div>
							)}
							{page === "Conducta" && (
								<GroupFollowupView
									s={s}
									open={open}
									mode={page}
									groupId={followupGroup}
									onGroup={setFollowupGroup}
								/>
							)}
							{(page === "Configuración" ||
								page === "Ciclos y calendario" ||
								page === "Terminales") && (
								<SetupView
									tab={page === "Configuración" ? "Escuela" : page}
									s={s}
									open={open}
									storageStatus={storage}
									onLoadExamples={loadExamples}
								/>
							)}
						</>
					)}
				</main>
			</div>
			<FlowDialog
				flow={flow}
				onClose={() => setFlow(null)}
				onConfirm={(values) => {
					if (!flow) return;
					let next = s;
					const samples = flow.kind === "mock-data" ? mergeMockData(s) : null;
					if (samples) next = samples.state;
					else if (flow.kind === "import") {
						for (const r of previewCSV(s, csv).filter((r) => !r.error))
							next = apply(next, {
								kind: "student",
								data: { name: r.name, matricula: r.matricula, group: r.group },
							});
					} else next = apply(s, { kind: flow.kind, data: values });
					commit(next);
					if (samples)
						setMessage(
							`Datos de ejemplo: ${samples.added} registros agregados; ${samples.conflicts.length} omisiones por conflicto. Todo registro existente se conservó.`,
						);
					setFlow(null);
				}}
			/>
		</div>
	);
}
