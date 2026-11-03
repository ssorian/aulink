import { Meter } from "../../../../components/ui/meter";
import { Stat, StatGrid } from "../../../../components/ui/stat";
import type { State } from "../../shared/workflows";
import { summarizeGrades } from "../student-summary";
import type { ProfileTab } from "./profile-tab";
import { CardLink, SummaryCard, statWrap } from "./summary-card";

const decimal = new Intl.NumberFormat("es-MX", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

export function GradesSummary({
	s,
	studentId,
	groups,
	onTab,
}: {
	s: State;
	studentId: string;
	groups: string[];
	onTab: (tab: ProfileTab) => void;
}) {
	const g = summarizeGrades(s, studentId, groups);
	const { passing } = s.evaluationRules;
	return (
		<SummaryCard
			heading="Calificaciones"
			action={
				<CardLink
					label="Ver calificaciones"
					onClick={() => onTab("Calificaciones")}
				/>
			}
		>
			<StatGrid label="Resumen de calificaciones">
				<Stat
					className={statWrap}
					label="Promedio"
					value={g.average === null ? "—" : decimal.format(g.average)}
					caption={
						g.average === null
							? "Sin calificaciones publicadas"
							: "calificaciones publicadas"
					}
					tone="lilac"
				/>
				<Stat
					className={statWrap}
					label="Materias calificadas"
					value={`${g.graded} de ${g.subjects}`}
					tone="sky"
				/>
				<Stat
					className={statWrap}
					label={`Bajo el mínimo (${passing})`}
					value={g.failing}
					tone={g.failing > 0 ? "danger" : "success"}
				/>
				<Stat
					className={statWrap}
					label="En borrador"
					value={g.drafts}
					tone={g.drafts > 0 ? "mustard" : "neutral"}
				/>
			</StatGrid>
			{g.average !== null && (
				<Meter
					className="mt-4"
					percent={g.average * 10}
					tone={g.average < passing ? "danger" : "success"}
					label="Promedio de calificaciones publicadas, escala de 0 a 10"
				/>
			)}
		</SummaryCard>
	);
}
