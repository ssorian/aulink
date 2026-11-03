// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SchoolApp, schoolBreadcrumb } from "./school-app";

const html = renderToStaticMarkup(<SchoolApp />);

test("the app frame exposes its landmarks through data-slot hooks", () => {
	expect(html).toMatch(/<a[^>]*data-slot="skip-link"[^>]*href="#main"/);
	expect(html).toContain('data-slot="sidebar"');
	expect(html).toContain('data-slot="school-mark"');
	expect(html).toContain('data-slot="topbar"');
	expect(html).toContain('aria-label="Contexto de consulta"');
	expect(html).toMatch(/<main[^>]*id="main"/);
	expect(html).toMatch(/<h1[^>]*>Inicio<\/h1>/);
	expect(html).toContain(schoolBreadcrumb("Inicio", "Inicio"));
});

test("the frame reuses the Avatar primitive for the school mark and ships no legacy classes", () => {
	expect(html).toMatch(/data-slot="school-mark"[\s\S]*?data-slot="avatar"/);
	expect(html).not.toMatch(
		/class="(?:[^"]* )?(?:sidebar|brand|school-mark|topbar|context-bar|main-shell|page-heading|detail-nav|group-back|feedback|notice|skip-link|home-card|home-tasks?)(?: [^"]*)?"/,
	);
});
