import { Icon } from "../../components/ui/icon";
import type { Field } from "./flow-dialog";
import type { State } from "./workflows";
export const field = (key: string, label: string, type?: string): Field => ({
	key,
	label,
	type,
});
export const options = (
	key: string,
	label: string,
	values: { id: string; name: string }[],
): Field => ({
	key,
	label,
	options: values.map((x) => ({ value: x.id, label: x.name })),
});
export const reason = field("reason", "Motivo / evidencia", "textarea");
export const roles = [
	"Administración escolar",
	"Control escolar",
	"Docente",
	"Operador de terminal",
].map((name) => ({ id: name, name }));
export function Empty({
	text,
	title = "Sin registros",
}: {
	text: string;
	title?: string;
}) {
	return (
		<section className="empty">
			<span className="task-icon">
				<Icon name="book" />
			</span>
			<h2>{title}</h2>
			<p>{text}</p>
		</section>
	);
}
export function noticeFields(s: State): Field[] {
	return [
		field("title", "Título"),
		field("text", "Contenido", "textarea"),
		options("audience", "Audiencia", [
			{ id: "school", name: "Toda la escuela" },
			{ id: "group", name: "Grupo" },
			{ id: "student", name: "Alumno" },
		]),
		{
			...options("target", "Destino (ignorado para toda la escuela)", [
				...s.groups.map((g) => ({ id: g.id, name: `Grupo: ${g.name}` })),
				...s.students.map((x) => ({ id: x.id, name: `Alumno: ${x.name}` })),
			]),
			optional: true,
		},
	];
}
