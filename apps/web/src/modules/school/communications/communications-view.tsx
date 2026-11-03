import { useState } from "react";
import { Icon } from "../../../components/ui/icon";
import {
	communicationSummary,
	validateCommunicationTarget,
} from "./communication-summary";
import { Select } from "../evaluation/evaluation-progress";
import { noticeFields } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import "../shared/group-tables.css";

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

const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter((word) => /^[\p{L}\d]/u.test(word))
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
/** Notices store no author or date: the audience is who the post speaks to. */
function poster(s: ViewProps["s"], notice: ViewProps["s"]["notices"][number]) {
	const cycle = (id?: string) =>
		s.cycles.find((c) => c.id === id)?.name || "Ciclo no disponible";
	if (notice.audience === "school")
		return {
			badge: initials(s.school.name),
			name: "Toda la escuela",
			context: s.school.name,
		};
	if (notice.audience === "group") {
		const group = s.groups.find((g) => g.id === notice.target);
		return {
			badge: (group?.name || "?").replace(/[^\p{L}\d]/gu, "").slice(0, 3),
			name: group?.name || "Grupo no disponible",
			context: `Grupo · ${cycle(group?.cycle)}`,
		};
	}
	const student = s.students.find((x) => x.id === notice.target);
	return {
		badge: initials(student?.name || "?"),
		name: student?.name || "Alumno no disponible",
		context: "Alumno y sus tutores",
	};
}
function TutorList({
	names,
	published,
}: {
	names: string[];
	published: boolean;
}) {
	const shown = names.slice(0, 4);
	return (
		<details className="publication-recipients">
			<summary>
				<span className="tutor-stack" aria-hidden="true">
					{shown.map((name) => (
						<span className="tutor-avatar" key={name}>
							{initials(name)}
						</span>
					))}
					{names.length > shown.length && (
						<span className="tutor-avatar tutor-more">
							+{names.length - shown.length}
						</span>
					)}
				</span>
				<span>
					{`${names.length} tutor${names.length === 1 ? " verificado" : "es verificados"} · ${published ? "al publicar" : "previstos"}`}
				</span>
			</summary>
			{names.length > 0 && (
				<ul className="tutor-grid">
					{names.map((name) => (
						<li className="tutor-chip" key={name}>
							<span className="tutor-avatar" aria-hidden="true">
								{initials(name)}
							</span>
							{name}
						</li>
					))}
				</ul>
			)}
		</details>
	);
}

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
			{!s.notices.length ? (
				<p className="progress-card notices-empty">
					Tu primer comunicado empieza como borrador. Define la audiencia y
					revisa los tutores antes de publicar.
				</p>
			) : !visible.length ? (
				<p className="progress-card notices-empty">
					Ningún comunicado con estos filtros.
				</p>
			) : (
				<div className="notices-list">
					{visible.map(({ notice: n, summary }) => {
						const who = poster(s, n);
						const tone = n.published
							? "published"
							: summary.canPublish
								? "draft"
								: "blocked";
						return (
							<article
								className="progress-card notice-card"
								data-notice={n.id}
								data-state={tone}
								key={n.id}
							>
								<header className="notice-head">
									<span className="notice-avatar" aria-hidden="true">
										{who.badge}
									</span>
									<span className="notice-author">{who.name}</span>
									<span className="notice-context">· {who.context}</span>
									<span className="notice-state" data-state={tone}>
										{n.published ? "Publicado" : "Borrador"}
									</span>
								</header>
								<h3>{summary.preview.title}</h3>
								<p className="notice-excerpt">{summary.preview.text}</p>
								{!n.published && !summary.canPublish && (
									<p
										className="notice-warning"
										id={`publication-empty-${n.id}`}
									>
										Sin tutores verificados en esta audiencia. Edita el borrador
										o revisa los vínculos de tutores antes de publicar.
									</p>
								)}
								<footer className="notice-footer">
									<TutorList
										names={summary.recipients}
										published={n.published}
									/>
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
												className="primary"
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
								</footer>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}
