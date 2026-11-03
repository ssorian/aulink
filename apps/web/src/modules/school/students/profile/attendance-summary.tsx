import { Badge } from "../../../../components/ui/badge";
import { Meter } from "../../../../components/ui/meter";
import { Stat, StatGrid } from "../../../../components/ui/stat";
import { summarizeAttendance } from "../../attendance/attendance-record";
import {
	DEMO_ATTENDANCE,
	DEMO_CUTOFF,
	DEMO_JUSTIFIED,
	DEMO_RULES,
} from "../../attendance/attendance-record-demo";
import { formatDay } from "../../attendance/attendance-view";
import type { ProfileTab } from "./profile-tab";
import { CardLink, SummaryCard, statWrap } from "./summary-card";

export function AttendanceSummary({
	onTab,
}: {
	onTab: (tab: ProfileTab) => void;
}) {
	const { general, subjects, pending } = summarizeAttendance(
		DEMO_ATTENDANCE,
		DEMO_JUSTIFIED,
		DEMO_RULES,
	);
	const risk = subjects.filter((x) => x.atRisk).length;
	return (
		<SummaryCard
			heading="Asistencia"
			meta={
				<>
					<span className="text-sm text-muted-foreground">
						al {formatDay(DEMO_CUTOFF)}
					</span>
					<Badge>Datos de muestra</Badge>
				</>
			}
			action={
				<CardLink label="Ver asistencia" onClick={() => onTab("Asistencia")} />
			}
		>
			{general.percent === null ? (
				<p className="m-0 text-sm text-muted-foreground">
					El ciclo todavía no tiene días de clase transcurridos.
				</p>
			) : (
				<>
					<StatGrid label="Resumen de asistencia" className="md:grid-cols-3">
						<Stat
							className={statWrap}
							label="Entradas al plantel"
							value={`${general.percent} %`}
							caption={`${general.attended} de ${general.total} días con entrada`}
							tone="teal"
						/>
						<Stat
							className={statWrap}
							label="Materias en riesgo"
							value={risk}
							caption="pase de lista por materia"
							tone={risk > 0 ? "danger" : "success"}
						/>
						<Stat
							className={statWrap}
							label="Faltas por justificar"
							value={pending.length}
							tone={pending.length > 0 ? "mustard" : "success"}
						/>
					</StatGrid>
					<Meter
						className="mt-4"
						percent={general.percent}
						label={`Entradas al plantel; mínimo para acreditar ${DEMO_RULES.minimumPercent} %`}
						tone={
							general.percent < DEMO_RULES.minimumPercent ? "danger" : "teal"
						}
					/>
				</>
			)}
		</SummaryCard>
	);
}
