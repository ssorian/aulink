import { type ReactNode, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Icon } from "../../../components/ui/icon";
import {
	PostActions,
	PostBody,
	PostCard,
	PostDetails,
	PostFilterToggle,
	PostFooter,
	PostHeader,
	PostMarker,
	PostText,
} from "../../../components/ui/post-card";
import { Stat, StatGrid } from "../../../components/ui/stat";
import { cn } from "../../../lib/utils";
import { field, options, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";

type Report = State["conduct"][number];
type Filter = "Todos" | "Reconocimiento" | "Incidente";
type Open = ViewProps["open"];

const filters: { value: Filter; label: string }[] = [
	{ value: "Todos", label: "Todos" },
	{ value: "Reconocimiento", label: "Reconocimientos" },
	{ value: "Incidente", label: "Incidentes" },
];
const shortDate = new Intl.DateTimeFormat("es-MX", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("es-MX", {
	month: "long",
	timeZone: "UTC",
});
const atNoon = (date: string) => new Date(`${date}T12:00:00Z`);
const formatDate = (date: string) =>
	shortDate.format(atNoon(date)).replace(".", "");
const monthLabel = (date?: string) => {
	if (!date) return "Sin fecha";
	const name = monthName.format(atNoon(date));
	return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.slice(0, 4)}`;
};

/** Newest first; records saved without a date go last, keeping their order. */
export function sortConduct(rows: Report[]) {
	return [...rows].sort((a, b) =>
		a.date && b.date
			? b.date.localeCompare(a.date)
			: a.date
				? -1
				: b.date
					? 1
					: 0,
	);
}
export function visibleConduct(rows: Report[], filter: Filter) {
	return sortConduct(rows).filter(
		(c) => filter === "Todos" || c.kind === filter,
	);
}

function Lock() {
	return (
		<svg
			className="inline-block shrink-0 align-middle"
			focusable="false"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.65"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4" />
		</svg>
	);
}

export function ConductItem({
	c,
	s,
	open,
	studentName,
	showStudent,
}: {
	c: Report;
	s: State;
	open: Open;
	studentName: (id: string) => string;
	showStudent: boolean;
}) {
	const recognition = c.kind === "Reconocimiento";
	const shared = c.shared === "Compartido";
	const type = recognition ? "reconocimiento" : "incidente";
	const group = c.group
		? s.groups.find((g) => g.id === c.group)?.name || c.group
		: "Grupo no determinado";
	const steps = c.followup.split("\n").filter((line) => line.trim());
	const detailCount = steps.length + (c.internal ? 1 : 0);
	const tone = recognition ? "teal" : "brick";
	return (
		<PostCard tone={tone} state={c.published ? undefined : "draft"}>
			<PostHeader
				lead={
					<PostMarker tone={tone} pending={!c.published}>
						<Icon name={recognition ? "heart" : "bell"} size={16} />
					</PostMarker>
				}
				aside={
					<span className="shrink-0 self-start pt-0.5 text-[13px] leading-normal whitespace-nowrap text-muted-foreground">
						{c.date ? formatDate(c.date) : "Sin fecha"}
					</span>
				}
			>
				<p className="m-0 text-sm leading-normal text-muted-foreground">
					{c.author ? (
						<>
							<strong className="font-semibold text-foreground">
								{c.author}
							</strong>{" "}
							registró un{" "}
							<span
								data-slot="conduct-type"
								className={cn(
									"font-semibold",
									recognition ? "text-teal-ink" : "text-brick-ink",
								)}
							>
								{type}
							</span>
						</>
					) : (
						<>
							Autor no registrado ·{" "}
							<span
								data-slot="conduct-type"
								className={cn(
									"font-semibold",
									recognition ? "text-teal-ink" : "text-brick-ink",
								)}
							>
								{type}
							</span>
						</>
					)}
					{showStudent && (
						<>
							{" "}
							de{" "}
							<strong className="font-semibold text-foreground">
								{studentName(c.student)}
							</strong>
						</>
					)}
					<Badge className="ml-2 px-2 py-px font-normal text-muted-foreground">
						{group}
					</Badge>
				</p>
			</PostHeader>
			<PostBody indent>
				<PostText className="text-base leading-relaxed text-foreground">
					{c.text}
				</PostText>
				<div className="flex flex-wrap gap-1.5">
					{!c.published && (
						<Badge tone="mustard" data-state="draft" className="py-0.5">
							Borrador
						</Badge>
					)}
					<Badge className="gap-1.5 py-0.5 font-medium text-muted-foreground">
						{shared ? <Icon name="users" size={13} /> : <Lock />}
						{shared ? "Visible para familias" : "Solo interno"}
					</Badge>
				</div>
				<PostFooter className="mt-1">
					{detailCount > 0 && (
						<PostDetails
							summary={`Nota interna y seguimiento (${detailCount})`}
						>
							{c.internal && (
								<div className="rounded-lg bg-lilac-bg px-3 py-2.5">
									<strong className="flex items-center gap-1.5 text-xs font-semibold text-lilac-ink">
										<Lock />
										Nota interna · solo personal
									</strong>
									<p className="m-0 mt-1 text-sm leading-normal text-foreground">
										{c.internal}
									</p>
								</div>
							)}
							{steps.length > 0 && (
								<ul
									className={cn(
										"m-0 mb-1 grid list-none gap-1.5 p-0",
										c.internal ? "mt-2.5" : "mt-2",
									)}
								>
									{steps.map((line, i) => (
										<li
											// biome-ignore lint/suspicious/noArrayIndexKey: lines are an append-only log
											key={i}
											className="relative pl-4 text-sm leading-normal text-foreground before:absolute before:top-[0.6em] before:left-[3px] before:size-1.5 before:rounded-full before:bg-teal before:content-['']"
										>
											{line}
										</li>
									))}
								</ul>
							)}
						</PostDetails>
					)}
					<PostActions>
						<Button
							size="sm"
							className="whitespace-nowrap"
							onClick={() =>
								open(
									"conduct-followup",
									`Agregar seguimiento: ${c.id}`,
									[field("followup", "Nuevo seguimiento", "textarea"), reason],
									{ id: c.id },
									["Se agrega al seguimiento previo sin borrarlo."],
								)
							}
						>
							Agregar seguimiento
						</Button>
						{!c.published && (
							<Button
								size="sm"
								variant="primary"
								className="whitespace-nowrap"
								onClick={() =>
									open(
										"conduct-publish",
										`Revisar reporte de ${studentName(c.student)}`,
										[],
										{ id: c.id },
										[
											`${c.shared}: ${c.text}`,
											`Seguimiento: ${c.followup}`,
											"Las notas internas no forman parte del contenido compartido.",
										],
									)
								}
							>
								Revisar y publicar
							</Button>
						)}
					</PostActions>
				</PostFooter>
			</PostBody>
		</PostCard>
	);
}

/** Consecutive rows (already sorted) that share a month heading. */
export function groupByMonth(rows: Report[]) {
	const months: { label: string; rows: Report[] }[] = [];
	for (const c of rows) {
		const label = monthLabel(c.date);
		const last = months.at(-1);
		if (last && last.label === label) last.rows.push(c);
		else months.push({ label, rows: [c] });
	}
	return months;
}

function ConductBoard({
	s,
	open,
	studentName,
	studentId,
	action,
	emptyText,
}: Pick<ViewProps, "s" | "open" | "studentName"> & {
	studentId?: string;
	action: ReactNode;
	emptyText: string;
}) {
	const [filter, setFilter] = useState<Filter>("Todos");
	const count = (kind: string) =>
		s.conduct.filter((c) => c.kind === kind).length;
	const drafts = s.conduct.filter((c) => !c.published).length;
	const rows = visibleConduct(s.conduct, filter);
	const shared = s.conduct.filter((c) => c.shared === "Compartido").length;
	const stats = [
		["recognition", "Reconocimientos", count("Reconocimiento"), "teal"],
		["incident", "Incidentes", count("Incidente"), "brick"],
		["draft", "Borradores", drafts, "mustard"],
		["shared", "Visibles para familias", shared, "sky"],
	] as const;
	return (
		<div className="min-w-0">
			{!studentId && (
				<header className="mt-2 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
					<div>
						<h2 className="m-0 text-2xl font-[650] tracking-tight">
							Reportes de conducta
						</h2>
						<p className="mt-0.5 mb-0 text-sm text-muted-foreground">
							Los borradores y las notas internas no llegan a las familias.
						</p>
					</div>
					{action}
				</header>
			)}
			{s.conduct.length > 0 && (
				<Card
					padding="none"
					className="rounded-2xl px-[22px] py-5"
					aria-label="Resumen de reportes"
				>
					<StatGrid>
						{stats.map(([key, label, value, tone]) => (
							<Stat
								key={key}
								state={key}
								tone={tone}
								label={label}
								value={value}
							/>
						))}
					</StatGrid>
				</Card>
			)}
			{(s.conduct.length > 0 || studentId) && (
				<div
					data-slot="post-filters"
					className="mt-5 mb-2 flex flex-wrap items-center gap-2"
				>
					{s.conduct.length > 0 && (
						<PostFilterToggle
							label="Tipo de reporte"
							options={filters}
							value={filter}
							onChange={setFilter}
						/>
					)}
					{studentId && (
						<div className="ml-auto max-[760px]:ml-0 max-[760px]:w-full max-[760px]:*:w-full empty:hidden">
							{action}
						</div>
					)}
				</div>
			)}
			{rows.length > 0 ? (
				<div data-slot="post-list">
					{groupByMonth(rows).map((month) => (
						<section key={month.label}>
							<h3 className="mt-[26px] mb-2.5 text-[13px] leading-normal font-semibold tracking-normal text-muted-foreground [section:first-child>&]:mt-1">
								{month.label}
							</h3>
							<div className="grid gap-3.5">
								{month.rows.map((c) => (
									<ConductItem
										key={c.id}
										c={c}
										s={s}
										open={open}
										studentName={studentName}
										showStudent={!studentId}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			) : s.conduct.length > 0 ? (
				<p className="m-0 py-6 text-[15px] text-muted-foreground">
					No hay reportes de este tipo.
				</p>
			) : (
				<EmptyState text={emptyText} />
			)}
		</div>
	);
}

export function ConductView({
	s,
	open,
	students,
	studentName,
	hideCreate = false,
	studentId,
	groupId,
}: Pick<ViewProps, "s" | "open" | "students" | "studentName"> & {
	hideCreate?: boolean;
	studentId?: string;
	groupId?: string;
}) {
	const registerButton = hideCreate ? null : (
		<Button
			variant="primary"
			disabled={studentId ? !groupId : undefined}
			onClick={() =>
				open(
					"conduct",
					"Registrar acompañamiento",
					[
						...(!studentId ? [students] : []),
						options("kind", "Tipo", [
							{ id: "Reconocimiento", name: "Reconocimiento" },
							{ id: "Incidente", name: "Incidente" },
						]),
						field("text", "Contenido del reporte", "textarea"),
						{
							...field(
								"internal",
								"Notas internas (no compartidas)",
								"textarea",
							),
							optional: true,
						},
						field("followup", "Seguimiento acordado", "textarea"),
						options("shared", "Visibilidad", [
							{ id: "Interno", name: "Solo interno" },
							{
								id: "Compartido",
								name: "Contenido público",
							},
						]),
					],
					studentId && groupId
						? { student: studentId, group: groupId }
						: undefined,
				)
			}
		>
			{studentId
				? "Registrar reconocimiento o incidente"
				: "Registrar reconocimiento / incidente"}
		</Button>
	);
	return (
		<>
			{studentId && <h2 className="sr-only">Conducta</h2>}
			{studentId && !groupId && (
				<p>Se necesita un grupo activo para registrar conducta.</p>
			)}
			<ConductBoard
				s={s}
				open={open}
				studentName={studentName}
				studentId={studentId}
				action={registerButton}
				emptyText={
					studentId && !groupId
						? "No hay registros de conducta."
						: "Registra un reconocimiento o incidente con seguimiento concreto."
				}
			/>
		</>
	);
}
