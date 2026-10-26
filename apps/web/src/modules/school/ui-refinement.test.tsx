// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunicationsView } from "./communications-view";
import { initialState } from "./workflows";

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
	expect(html).toContain('<details class="publication-recipients">');
	expect(html).toMatch(/<summary>1 tutor verificado · previstos<\/summary>/);
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
