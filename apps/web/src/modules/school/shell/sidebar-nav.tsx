import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import { cn } from "../../../lib/utils";
import { type SchoolPage, schoolNavigation, sectionFor } from "./navigation";

/** One icon tone per section, recurring down the sidebar (all >= 3:1 on the sidebar fill). */
const sectionIconTone = [
	"text-sky",
	"text-lilac",
	"text-mustard",
	"text-peach",
	"text-lemon",
	"text-[#7fc0d2]",
	"text-[#d9938f]",
	"text-[#c9a493]",
];

/** Full-bleed nav rows; on narrow screens the rows become chips in a horizontal scroller. */
const itemClass =
	"w-full justify-start gap-3 rounded-none border-0 px-6 py-3 text-left text-[13px] font-semibold whitespace-nowrap text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-sky max-[1150px]:px-4 max-[760px]:w-auto max-[760px]:shrink-0 max-[760px]:snap-start max-[760px]:gap-[7px] max-[760px]:rounded-[9px] max-[760px]:px-3 max-[760px]:py-2 max-[760px]:text-xs aria-[current=page]:bg-sidebar-active aria-[current=page]:font-bold aria-[current=page]:text-sidebar-foreground aria-[current=page]:hover:bg-sidebar-active";

const pageClass =
	"pl-14 font-medium max-[1150px]:pl-12 max-[760px]:bg-sidebar-hover max-[760px]:pl-3 aria-[current=page]:font-bold max-[760px]:aria-[current=page]:bg-sidebar-active";

function NavIcon({
	name,
	tone,
}: {
	name: Parameters<typeof Icon>[0]["name"];
	tone: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 max-[760px]:[&>svg]:size-[18px] group-aria-[current=page]:text-sidebar-foreground",
				tone,
			)}
		>
			<Icon name={name} size={20} />
		</span>
	);
}

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
		<nav
			data-slot="sidebar-nav"
			aria-label="Administración escolar"
			className="flex flex-col gap-0.5 max-[760px]:snap-x max-[760px]:snap-proximity max-[760px]:flex-row max-[760px]:gap-[5px] max-[760px]:overflow-x-auto max-[760px]:px-2 max-[760px]:pb-2.5 max-[760px]:pt-1 max-w-full scroll-px-2"
		>
			{schoolNavigation.map((item, index) => {
				const active = current === item;
				const tone = sectionIconTone[index % sectionIconTone.length];
				if (item.pages.length === 1)
					return (
						<div
							data-slot="nav-section"
							className="max-[760px]:contents"
							key={item.label}
						>
							<Button
								variant="ghost"
								className={cn("group", itemClass)}
								aria-current={active ? "page" : undefined}
								onClick={() => onNavigate(item.pages[0])}
							>
								<NavIcon name={item.icon} tone={tone} />
								{item.label}
							</Button>
						</div>
					);
				const open = expanded.includes(item.label);
				const id = `nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
				return (
					<div
						data-slot="nav-section"
						className="max-[760px]:contents"
						key={item.label}
						data-active={active || undefined}
					>
						<Button
							variant="ghost"
							className={cn(
								"group",
								itemClass,
								active && "text-sidebar-foreground",
							)}
							aria-expanded={open}
							aria-controls={id}
							onClick={() => toggle(item.label)}
						>
							<NavIcon name={item.icon} tone={tone} />
							{item.label}
							<span
								className={cn(
									"ml-auto inline-flex text-sidebar-muted transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none group-aria-expanded:rotate-180",
								)}
							>
								<Icon name="down" size={16} />
							</span>
						</Button>
						<ul
							data-slot="nav-pages"
							id={id}
							className="m-0 mt-0.5 flex list-none flex-col gap-0.5 p-0 max-[760px]:contents"
							hidden={!open}
						>
							{item.pages.map((p) => (
								<li key={p} className="max-[760px]:contents">
									<Button
										variant="ghost"
										className={cn(itemClass, pageClass)}
										aria-current={page === p ? "page" : undefined}
										onClick={() => onNavigate(p)}
									>
										{p}
									</Button>
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</nav>
	);
}
