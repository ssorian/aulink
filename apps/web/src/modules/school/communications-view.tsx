import { useState } from "react";
import { Icon } from "../../components/ui/icon";
import {
	communicationSummary,
	validateCommunicationTarget,
} from "./communication-summary";
import { Select } from "./evaluation-progress";
import { noticeFields } from "./view-helpers";
import type { ViewProps } from "./view-types";
import "./group-tables.css";

const states = [
	["", "Todos"],
	["draft", "Borradores"],
	["published", "Publicados"],
] as const;
const audiences = [
	{ value: "school", label: "Escuela" },
	{ value: "group", label: "Grupo" },
	{ value: "student", label: "Alumno" },
];

export function CommunicationsView({
	s,
	open,
	contextGroup = "",
}: Pick<ViewProps, "s" | "open"> & { contextGroup?: string }) {
	const [state, setState] = useState<"" | "draft" | "published">("");
	const [audience, setAudience] = useState("");
	const group = s.groups.find((g) => g.id === contextGroup);
	const fields = noticeFields(s).map((field) =>
		field.key === "target"
			? {
					...field,
					validate: (value: string, values: Record<string, string>) =>
						validateCommunicationTarget(s, values.audience, value),
				}
			: field,
	);
	const notices = s.notices.map((notice) => ({
		notice,
		summary: communicationSummary(s, notice),
	}));
	const drafts = notices.filter(({ notice }) => !notice.published);
	const published = notices.filter(({ notice }) => notice.published);
	const blocked = drafts.filter(({ summary }) => !summary.canPublish);
	const reached = new Set(
		published.flatMap(({ summary }) => summary.recipients),
	).size;
	// Drafts that cannot reach anyone first, then other drafts, then sent notices.
	const rank = (item: (typeof notices)[number]) =>
		item.notice.published ? 2 : item.summary.canPublish ? 1 : 0;
	const visible = notices
		.filter(
			({ notice }) =>
				(!state || (state === "published") === notice.published) &&
				(!audience || notice.audience === audience),
		)
		.sort((a, b) => rank(a) - rank(b));
	const stats = [
		["draft", "Borradores", drafts.length],
		["published", "Publicados", published.length],
		["reached", "Tutores alcanzados", reached],
		["blocked", "Sin destinatarios", blocked.length],
	] as const;
	return (
		<section
			className="evaluation-progress notices-view"
			aria-label="Comunicados"
		>
			<header className="progress-heading">
				<div>
					<h2>
						{group ? `Comunicados de ${group.name}` : "Comunicados del ciclo"}
					</h2>
					<p>Se publican solo a tutores verificados.</p>
				</div>
				<button
					className="primary notices-create"
					type="button"
					onClick={() =>
						open(
							"notice",
							group
								? `Crear comunicado de ${group.name}`
								: "Crear borrador de comunicado",
							contextGroup
								? fields.filter((f) => f.key === "title" || f.key === "text")
								: fields,
							contextGroup
								? {
										audience: "group",
										target: contextGroup,
										group: contextGroup,
									}
								: {},
							contextGroup
								? [
										`Audiencia fija: ${group?.name} · ${s.cycles.find((c) => c.id === group?.cycle)?.name}`,
									]
								: undefined,
						)
					}
				>
					<Icon name="plus" size={18} />
					Crear borrador
				</button>
			</header>
			<section
				className="progress-card progress-stats notices-stats"
				aria-label="Resumen de comunicados"
			>
				<dl>
					{stats.map(([key, label, value]) => (
						<div key={key} data-state={key}>
							<dt>{label}</dt>
							<dd>
								<strong>{value}</strong>
							</dd>
						</div>
					))}
				</dl>
			</section>
			<div className="progress-filters notices-filters">
				<fieldset className="attendance-modes">
					<legend className="schedule-hidden">Estado</legend>
					{states.map(([value, label]) => (
						<button
							type="button"
							key={value || "all"}
							aria-pressed={state === value}
							onClick={() => setState(value)}
						>
							{label}
						</button>
					))}
				</fieldset>
				<Select
					id="notices-audience"
					label="Audiencia"
					value={audience}
					all="Todas"
					items={audiences}
					onChange={setAudience}
				/>
			</div>
			<section
				className="progress-card notices-list"
				aria-label="Lista de comunicados"
			>
				{!s.notices.length ? (
					<p className="notices-empty">
						Tu primer comunicado empieza como borrador. Define la audiencia y
						revisa los tutores antes de publicar.
					</p>
				) : !visible.length ? (
					<p className="notices-empty">Ningún comunicado con estos filtros.</p>
				) : (
					<ul>
						{visible.map(({ notice: n, summary }) => (
							<li className="notice-row" key={n.id}>
								<div className="notice-body">
									<p className="notice-meta">
										<span
											className="notice-state"
											data-state={
												n.published
													? "published"
													: summary.canPublish
														? "draft"
														: "blocked"
											}
										>
											{n.published ? "Publicado" : "Borrador"}
										</span>
										<span className="publication-audience">
											{summary.audience}
										</span>
									</p>
									<h3>{summary.preview.title}</h3>
									<p className="notice-text">{summary.preview.text}</p>
									<details className="publication-recipients">
										<summary>
											{`${summary.recipients.length} tutor${summary.recipients.length === 1 ? " verificado" : "es verificados"} · ${n.published ? "al publicar" : "previstos"}`}
										</summary>
										<ul>
											{summary.recipients.map((name) => (
												<li key={name}>{name}</li>
											))}
										</ul>
									</details>
									{!n.published && !summary.canPublish && (
										<p
											className="notice-warning"
											id={`publication-empty-${n.id}`}
										>
											Sin tutores verificados en esta audiencia. Edita el
											borrador o revisa los vínculos de tutores antes de
											publicar.
										</p>
									)}
								</div>
								{!n.published && (
									<div className="notice-actions">
										<button
											type="button"
											onClick={() =>
												open("notice", `Editar ${n.title}`, fields, {
													...n,
													published: String(n.published),
													recipients: "",
													id: n.id,
												})
											}
										>
											<Icon name="edit" size={16} />
											Editar borrador
										</button>
										<button
											type="button"
											disabled={!summary.canPublish}
											aria-describedby={
												!summary.canPublish
													? `publication-empty-${n.id}`
													: undefined
											}
											onClick={() =>
												open(
													"notice-publish",
													`Publicar: ${n.title}`,
													[],
													{ id: n.id },
													[
														summary.audience,
														`Vista previa familiar: ${summary.preview.title}`,
														summary.preview.text,
														`${summary.recipients.length} tutores verificados:`,
														...summary.recipients,
													],
												)
											}
										>
											<Icon name="send" size={16} />
											Revisar publicación
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</section>
		</section>
	);
}
