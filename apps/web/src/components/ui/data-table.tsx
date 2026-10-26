import type { ReactNode } from "react";
import "./data-table.css";

export function DataTable({
	caption,
	children,
	variant = "plain",
	scrollClassName,
	scrollLabel,
}: {
	caption: string;
	children: ReactNode;
	variant?: "plain" | "card";
	scrollClassName?: string;
	scrollLabel?: string;
}) {
	const table = (
		<section
			className={["ui-table-scroll", scrollClassName].filter(Boolean).join(" ")}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll wide tables.
			tabIndex={0}
			aria-label={scrollLabel ?? caption}
		>
			<table className="ui-data-table">
				<caption>{caption}</caption>
				{children}
			</table>
		</section>
	);
	return (
		<>
			<p className="ui-table-scroll-hint">
				Desliza para ver todas las columnas
			</p>
			{variant === "card" ? <div className="ui-table-card">{table}</div> : table}
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
