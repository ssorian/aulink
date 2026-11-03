import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Icon, type IconName } from "./icon";

export function EmptyState({
	title = "Sin registros",
	text,
	icon = "book",
	action,
	className,
}: {
	title?: string;
	text: string;
	icon?: IconName;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<section
			data-slot="empty-state"
			className={cn(
				"my-6 rounded-xl border border-dashed border-input px-6 py-12 text-center",
				className,
			)}
		>
			<span className="mx-auto mb-4 grid size-10 place-items-center rounded-lg bg-teal-bg text-teal-ink">
				<Icon name={icon} />
			</span>
			<h2 className="m-0 text-lg font-semibold">{title}</h2>
			<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
				{text}
			</p>
			{action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
		</section>
	);
}
