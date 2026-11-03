import type { previewCSV, State } from "./workflows";
export type Field = {
	key: string;
	label: string;
	options?: { value: string; label: string }[];
	type?: string;
	optional?: boolean;
	rows?: number;
	validate?: (
		value: string,
		values: Record<string, string>,
	) => string | undefined;
};
export type ViewProps = {
	s: State;
	open: (
		kind: string,
		title: string,
		fields: Field[],
		values?: Record<string, string>,
		preview?: string[],
		description?: string,
	) => void;
	students: Field;
	groups: Field;
	studentName: (id: string) => string;
	groupName: (id: string | undefined) => string;
	query: string;
	setQuery: (value: string) => void;
	groupFilter: string;
	setGroupFilter: (value: string) => void;
	profile: string;
	setProfile: (value: string) => void;
	selected: State["students"][number] | undefined;
	date: string;
	setDate: (value: string) => void;
	csv: string;
	setCSV: (value: string) => void;
	csvPreview: boolean;
	setCSVPreview: (value: boolean) => void;
	rows: ReturnType<typeof previewCSV>;
	visible: State["students"];
	addStudent: () => void;
};
