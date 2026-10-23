import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { Icon } from "../apps/web/src/components/ui/icon";

const requireWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createElement } = requireWeb("react");
const { renderToStaticMarkup } = requireWeb("react-dom/server");

test("icons are decorative, non-focusable and consistently sized", () => {
	const html = renderToStaticMarkup(createElement(Icon, { name: "users", size: 18 }));
	expect(html).toContain('aria-hidden="true"');
	expect(html).toContain('focusable="false"');
	expect(html).toContain('class="ui-icon"');
	expect(html).toContain('width="18"');
	expect(html).toContain('height="18"');
});

test("new navigation and action icons use distinct recognizable paths", () => {
	const icons = ["home", "monitor", "upload", "edit", "send"].map(name =>
		renderToStaticMarkup(createElement(Icon, { name })),
	);
	expect(new Set(icons).size).toBe(icons.length);
});
