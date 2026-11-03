import { useState } from "react";
import { Avatar, AvatarStack } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Select } from "../../../components/ui/field";
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
	PostTitle,
} from "../../../components/ui/post-card";
import { Stat, StatGrid } from "../../../components/ui/stat";
import type { Tone } from "../../../components/ui/tone";
import { initials } from "../../../lib/initials";
import { noticeFields } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import {
	communicationSummary,
	validateCommunicationTarget,
} from "./communication-summary";

const states = [
	{ value: "", label: "Todos" },
	{ value: "draft", label: "Borradores" },
	{ value: "published", label: "Publicados" },
] as const;
const audiences = [
	{ value: "school", label: "Escuela" },
	{ value: "group", label: "Grupo" },
	{ value: "student", label: "Alumno" },
];

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
	return (
		<PostDetails
			summary={
				<>
					<AvatarStack names={names} max={4} size="sm" />
					<span>
						{`${names.length} tutor${names.length === 1 ? " verificado" : "es verificados"} · ${published ? "al publicar" : "previstos"}`}
					</span>
				</>
			}
		>
			{names.length > 0 && (
				<ul
					data-slot="post-people"
					className="m-0 mt-2.5 mb-1 grid max-h-58 list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-1.5 overflow-y-auto py-0.5 pr-0.5 pl-0"
				>
					{names.map((name) => (
						<li
							data-slot="post-person"
							className="flex min-w-0 items-center gap-2 truncate rounded-full bg-background py-1 pr-2.5 pl-1 text-[13px] whitespace-nowrap text-foreground"
							key={name}
						>
							<Avatar name={name} size="sm" tone="sky" />
							{name}
						</li>
					))}
				</ul>
			)}
		</PostDetails>
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
		["draft", "Borradores", drafts.length, "mustard"],
		["published", "Publicados", published.length, "success"],
		["reached", "Tutores alcanzados", reached, "teal"],
		["blocked", "Sin destinatarios", blocked.length, "brick"],
	] as const;
	const create = () =>
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
		);
	return (
		<section aria-label="Comunicados" data-slot="notices-view">
			<header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
				<div>
					<h2 className="m-0 text-2xl font-[650] tracking-tight">
						{group ? `Comunicados de ${group.name}` : "Comunicados del ciclo"}
					</h2>
					<p className="mt-0.5 mb-0 text-sm text-muted-foreground">
						Se publican solo a tutores verificados.
					</p>
				</div>
				<Button variant="primary" onClick={create}>
					<Icon name="plus" size={18} />
					Crear borrador
				</Button>
			</header>
			<Card
				padding="none"
				className="rounded-2xl px-[22px] py-5"
				aria-label="Resumen de comunicados"
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
			<div
				data-slot="post-filters"
				className="mt-7 mb-3 flex flex-wrap items-stretch gap-2"
			>
				<PostFilterToggle
					label="Estado"
					options={states}
					value={state}
					onChange={setState}
				/>
				<Select
					id="notices-audience"
					label="Audiencia"
					value={audience}
					all="Todas"
					items={audiences}
					onChange={setAudience}
					className="min-w-60 flex-none max-[760px]:min-w-0 max-[760px]:basis-full"
				/>
			</div>
			{!s.notices.length || !visible.length ? (
				<Card
					padding="none"
					data-slot="notices-empty"
					className="m-0 rounded-2xl p-7 text-center text-sm text-muted-foreground"
				>
					{!s.notices.length
						? "Tu primer comunicado empieza como borrador. Define la audiencia y revisa los tutores antes de publicar."
						: "Ningún comunicado con estos filtros."}
				</Card>
			) : (
				<div data-slot="post-list" className="grid gap-3.5">
					{visible.map(({ notice: n, summary }) => {
						const who = poster(s, n);
						const tone = n.published
							? "published"
							: summary.canPublish
								? "draft"
								: "blocked";
						const markerTone: Tone = n.published
							? "teal"
							: summary.canPublish
								? "lilac"
								: "brick";
						const badgeTone: Tone = n.published
							? "success"
							: summary.canPublish
								? "mustard"
								: "brick";
						return (
							<PostCard
								data-notice={n.id}
								state={tone}
								tone={markerTone}
								key={n.id}
							>
								<PostHeader
									lead={<PostMarker tone={markerTone}>{who.badge}</PostMarker>}
								>
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
										<p className="m-0 text-sm leading-normal text-muted-foreground">
											<strong
												data-slot="post-author"
												className="font-semibold text-foreground"
											>
												{who.name}
											</strong>{" "}
											· {who.context}
										</p>
										<Badge
											tone={badgeTone}
											data-state={tone}
											className="gap-1.5 py-0.5 ml-auto max-[760px]:ml-0"
										>
											<span
												aria-hidden="true"
												className="size-[7px] rounded-full bg-current"
											/>
											{n.published ? "Publicado" : "Borrador"}
										</Badge>
									</div>
								</PostHeader>
								<PostBody>
									<PostTitle>{summary.preview.title}</PostTitle>
									<PostText clamp className="text-[15px] text-muted-foreground">
										{summary.preview.text}
									</PostText>
									{!n.published && !summary.canPublish && (
										<p
											className="m-0 text-sm text-muted-foreground"
											id={`publication-empty-${n.id}`}
										>
											Sin tutores verificados en esta audiencia. Edita el
											borrador o revisa los vínculos de tutores antes de
											publicar.
										</p>
									)}
								</PostBody>
								<PostFooter>
									<TutorList
										names={summary.recipients}
										published={n.published}
									/>
									{!n.published && (
										<PostActions>
											<Button
												size="sm"
												className="whitespace-nowrap"
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
											</Button>
											<Button
												size="sm"
												variant="primary"
												className="whitespace-nowrap"
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
											</Button>
										</PostActions>
									)}
								</PostFooter>
							</PostCard>
						);
					})}
				</div>
			)}
		</section>
	);
}
