import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

/** Native <dialog>: showModal() when `open`, Escape and backdrop-less close go through `onClose`. */
export function Dialog({
	open,
	onClose,
	title,
	children,
	className,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);
	return (
		<dialog
			ref={ref}
			data-slot="dialog"
			data-state={open ? "open" : "closed"}
			aria-labelledby={titleId}
			onClose={onClose}
			className={cn(
				"fixed m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-foreground/40",
				className,
			)}
		>
			<header className="mb-4 flex items-center justify-between gap-3">
				<h2 id={titleId} className="m-0 text-xl font-semibold tracking-tight">
					{title}
				</h2>
				<button
					type="button"
					aria-label="Cerrar"
					onClick={onClose}
					className="inline-grid size-11 min-h-11 place-items-center rounded-lg border-0 bg-transparent p-0 text-muted-foreground hover:bg-muted"
				>
					<Icon name="close" size={18} />
				</button>
			</header>
			{children}
		</dialog>
	);
}
