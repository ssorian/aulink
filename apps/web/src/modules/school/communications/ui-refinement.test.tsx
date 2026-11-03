// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState } from "../shared/workflows";
import { CommunicationsView } from "./communications-view";

test("recipient lists start collapsed and expose their verified count in the summary", () => {
	const s = initialState();
	s.notices = [
		{
			id: "notice",
			title: "Reunión",
			text: "Mañana",
			audience: "group",
			target: "g1",
			published: false,
			recipients: [],
		},
	];
	const html = renderToStaticMarkup(
		<CommunicationsView s={s} open={() => {}} />,
	);
	expect(html).toContain('<details data-slot="post-details"');
	expect(html).not.toContain("<details open");
	expect(html).toMatch(
		/<summary[^>]*>[\s\S]*1 tutor verificado · previstos[\s\S]*<\/summary>/,
	);
	expect(html).toContain("Mariana Ruiz Salcedo");
	expect(html).toContain("Revisar publicación");
});

test("a draft with no verified tutors keeps its publication safeguard", () => {
	const s = initialState();
	s.notices = [
		{
			id: "empty",
			title: "Reunión",
			text: "Mañana",
			audience: "group",
			target: "g2",
			published: false,
			recipients: [],
		},
	];
	const html = renderToStaticMarkup(
		<CommunicationsView s={s} open={() => {}} />,
	);
	expect(html).toContain("0 tutores verificados · previstos");
	expect(html).toContain("Sin tutores verificados en esta audiencia");
	expect(html).toMatch(
		/disabled="" aria-describedby="publication-empty-empty"/,
	);
});

function sampleNotices() {
	const s = initialState();
	s.notices = [
		{
			id: "draft",
			title: "Reunión",
			text: "Mañana",
			audience: "group",
			target: "g1",
			published: false,
			recipients: [],
		},
		{
			id: "empty",
			title: "Sin destinatarios",
			text: "Prueba",
			audience: "group",
			target: "g2",
			published: false,
			recipients: [],
		},
		{
			id: "sent",
			title: "Materiales",
			text: "Traer colores",
			audience: "school",
			target: "",
			published: true,
			recipients: ["Mariana Ruiz Salcedo", "Otro Tutor"],
		},
	];
	return s;
}
test("communications follow the minimal layout: heading action, stats card, filters, one list card", () => {
	const html = renderToStaticMarkup(
		<CommunicationsView s={sampleNotices()} open={() => {}} />,
	);
	expect(html).not.toContain('class="panel"');
	expect(html).not.toContain('class="publication-status"');
	const stats = html.indexOf('aria-label="Resumen de comunicados"');
	const filters = html.indexOf('data-slot="post-filters"');
	const list = html.indexOf('data-slot="post-list"');
	expect(stats).toBeGreaterThan(-1);
	expect(stats).toBeLessThan(filters);
	expect(filters).toBeLessThan(list);
	expect(html).toMatch(
		/data-slot="stat"[^>]*data-state="draft"[^>]*><dt[^>]*>Borradores<\/dt><dd[^>]*><strong[^>]*>2</,
	);
	expect(html).toMatch(
		/data-slot="stat"[^>]*data-state="published"[^>]*><dt[^>]*>Publicados<\/dt><dd[^>]*><strong[^>]*>1</,
	);
	expect(html).toMatch(
		/data-slot="stat"[^>]*data-state="reached"[^>]*><dt[^>]*>Tutores alcanzados<\/dt><dd[^>]*><strong[^>]*>2</,
	);
	expect(html).toMatch(
		/data-slot="stat"[^>]*data-state="blocked"[^>]*><dt[^>]*>Sin destinatarios<\/dt><dd[^>]*><strong[^>]*>1</,
	);
	expect(html).toMatch(/aria-pressed="true"[^>]*>Todos</);
	expect(html).toContain('id="notices-audience"');
	expect((html.match(/data-slot="post-card"/g) || []).length).toBe(3);
	expect(html).toMatch(
		/data-slot="badge"[^>]*data-state="draft"[^>]*>(<span[^>]*><\/span>)?Borrador</,
	);
});
test("drafts with no tutors are listed first so they are fixed before publishing", () => {
	const html = renderToStaticMarkup(
		<CommunicationsView s={sampleNotices()} open={() => {}} />,
	);
	expect(html.indexOf("Sin destinatarios</h3>")).toBeLessThan(
		html.indexOf("Reunión</h3>"),
	);
	expect(html.indexOf("Reunión</h3>")).toBeLessThan(
		html.indexOf("Materiales</h3>"),
	);
});
test("an empty school explains the first step inside the list card", () => {
	const s = initialState();
	s.notices = [];
	const html = renderToStaticMarkup(
		<CommunicationsView s={s} open={() => {}} />,
	);
	expect(html).toMatch(
		/data-slot="notices-empty"[\s\S]*Tu primer comunicado empieza como borrador/,
	);
});

test("each notice reads like a post: audience avatar, title, excerpt and a footer", () => {
	const html = renderToStaticMarkup(
		<CommunicationsView s={sampleNotices()} open={() => {}} />,
	);
	const card = html.slice(html.indexOf('data-notice="sent"'));
	expect(card).toMatch(/data-slot="post-marker"[^>]*>IA</);
	expect(card).toMatch(/data-slot="post-author"[^>]*>Toda la escuela</);
	expect(card).toMatch(/<h3[^>]*>Materiales<\/h3>/);
	expect(card).toContain('data-slot="post-text"');
	expect(card).toContain('data-slot="post-footer"');
	expect(html).toMatch(
		/data-notice="draft"[\s\S]*?data-slot="post-marker"[^>]*>1A</,
	);
});
test("tutors show as an avatar stack and expand into a grid of people", () => {
	const s = sampleNotices();
	s.notices[2].recipients = [
		"Ana Uno",
		"Bea Dos",
		"Ceci Tres",
		"Dani Cuatro",
		"Eva Cinco",
		"Flor Seis",
		"Gina Siete",
	];
	const html = renderToStaticMarkup(
		<CommunicationsView s={s} open={() => {}} />,
	);
	const card = html.slice(html.indexOf('data-notice="sent"'));
	const stack =
		card.match(/<span data-slot="avatar-stack"[\s\S]*?<\/summary>/)?.[0] || "";
	expect((stack.match(/data-slot="avatar"/g) || []).length).toBe(4);
	expect(stack).toMatch(/data-slot="avatar-overflow"[^>]*>\+3</);
	expect(card).toContain('data-slot="post-people"');
	expect((card.match(/data-slot="post-person"/g) || []).length).toBe(7);
	expect(card).toMatch(
		/data-slot="post-person"[^>]*><span data-slot="avatar"[^>]*>GS<\/span>Gina Siete<\/li>/,
	);
});
