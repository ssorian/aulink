import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";
import type { ToastState } from "./schedule-types";

/** Result of a per-date change, with an undo that adds history instead of deleting it. */
export function ScheduleToast({
	toast,
	onUndo,
	onClose,
}: {
	toast: ToastState;
	onUndo: () => void;
	onClose: () => void;
}) {
	const onDark =
		"focus-visible:outline-sky border-0 text-sidebar-foreground hover:bg-sidebar-hover";
	return (
		<div
			data-slot="schedule-toast"
			className="fixed bottom-6 left-1/2 z-[120] flex max-w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-[14px] bg-sidebar py-2 pr-2 pl-[18px] text-sidebar-foreground shadow-[0_16px_36px_-12px_rgb(31_45_54/0.45)] transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] starting:translate-y-3 starting:opacity-40 motion-reduce:transition-none"
		>
			<p className="m-0 text-sm text-sidebar-foreground">{toast.text}</p>
			{toast.undo && (
				<Button
					className={`rounded-[10px] bg-sidebar-hover px-3.5 font-[650] ${onDark}`}
					onClick={onUndo}
				>
					Deshacer
				</Button>
			)}
			<Button
				variant="icon"
				className={`rounded-[10px] text-sidebar-muted ${onDark}`}
				aria-label="Cerrar aviso"
				onClick={onClose}
			>
				<Icon name="close" size={16} />
			</Button>
		</div>
	);
}
