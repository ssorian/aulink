import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardTitle } from "../../../components/ui/card";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Legend } from "../../../components/ui/legend";
import { Meter } from "../../../components/ui/meter";
import { Stat, StatGrid } from "../../../components/ui/stat";
import type { Tone } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import type { State } from "../shared/workflows";
import type { EvaluationRules } from "./evaluation-operations";
import {
	filterFieldClass,
	filterRowClass,
	layoutClass,
	SectionHeading,
	sideClass,
	statClass,
} from "./evaluation-parts";
import {
	buildEvaluationMatrix,
	type EvaluationData,
	subjectStatistics,
	summarizeEvaluation,
} from "./evaluation-results";

type Filter = "period" | "groupId" | "subject" | "grade";
type Props = {
	data: EvaluationData;
	cycleId: string;
	cycleName: string;
	period: string;
	subject: string;
	groupId: string;
	grade?: string;
	options: {
		periods: string[];
		grades: string[];
		groups: State["groups"];
		subjects: string[];
	};
	onFilter: (field: Filter, value: string) => void;
	rules: EvaluationRules;
	onOpenGroup: (id: string) => void;
};
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("es-MX", {
	style: "percent",
	maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-MX", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 2,
});
const fmt = (value: number | null | undefined) =>
	value == null ? "—" : decimal.format(value);
const rowTone = {
	fail: { fill: "bg-brick", mean: "text-brick-ink" },
	near: { fill: "bg-mustard", mean: "text-mustard-ink" },
	good: { fill: "bg-success-fill", mean: "text-foreground" },
	missing: { fill: "", mean: "text-muted-foreground" },
} as const;
const legendTones: Record<"fail" | "near" | "good", Tone> = {
	fail: "brick",
	near: "mustard",
	good: "success",
};
const countLabel = (count: number) =>
	`${count} ${count === 1 ? "calificación publicada" : "calificaciones publicadas"}`;

export function EvaluationResultsView({
	data,
	cycleId,
	cycleName,
	period,
	subject,
	groupId,
	grade = "",
	options,
	onFilter,
	rules,
	onOpenGroup,
}: Props) {
	const [selectedScale, setSelectedScale] = useState("");
	const scales = data.scales.filter((scale) =>
		data.assignments.some(
			(a) => a.cycleId === cycleId && a.scaleKey === scale.key,
		),
	);
	const scale = scales.find((item) => item.key === selectedScale) || scales[0];
	const scaleKey = scale?.key || "";
	const validGroup = options.groups.some((g) => g.id === groupId)
		? groupId
		: "";
	// Grade narrows the published data before any aggregate is computed.
	const scoped: EvaluationData = grade
		? {
				...data,
				assignments: data.assignments.filter((a) => a.grade === grade),
				records: data.records.filter((r) => r.grade === grade),
			}
		: data;
	const filters = {
		cycleId,
		scaleKey,
		period,
		subject,
		groupId: validGroup,
	};
	const report = summarizeEvaluation(scoped, filters);
	const matrix = buildEvaluationMatrix(report);
	const records = scoped.records.filter(
		(r) =>
			r.cycleId === cycleId &&
			r.scaleKey === scaleKey &&
			(!period || r.period === period) &&
			(!subject || r.subject === subject) &&
			(!validGroup || r.groupId === validGroup),
	);
	const failures = records.filter((r) => r.value < rules.passing).length;
	const approval = records.length
		? (records.length - failures) / records.length
		: null;
	// Evolution follows every filter except the term, so terms stay comparable.
	const evolution = summarizeEvaluation(scoped, {
		...filters,
		period: "",
	}).byPeriod.filter((p) => p.mean != null);
	const approvalOf = (list: typeof records) =>
		list.length
			? list.filter((r) => r.value >= rules.passing).length / list.length
			: null;
	const byMean = <T extends { mean: number | null; label: string }>(
		a: T,
		b: T,
	) =>
		a.mean == null
			? b.mean == null
				? a.label.localeCompare(b.label, "es", { numeric: true })
				: 1
			: b.mean == null
				? -1
				: a.mean - b.mean;
	const selected = options.groups.find((g) => g.id === validGroup);
	// With a group chosen the report only holds that group's assignments,
	// so the bars list exactly the subjects it takes.
	const rows = selected
		? matrix.bySubject
				.map((subject) => ({
					key: subject.key,
					label: subject.label,
					mean: subject.mean,
					count: subject.count,
					approval: approvalOf(
						records.filter((r) => r.subject === subject.key),
					),
					group: undefined as string | undefined,
				}))
				.sort(byMean)
		: matrix.groups
				.map((group) => ({
					key: group.key,
					label: group.label,
					mean: group.mean,
					count: group.count,
					approval: approvalOf(records.filter((r) => r.groupId === group.key)),
					group: group.key,
				}))
				.sort(byMean);
	const failing = subjectStatistics(report, records, rules.passing)
		.filter((row) => row.failureRate != null && row.failureRate > 0)
		.sort((a, b) => (b.failureRate ?? 0) - (a.failureRate ?? 0))
		.slice(0, 5);
	const position = (value: number) =>
		scale
			? Math.max(
					0,
					Math.min(100, ((value - scale.min) / (scale.max - scale.min)) * 100),
				)
			: 0;
	const tone = (mean: number | null) =>
		mean == null
			? "missing"
			: mean < rules.passing
				? "fail"
				: mean < rules.passing + 1
					? "near"
					: "good";
	const empty = !report.rows.length;
	return (
		<section
			data-slot="evaluation-results"
			className="mt-7"
			aria-label="Resultados publicados"
		>
			<SectionHeading
				title={`Resultados de ${period || "todo el ciclo"}`}
				description={`${scale ? scale.label : "Sin escala"} · ${cycleName}`}
			>
				{scales.length > 1 && (
					<Select
						id="evaluation-scale"
						label="Escala"
						className={cn(filterFieldClass, "flex-none")}
						value={scaleKey}
						items={scales.map((item) => ({
							value: item.key,
							label: item.label.replace(/^Escala /, ""),
						}))}
						onChange={setSelectedScale}
					/>
				)}
			</SectionHeading>
			<div className={layoutClass}>
				<div className="min-w-0">
					<Card
						data-slot="results-stats"
						aria-label="Resumen de resultados"
						padding="none"
						className="px-5.5 py-5"
					>
						<StatGrid className="grid-cols-2 md:grid-cols-3">
							<Stat
								state="groups"
								label="Promedio general"
								value={
									<span data-slot="evaluation-mean">{fmt(report.mean)}</span>
								}
								caption={countLabel(report.count)}
								className={cn(
									statClass,
									"[&_dd]:flex-wrap [&_dd>span]:font-medium",
								)}
							/>
							<Stat
								state="published"
								label="Aprobación"
								value={approval == null ? "—" : percent.format(approval)}
								caption={`mínimo ${number.format(rules.passing)}`}
								className={cn(
									statClass,
									"[&_dd]:flex-wrap [&_dd>span]:font-medium",
								)}
							/>
							<Stat
								state="missing"
								label="Reprobatorias"
								value={failures}
								caption={`de ${records.length}`}
								className={cn(
									statClass,
									"[&_dd]:flex-wrap [&_dd>span]:font-medium",
								)}
							/>
						</StatGrid>
						{evolution.length > 1 && (
							<p
								data-slot="results-evolution"
								className="mt-3.5 max-w-[72ch] text-sm leading-[1.6] text-muted-foreground"
							>
								{evolution.map((p, index) => (
									<span key={p.key}>
										{index > 0 && <span aria-hidden="true"> → </span>}
										{p.label}{" "}
										<strong className="text-foreground">{fmt(p.mean)}</strong>
									</span>
								))}
							</p>
						)}
					</Card>
					<FilterBar label="Filtros de resultados" className={filterRowClass}>
						<Select
							id="results-grade"
							label="Grado"
							className={filterFieldClass}
							value={grade}
							all="Todos"
							items={options.grades.map((g) => ({ value: g, label: g }))}
							onChange={(v) => onFilter("grade", v)}
						/>
						<Select
							id="results-group"
							label="Grupo"
							className={filterFieldClass}
							value={validGroup}
							all="Todos"
							items={options.groups.map((g) => ({
								value: g.id,
								label: g.name,
							}))}
							onChange={(v) => onFilter("groupId", v)}
						/>
						<Select
							id="results-period"
							label="Trimestre"
							className={filterFieldClass}
							value={period}
							all="Todo el ciclo"
							items={options.periods.map((p) => ({ value: p, label: p }))}
							onChange={(v) => onFilter("period", v)}
						/>
						<Select
							id="results-subject"
							label="Materia"
							className={filterFieldClass}
							value={subject}
							all="Todas"
							items={options.subjects.map((x) => ({ value: x, label: x }))}
							onChange={(v) => onFilter("subject", v)}
						/>
					</FilterBar>
					<Card
						data-slot="results-bars"
						aria-labelledby="results-bars-title"
						padding="none"
						className="px-5.5 pt-[18px] pb-2"
					>
						<header className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
							<CardTitle
								id="results-bars-title"
								className="text-base font-[650] tracking-normal"
							>
								{selected
									? `Materias de ${selected.name}`
									: "Promedio por grupo"}
							</CardTitle>
							<Legend
								label="Leyenda de promedios"
								className="gap-x-3.5 gap-y-1 text-[13px]"
								items={[
									{
										tone: legendTones.fail,
										label: `Reprobatorio (< ${number.format(rules.passing)})`,
									},
									{
										tone: legendTones.near,
										label: `Cerca del mínimo (< ${number.format(rules.passing + 1)})`,
									},
									{ tone: legendTones.good, label: "Aprobado" },
								]}
							/>
						</header>
						{empty ? (
							<div className="py-6 text-center">
								<strong>Sin resultados publicados</strong>
								<p className="mt-1 text-sm">
									Publica calificaciones desde el espacio de un grupo para
									verlas aquí.
								</p>
							</div>
						) : (
							<ol className="m-0 list-none p-0">
								{rows.map((row) => {
									const key = tone(row.mean);
									return (
										<li
											key={row.key}
											data-tone={key}
											className="grid min-h-12 grid-cols-[minmax(120px,180px)_minmax(0,1fr)_64px_84px] items-center gap-3.5 border-border not-first:border-t max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-1.5 max-md:py-2"
										>
											{row.group ? (
												<Button
													variant="link"
													data-slot="results-row-name"
													className="min-h-9 max-w-full justify-self-start overflow-hidden text-left text-sm font-[650] text-ellipsis whitespace-nowrap"
													aria-label={`Abrir grupo ${row.label}`}
													onClick={() => onOpenGroup(row.group as string)}
												>
													{row.label}
												</Button>
											) : (
												<span
													data-slot="results-row-name"
													className="overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-foreground"
												>
													{row.label}
												</span>
											)}
											<span
												aria-hidden="true"
												title={countLabel(row.count)}
												className="relative block h-3 rounded-full bg-muted max-md:col-span-full max-md:row-start-2"
											>
												{row.mean != null && (
													<span
														className={cn(
															"block h-full rounded-[inherit]",
															rowTone[key].fill,
														)}
														style={{ width: `${position(row.mean)}%` }}
													/>
												)}
												<b
													data-slot="results-threshold"
													className="absolute -top-1 -bottom-1 w-0.5 rounded-[1px] bg-foreground opacity-55"
													style={{ left: `${position(rules.passing)}%` }}
												/>
											</span>
											<strong
												className={cn(
													"justify-self-end text-base font-[650] whitespace-nowrap",
													rowTone[key].mean,
													key === "missing" && "text-[13px] font-medium",
												)}
											>
												{row.count ? fmt(row.mean) : "Sin publicar"}
											</strong>
											<span className="justify-self-end text-[13px] whitespace-nowrap text-muted-foreground max-md:hidden">
												{row.approval == null
													? ""
													: `${percent.format(row.approval)} aprob.`}
											</span>
										</li>
									);
								})}
							</ol>
						)}
					</Card>
					<details className="mt-6 border-t border-border">
						<summary className="min-h-11 cursor-pointer py-3 text-[13px] text-primary">
							Cómo se calculan los resultados
						</summary>
						<p className="mt-2 mb-3 max-w-[72ch] text-[13px] leading-[1.6] text-muted-foreground">
							Cada calificación publicada pesa igual; no se promedian los
							promedios de los grupos. Las faltantes no cuentan como cero, los
							borradores quedan fuera y las escalas nunca se mezclan. Los
							conteos son registros de calificaciones: no representan alumnos ni
							cobertura.
						</p>
					</details>
					{(data.diagnostics.excluded > 0 ||
						data.diagnostics.duplicates > 0) && (
						<p className="max-w-[72ch] pt-4 text-[13px] leading-[1.6] text-muted-foreground">
							Diagnóstico global de los datos guardados (todos los ciclos y
							escalas): {data.diagnostics.excluded} registros publicados
							excluidos por datos inválidos o referencias incompletas;{" "}
							{data.diagnostics.duplicates} duplicados válidos contados por
							separado.
						</p>
					)}
				</div>
				<aside className={sideClass}>
					<Card
						data-slot="results-failing"
						aria-labelledby="results-failing-title"
						padding="none"
						className="p-[18px]"
					>
						<CardTitle
							id="results-failing-title"
							className="text-base font-[650] tracking-normal"
						>
							Materias con más reprobación
						</CardTitle>
						{failing.length ? (
							<CardContent>
								<ol className="m-0 grid list-none gap-3.5 p-0">
									{failing.map((row) => (
										<li
											key={row.subject}
											className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
										>
											<span>{row.subject}</span>
											<strong className="text-base font-[650] text-brick-ink">
												{percent.format(row.failureRate ?? 0)}
											</strong>
											<Meter
												percent={(row.failureRate ?? 0) * 100}
												label={`Reprobación de ${row.subject}`}
												tone="brick"
												className="col-span-full h-2"
											/>
										</li>
									))}
								</ol>
							</CardContent>
						) : (
							<p className="text-sm">
								Ninguna materia tiene calificaciones reprobatorias.
							</p>
						)}
					</Card>
				</aside>
			</div>
		</section>
	);
}
