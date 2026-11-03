import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Icon, type IconName } from "../../../components/ui/icon";
import { type Tone, toneSurface } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import type { State } from "../shared/workflows";
import { type HomeDestination, summarizeHome } from "./home-summary";

export type { HomeDestination } from "./home-summary";
export type HomeViewProps = {
	s: State;
	onNavigate: (destination: HomeDestination) => void;
};

/** Small tinted square that carries an icon; the tone comes from the shared maps. */
function IconChip({
	name,
	tone,
	className,
}: {
	name: IconName;
	tone: Tone;
	className?: string;
}) {
	return (
		<span
			data-tone={tone}
			className={cn(
				"grid size-8 shrink-0 place-items-center rounded-lg",
				toneSurface[tone],
				className,
			)}
		>
			<Icon name={name} size={18} />
		</span>
	);
}

const taskTones: Tone[] = ["sky", "lemon", "lilac", "peach"];

export function HomeView({ s, onNavigate }: HomeViewProps) {
	const summary = summarizeHome(s);
	const cards: {
		label: string;
		value: number;
		caption?: string;
		destination: HomeDestination;
		action: string;
		icon: IconName;
		tone: Tone;
	}[] = [
		{
			label: "Alumnos registrados",
			value: summary.students,
			destination: "students",
			action: "Ver alumnos",
			icon: "user",
			tone: "teal",
		},
		{
			label: "Grupos",
			value: summary.groups,
			destination: "groups",
			action: "Ver grupos",
			icon: "users",
			tone: "lilac",
		},
		{
			label: "Borradores de comunicados",
			value: summary.drafts,
			destination: "communications",
			action: "Ver comunicados",
			icon: "message",
			tone: "mustard",
		},
		{
			label: "Terminales configuradas",
			value: summary.activeDevices + summary.inactiveDevices,
			caption: `${summary.activeDevices} activas · ${summary.inactiveDevices} inactivas en configuración.`,
			destination: "setup",
			action: "Ver terminales",
			icon: "monitor",
			tone: "peach",
		},
	];
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
		<div data-slot="home" className="flex flex-col gap-6">
			<section
				data-slot="home-summary"
				aria-label="Resumen escolar"
				className="grid grid-cols-2 gap-3 xl:grid-cols-4"
			>
				{cards.map((card) => (
					<Card
						as="article"
						key={card.label}
						tone={card.tone}
						padding="compact"
						className={cn(
							"flex flex-col gap-1 border-transparent px-3.5 py-3",
							toneSurface[card.tone],
						)}
					>
						<h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold">
							<IconChip
								name={card.icon}
								tone={card.tone}
								className="bg-card/70"
							/>
							{card.label}
						</h2>
						<p className="m-0 mt-1 text-3xl font-semibold tracking-tight text-inherit tabular-nums">
							{card.value}
						</p>
						{card.caption && (
							<p className="m-0 text-xs font-semibold text-inherit">
								{card.caption}
							</p>
						)}
						<Button
							variant="link"
							className="mt-auto min-h-11 self-start pt-1 font-semibold"
							onClick={() => onNavigate(card.destination)}
						>
							{card.action}
						</Button>
					</Card>
				))}
			</section>
			<Card as="section" aria-labelledby="home-tasks-title">
				<h2
					id="home-tasks-title"
					className="m-0 text-lg font-semibold tracking-tight"
				>
					Por revisar
				</h2>
				{pending.length > 0 ? (
					<ul className="m-0 mt-3 list-none divide-y divide-border border-t border-border p-0">
						{pending.map((task, index) => (
							<li
								key={task.label}
								className="flex items-center justify-between gap-3 py-3 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-2"
							>
								<p className="m-0 flex flex-wrap items-center gap-2 text-sm text-foreground">
									<IconChip
										name={task.icon}
										tone={taskTones[index % taskTones.length]}
									/>
									<strong className="font-semibold">{task.count}</strong> ·{" "}
									{task.label}
								</p>
								<Button
									className="shrink-0 max-[760px]:self-start"
									onClick={() => onNavigate(task.destination)}
								>
									{task.action}
									<Icon name="arrow" size={16} />
								</Button>
							</li>
						))}
					</ul>
				) : (
					<p className="m-0 mt-3 text-sm text-muted-foreground">
						Sin pendientes por revisar.
					</p>
				)}
				{summary.students === 0 && summary.groups === 0 && (
					<EmptyState
						title="Sin grupos"
						icon="users"
						text="Crea tu primer grupo para comenzar."
						className="mb-0"
						action={
							<Button variant="primary" onClick={() => onNavigate("groups")}>
								Crear primer grupo
							</Button>
						}
					/>
				)}
			</Card>
		</div>
	);
}
