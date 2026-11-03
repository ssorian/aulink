import { Icon, type IconName } from "../../../components/ui/icon";
import { type HomeDestination, summarizeHome } from "./home-summary";
import type { State } from "../shared/workflows";

export type { HomeDestination } from "./home-summary";
export type HomeViewProps = {
	s: State;
	onNavigate: (destination: HomeDestination) => void;
};

export function HomeView({ s, onNavigate }: HomeViewProps) {
	const summary = summarizeHome(s);
	const tasks: {
		label: string;
		count: number;
		destination: HomeDestination;
		action: string;
		icon: IconName;
	}[] = [
		{
			label: "Comunicados en borrador",
			count: summary.drafts,
			destination: "communications",
			action: "Revisar comunicados",
			icon: "message",
		},
		{
			label: "Grupos sin materias asignadas",
			count: summary.groupsWithoutSubjects,
			destination: "groups",
			action: "Asignar materias",
			icon: "book",
		},
		{
			label: "Grupos sin horario registrado",
			count: summary.groupsWithoutSchedule,
			destination: "groups",
			action: "Revisar horarios",
			icon: "calendar",
		},
	];
	const pending = tasks.filter((task) => task.count > 0);
	return (
		<div className="home-view">
			<section className="home-cards" aria-label="Resumen escolar">
				<article className="home-card">
					<h2>
						<Icon name="user" />
						Alumnos registrados
					</h2>
					<p className="home-count">{summary.students}</p>
					<button type="button" onClick={() => onNavigate("students")}>
						Ver alumnos
					</button>
				</article>
				<article className="home-card">
					<h2>
						<Icon name="users" />
						Grupos
					</h2>
					<p className="home-count">{summary.groups}</p>
					<button type="button" onClick={() => onNavigate("groups")}>
						Ver grupos
					</button>
				</article>
				<article className="home-card">
					<h2>
						<Icon name="message" />
						Borradores de comunicados
					</h2>
					<p className="home-count">{summary.drafts}</p>
					<button type="button" onClick={() => onNavigate("communications")}>
						Ver comunicados
					</button>
				</article>
				<article className="home-card">
					<h2>
						<Icon name="monitor" />
						Terminales configuradas
					</h2>
					<p className="home-count">
						{summary.activeDevices + summary.inactiveDevices}
					</p>
					<p>
						{summary.activeDevices} activas · {summary.inactiveDevices}{" "}
						inactivas en configuración.
					</p>
					<button type="button" onClick={() => onNavigate("setup")}>
						Ver terminales
					</button>
				</article>
			</section>
			<section className="home-tasks" aria-labelledby="home-tasks-title">
				<h2 id="home-tasks-title">Por revisar</h2>
				{pending.length > 0 ? (
					<ul className="home-task-list">
						{pending.map((task) => (
							<li className="home-task" key={task.label}>
								<p>
									<Icon name={task.icon} size={18} />
									<strong>{task.count}</strong> · {task.label}
								</p>
								<button
									type="button"
									onClick={() => onNavigate(task.destination)}
								>
									{task.action}
									<Icon name="arrow" size={16} />
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="home-empty">Sin pendientes por revisar.</p>
				)}
				{summary.students === 0 && summary.groups === 0 && (
					<div className="home-empty">
						<p>Crea tu primer grupo para comenzar.</p>
						<button type="button" onClick={() => onNavigate("groups")}>
							Crear primer grupo
						</button>
					</div>
				)}
			</section>
		</div>
	);
}
