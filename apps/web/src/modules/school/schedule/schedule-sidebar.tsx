import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle } from "../../../components/ui/card";
import { Icon } from "../../../components/ui/icon";
import { cn } from "../../../lib/utils";
import { toneVars } from "./schedule-tones";

// The month picker is a shared primitive; groups still import it from here.
export { type DayMarks, MiniMonth } from "../../../components/ui/mini-month";

const sideCard = "rounded-2xl px-[18px] pt-[18px] pb-4";
const sideTitle =
	"text-base font-[650] tracking-[-0.01em] whitespace-nowrap first-letter:uppercase";
const sideHeader = "mb-3 flex-nowrap gap-2";
const sideEmpty = "m-0 text-[13px] text-muted-foreground";

export type SubjectRow = {
	id: string;
	subject: string;
	teacher: string;
	tone: number;
	minutes: number;
};
const hoursText = (value: number) => {
	const h = Math.floor(value / 60);
	const m = value % 60;
	if (!value) return "Sin horario";
	return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

export function SubjectFilter({
	rows,
	hidden,
	onToggle,
	onAdd,
}: {
	rows: SubjectRow[];
	hidden: Set<string>;
	onToggle: (id: string) => void;
	onAdd: () => void;
}) {
	return (
		<Card
			padding="none"
			className={sideCard}
			aria-labelledby="schedule-subjects-title"
		>
			<CardHeader className={sideHeader}>
				<CardTitle id="schedule-subjects-title" className={sideTitle}>
					Materias
				</CardTitle>
				<span className="text-xs text-muted-foreground">Horas por semana</span>
			</CardHeader>
			{rows.length ? (
				<ul className="m-0 grid list-none gap-0.5 p-0">
					{rows.map((row) => (
						<li key={row.id}>
							<label
								data-slot="schedule-subject"
								title={row.teacher}
								data-tone={row.tone}
								style={toneVars(row.tone)}
								className="grid min-h-9 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-1.5 py-0.5 text-sm hover:bg-background"
							>
								<input
									type="checkbox"
									checked={!hidden.has(row.id)}
									onChange={() => onToggle(row.id)}
									className="peer m-0 size-[18px] min-h-0 p-0 accent-(--block-line)"
								/>
								<span
									data-slot="schedule-subject-name"
									className="min-w-0 truncate leading-tight peer-not-checked:text-muted-foreground peer-not-checked:line-through"
								>
									{row.subject}
								</span>
								<span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
									<Icon name="clock" size={14} />
									{hoursText(row.minutes)}
								</span>
							</label>
						</li>
					))}
				</ul>
			) : (
				<p className={sideEmpty}>Este grupo aún no tiene materias.</p>
			)}
			<Button
				variant="link"
				className="mt-2 min-h-11 px-1.5 text-sm"
				onClick={onAdd}
			>
				<Icon name="plus" size={16} />
				Agregar materia
			</Button>
		</Card>
	);
}

export type ChangeRow = {
	key: string;
	mark: "cancel" | "move" | "cover";
	subject: string;
	text: string;
	onOpen: () => void;
};
const markFill = {
	cancel: "bg-destructive",
	move: "bg-mustard",
	cover: "bg-[#7b72c4]",
};
export function WeekChanges({ rows }: { rows: ChangeRow[] }) {
	return (
		<Card
			padding="none"
			className={sideCard}
			aria-labelledby="schedule-changes-title"
		>
			<CardHeader className={sideHeader}>
				<CardTitle id="schedule-changes-title" className={sideTitle}>
					Cambios de la semana
				</CardTitle>
				{rows.length > 0 && (
					<Badge className="min-w-6 justify-center px-2 py-0.5 text-foreground">
						{rows.length}
					</Badge>
				)}
			</CardHeader>
			{rows.length ? (
				<ul className="m-0 grid list-none gap-0.5 p-0">
					{rows.map((row) => (
						<li key={row.key}>
							<Button
								variant="ghost"
								data-mark={row.mark}
								className="grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] justify-normal gap-2.5 rounded-[10px] p-1.5 text-left font-normal text-muted-foreground hover:bg-background"
								onClick={row.onOpen}
							>
								<span
									aria-hidden="true"
									className={cn("size-2 rounded-full", markFill[row.mark])}
								/>
								<span className="min-w-0 text-xs leading-[1.35] wrap-anywhere">
									<strong className="block text-sm font-semibold text-foreground">
										{row.subject}
									</strong>
									{row.text}
								</span>
								<Icon name="chevron" size={16} />
							</Button>
						</li>
					))}
				</ul>
			) : (
				<p className={sideEmpty}>
					Sin cancelaciones, reagendas ni suplencias esta semana.
				</p>
			)}
		</Card>
	);
}
