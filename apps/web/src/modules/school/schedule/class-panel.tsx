import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/ui/icon";

/**
 * Floating panel anchored to a class block. It keeps focus inside, follows the
 * block while the page or grid scrolls, and closes on Escape or an outside click.
 */
export function ClassPanel({
	anchor,
	title,
	children,
	onClose,
}: {
	anchor: HTMLElement;
	title: string;
	children: ReactNode;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
	useLayoutEffect(() => {
		const panel = ref.current;
		if (!panel) return;
		const place = () => {
			const box = anchor.getBoundingClientRect();
			const width = panel.offsetWidth;
			const right = box.right + 8;
			const left =
				right + width <= window.innerWidth - 8
					? right
					: Math.max(8, box.left - width - 8);
			const top = Math.min(
				Math.max(8, box.top),
				window.innerHeight - panel.offsetHeight - 8,
			);
			setPosition({ top: Math.max(8, top), left, ready: true });
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(panel);
		document.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			observer.disconnect();
			document.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [anchor]);
	useEffect(() => {
		const panel = ref.current;
		(
			panel?.querySelector<HTMLElement>("[data-autofocus]") ||
			panel?.querySelector<HTMLElement>(
				'[data-slot="schedule-panel-body"] button',
			)
		)?.focus();
	}, []);
	useEffect(() => {
		const close = (event: Event) => {
			const node = event.target as Node | null;
			if (node && (ref.current?.contains(node) || anchor.contains(node)))
				return;
			if (node instanceof Element && node.closest("dialog, .flow-dialog"))
				return;
			onClose();
		};
		const onEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape" || document.querySelector("dialog[open]"))
				return;
			event.preventDefault();
			anchor.focus();
			onClose();
		};
		document.addEventListener("pointerdown", close);
		document.addEventListener("keydown", onEscape);
		return () => {
			document.removeEventListener("pointerdown", close);
			document.removeEventListener("keydown", onEscape);
		};
	}, [anchor, onClose]);
	function keep(e: KeyboardEvent<HTMLDivElement>) {
		if (e.key !== "Tab") return;
		const focusable = [
			...(ref.current?.querySelectorAll<HTMLElement>(
				"button:not(:disabled), input, select, textarea",
			) || []),
		];
		const first = focusable[0];
		const last = focusable.at(-1);
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last?.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first?.focus();
		}
	}
	return (
		<div
			ref={ref}
			data-slot="schedule-panel"
			role="dialog"
			aria-label={title}
			onKeyDown={keep}
			className="fixed z-[100] max-h-[calc(100vh-16px)] w-80 overflow-auto rounded-[14px] bg-card px-[18px] pt-4 pb-[18px] shadow-[0_18px_40px_-12px_rgb(31_45_54/0.32),0_2px_6px_rgb(31_45_54/0.08)]"
			style={{
				top: position.top,
				left: position.left,
				visibility: position.ready ? "visible" : "hidden",
			}}
		>
			<header className="flex items-start justify-between gap-2">
				<h3 className="mt-1.5 mb-1 text-[17px] font-[650]">{title}</h3>
				<Button
					variant="icon"
					className="-my-1 -mr-2.5 text-muted-foreground"
					aria-label="Cerrar"
					onClick={() => {
						anchor.focus();
						onClose();
					}}
				>
					<Icon name="close" size={16} />
				</Button>
			</header>
			{children}
		</div>
	);
}
