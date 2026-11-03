import { useEffect, useRef, useState } from "react";
import { Icon } from "../../../components/ui/icon";
import { CommunicationsView } from "../communications/communications-view";
import { EvaluationDashboard } from "../evaluation/evaluation-dashboard";
import { filterDirectory } from "../students/experience";
import { type Field, type Flow, FlowDialog } from "../setup/flow-dialog";
import { GroupFollowupView } from "../groups/group-followup-view";
import { GroupDirectory, GroupWorkspace } from "../groups/group-workspace";
import { HomeView } from "./home-view";
import { buildMockData, mergeMockData } from "../shared/mock-data";
import {
	type EvaluationPage,
	isEvaluationPage,
	type SchoolPage,
	sectionFor,
} from "./navigation";
import { migrateLegacySeed } from "../shared/seed-migration";
import { SetupView } from "../setup/setup-view";
import { SidebarNav } from "./sidebar-nav";
import { StaffView } from "../staff/staff-view";
import { StudentProfile } from "../students/student-profile";
import { StudentsView } from "../students/students-view";
import { field, options } from "../shared/view-helpers";
import { apply, previewCSV, restore, type State } from "../shared/workflows";

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
	return (
		<div className="app">
			<a className="skip-link" href="#main">
				Saltar al contenido
			</a>
			<aside className="sidebar">
				<a className="brand" href="#main">
					<span>á</span> aulink<span className="brand-dot">●</span>
				</a>
				<div className="school-mark">
					<span className="avatar">IA</span>
					<div>
						<strong>{schoolLabel}</strong>
					</div>
				</div>
				<SidebarNav
					page={page}
					onNavigate={(destination) => {
						setPage(destination);
						setMessage("");
					}}
				/>
			</aside>
			<div className="main-shell">
				<header className="topbar">
					<span>{schoolBreadcrumb(section.label, page)}</span>
					<section className="context-bar" aria-label="Contexto de consulta">
						<strong className="context-school">{schoolLabel}</strong>
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
				<main id="main" tabIndex={-1}>
					<div
						className={
							(page === "Grupos" && groupId) || (page === "Alumnos" && profile)
								? "detail-nav"
								: undefined
						}
					>
						{page === "Grupos" && groupId && (
							<button
								type="button"
								className="group-back"
								onClick={() => setGroupId("")}
							>
								<Icon name="back" size={18} />
								Volver a Grupos
							</button>
						)}
						{page === "Alumnos" && profile && (
							<button
								type="button"
								className="group-back"
								onClick={returnFromProfile}
							>
								<Icon name="back" size={18} />
								{profileOrigin
									? "Volver al grupo de origen"
									: "Volver a Alumnos"}
							</button>
						)}
						<div className="page-heading">
							<div>
								<h1>{section.pages.length > 1 ? page : section.label}</h1>
							</div>
						</div>
					</div>
					{storageError && (
						<div className="notice error" role="alert">
							{storage}
						</div>
					)}
					{message && <output className="feedback">{message}</output>}
					{!ready ? (
						<p>Cargando…</p>
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
										<div className="notice">
											<strong>
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
											<div className="actions">
												<button
													type="button"
													onClick={() => {
														setGroupId(noticeGroup);
														setPage("Grupos");
													}}
												>
													← Volver al grupo
												</button>
												<button
													type="button"
													onClick={() => setNoticeGroup("")}
												>
													Quitar contexto de grupo
												</button>
											</div>
										</div>
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
