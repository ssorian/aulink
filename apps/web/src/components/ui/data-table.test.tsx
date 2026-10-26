// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, EmptyTableRow } from "./data-table";

test("plain tables remain unwrapped by default", () => {
	const html = renderToStaticMarkup(<DataTable caption="Records"><tbody /></DataTable>);
	expect(html).not.toContain("ui-table-card");
	expect(html).toContain('<caption>Records</caption>');
	expect(html).toContain('class="ui-table-scroll"');
});

test("card wraps only the keyboard scroller and supports restoration hooks", () => {
	const html = renderToStaticMarkup(
		<DataTable caption="Records" variant="card" scrollClassName="table-scroll" scrollLabel="Scrollable records">
			<tbody><EmptyTableRow columns={2}>No records</EmptyTableRow></tbody>
		</DataTable>,
	);
	expect(html).toContain('<div class="ui-table-card"><section class="ui-table-scroll table-scroll"');
	expect(html).toContain('aria-label="Scrollable records"');
	expect(html).toContain('tabindex="0"');
	expect(html).toContain('<caption>Records</caption>');
	expect(html).toContain('<td colSpan="2" class="ui-table-empty">No records</td>');
	expect(html.indexOf("Desliza")).toBeLessThan(html.indexOf('class="ui-table-card"'));
});
