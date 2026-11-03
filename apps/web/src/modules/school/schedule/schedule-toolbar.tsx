import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import { cn } from "../../../lib/utils";
import { isoWeek, weekTitle, zoneName } from "./schedule-format";

export type ScheduleView = "dates" | "structure";
const views = [
	["dates", "Por fechas"],
	["structure", "Estructura semanal"],
] as const;

/** Week header: week stepper and title, view switch and the create action. */
export function ScheduleToolbar({
	view,
	dates,
	monday,
	today,
	timezone,
	canCreate,
	onStep,
	onToday,
	onView,
	onCreate,
}: {
	view: ScheduleView;
	dates: string[];
	monday: string;
	today: string;
	timezone: string;
	canCreate: boolean;
	onStep: (days: number) => void;
	onToday: () => void;
	onView: (view: ScheduleView) => void;
	onCreate: () => void;
}) {
	const step = "size-11 min-h-11 rounded-[10px] text-foreground hover:bg-muted";
	return (
		<header
			data-slot="schedule-head"
			className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
		>
			<div className="flex min-w-0 items-center gap-3">
				{view === "dates" && (
					<div className="flex shrink-0">
						<Button
							variant="icon"
							className={cn(step, "[&_svg]:rotate-180")}
							aria-label="Semana anterior"
							onClick={() => onStep(-7)}
						>
							<Icon name="chevron" />
						</Button>
						<Button
							variant="icon"
							className={step}
							aria-label="Semana siguiente"
							onClick={() => onStep(7)}
						>
							<Icon name="chevron" />
						</Button>
					</div>
				)}
				<div>
					<h2
						id="schedule-calendar-heading"
						aria-live="polite"
						className="m-0 text-[26px] leading-[1.15] font-[650] tracking-[-0.02em] whitespace-nowrap max-[760px]:text-xl"
					>
						{view === "dates"
							? weekTitle(dates[0], dates[6])
							: "Estructura semanal"}
					</h2>
					<p className="mt-0.5 mb-0 text-xs text-muted-foreground">
						{view === "dates"
							? `Semana ${isoWeek(monday)} · ${zoneName(timezone)}`
							: "Plantilla que se repite cada semana"}
					</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 max-[760px]:w-full">
				{view === "dates" && !dates.includes(today) && (
					<Button className="px-4 text-primary" onClick={onToday}>
						Ir a hoy
					</Button>
				)}
				<fieldset
					data-slot="schedule-views"
					className="m-0 flex min-w-0 rounded-xl border border-border bg-card p-[3px] max-[760px]:flex-[1_1_100%]"
				>
					<legend className="sr-only">Vista del horario</legend>
					{views.map(([id, text]) => (
						<Button
							key={id}
							variant="ghost"
							aria-pressed={view === id}
							className="rounded-[9px] px-4 text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground max-[760px]:flex-1"
							onClick={() => onView(id)}
						>
							{text}
						</Button>
					))}
				</fieldset>
				<Button
					variant={view === "structure" ? "primary" : "default"}
					className={cn(
						"px-4",
						view !== "structure" && "text-primary",
						"max-[760px]:flex-[1_1_100%]",
					)}
					disabled={!canCreate}
					onClick={onCreate}
				>
					<Icon name="plus" size={18} />
					Agendar clase
				</Button>
			</div>
		</header>
	);
}
