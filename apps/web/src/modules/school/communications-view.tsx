import { Icon } from "../../components/ui/icon";
import {
	communicationSummary,
	validateCommunicationTarget,
} from "./communication-summary";
import { Empty, noticeFields } from "./view-helpers";
import type { ViewProps } from "./view-types";

export function CommunicationsView({
	s,
	open,
	contextGroup = "",
}: Pick<ViewProps, "s" | "open"> & { contextGroup?: string }) {
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
	return (
		<>
			<button
				className="primary"
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
							? { audience: "group", target: contextGroup, group: contextGroup }
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
			<p className="publication-status">
				{s.notices.filter((n) => !n.published).length} borradores ·{" "}
				{s.notices.filter((n) => n.published).length} publicados.
			</p>
			<div className="task-grid communications-list">
				{s.notices.map((n) => {
					const summary = communicationSummary(s, n);
					return (
						<article className="panel" key={n.id}>
							<span
								className={`pill ${n.published ? "publication-published" : "publication-draft"}`}
							>
								{n.published ? "Publicado" : "Borrador"}
							</span>
							<p className="publication-audience">{summary.audience}</p>
							<section
								className="publication-preview"
								aria-label="Vista previa familiar"
							>
								<h2>{summary.preview.title}</h2>
								<p>{summary.preview.text}</p>
							</section>
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
								<p id={`publication-empty-${n.id}`}>
									Sin tutores verificados en esta audiencia. Edita el borrador o
									revisa los vínculos de tutores antes de publicar.
								</p>
							)}
							{!n.published && (
								<div className="actions">
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
						</article>
					);
				})}
			</div>
			{!s.notices.length && (
				<Empty text="Tu primer comunicado empieza como borrador. Define la audiencia y revisa los tutores antes de publicar." />
			)}
		</>
	);
}
