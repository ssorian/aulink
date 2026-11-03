import type { State } from "../shared/workflows";
import type { Occurrence } from "./schedule-helpers";

export type Slot = State["schedules"][number];
export type PanelMode = "view" | "cancel" | "move" | "staff" | "restore";
export type PanelState =
	| {
			kind: "occurrence";
			item: Occurrence;
			key: string;
			anchor: HTMLElement;
			mode: PanelMode;
			draft?: { date: string; start: string; end: string };
	  }
	| { kind: "slot"; slot: Slot; key: string; anchor: HTMLElement };
export type ToastState = {
	text: string;
	undo?: { kind: string; data: Record<string, string> };
};
