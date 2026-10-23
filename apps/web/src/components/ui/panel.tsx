import { useId, type ReactNode } from "react";

export function Panel({
	heading,
	description,
	children,
}: {
	heading: string;
	description?: ReactNode;
	children: ReactNode;
}) {
	const headingId = useId();
	return (
		<section className="panel ui-panel" aria-labelledby={headingId}>
			<header className="ui-panel-heading">
				<h2 id={headingId}>{heading}</h2>
				{description && <p>{description}</p>}
			</header>
			{children}
		</section>
	);
}
