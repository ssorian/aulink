import type { ReactNode } from "react";

export function DataTable({
	caption,
	children,
}: {
	caption: string;
	children: ReactNode;
}) {
	return (
		<>
			<p className="ui-table-scroll-hint">
				Desliza para ver todas las columnas
			</p>
			<section
				className="ui-table-scroll"
				aria-label={caption}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll wide tables.
				tabIndex={0}
			>
				<table className="ui-data-table">
					<caption>{caption}</caption>
					{children}
				</table>
			</section>
		</>
	);
}

export function EmptyTableRow({
	columns,
	children,
}: {
	columns: number;
	children: ReactNode;
}) {
	return (
		<tr>
			<td colSpan={columns} className="ui-table-empty">
				{children}
			</td>
		</tr>
	);
}
