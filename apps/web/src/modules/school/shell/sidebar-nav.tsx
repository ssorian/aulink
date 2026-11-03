import { useEffect, useState } from "react";
import { Icon } from "../../../components/ui/icon";
import { type SchoolPage, schoolNavigation, sectionFor } from "./navigation";

export function SidebarNav({
	page,
	onNavigate,
}: {
	page: SchoolPage;
	onNavigate: (page: SchoolPage) => void;
}) {
	const current = sectionFor(page);
	const [expanded, setExpanded] = useState<string[]>([current.label]);
	useEffect(() => {
		setExpanded((open) =>
			open.includes(current.label) ? open : [...open, current.label],
		);
	}, [current.label]);
	const toggle = (label: string) =>
		setExpanded((open) =>
			open.includes(label) ? open.filter((x) => x !== label) : [...open, label],
		);
	return (
		<nav aria-label="Administración escolar">
			{schoolNavigation.map((item) => {
				const active = current === item;
				if (item.pages.length === 1)
					return (
						<div className="nav-section" key={item.label}>
							<button
								type="button"
								aria-current={active ? "page" : undefined}
								onClick={() => onNavigate(item.pages[0])}
							>
								<Icon name={item.icon} size={20} />
								{item.label}
							</button>
						</div>
					);
				const open = expanded.includes(item.label);
				const id = `nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
				return (
					<div
						className="nav-section"
						key={item.label}
						data-active={active || undefined}
					>
						<button
							type="button"
							className="nav-toggle"
							aria-expanded={open}
							aria-controls={id}
							onClick={() => toggle(item.label)}
						>
							<Icon name={item.icon} size={20} />
							{item.label}
							<Icon name="down" size={16} />
						</button>
						<ul id={id} className="nav-pages" hidden={!open}>
							{item.pages.map((p) => (
								<li key={p}>
									<button
										type="button"
										aria-current={page === p ? "page" : undefined}
										onClick={() => onNavigate(p)}
									>
										{p}
									</button>
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</nav>
	);
}
