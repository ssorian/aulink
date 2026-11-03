export type Section =
	| "overview"
	| "students"
	| "groups"
	| "attendance"
	| "credentials"
	| "communications"
	| "conduct"
	| "grades"
	| "staff"
	| "settings";
export const navigation: {
	id: Section;
	label: string;
	icon: string;
	category?: string;
}[] = [
	{ id: "overview", label: "Resumen", icon: "grid", category: "PRINCIPAL" },
	{ id: "students", label: "Alumnos", icon: "users" },
	{ id: "groups", label: "Grupos y ciclos", icon: "layers" },
	{ id: "attendance", label: "Asistencia", icon: "check" },
	{ id: "credentials", label: "Credenciales", icon: "card" },
	{
		id: "communications",
		label: "Comunicados",
		icon: "message",
		category: "VIDA ESCOLAR",
	},
	{ id: "conduct", label: "Conducta", icon: "heart" },
	{ id: "grades", label: "Calificaciones", icon: "book" },
	{ id: "staff", label: "Personal", icon: "user", category: "ADMINISTRACIÓN" },
	{ id: "settings", label: "Configuración", icon: "settings" },
];
export type Student = {
	id: string;
	name: string;
	group: string;
	guardian: string;
	time: string;
	status: string;
	color: string;
};
export const students: Student[] = [
	{
		id: "AL-001",
		name: "Sofía Hernández",
		group: "1° A",
		guardian: "Mariana Hernández",
		time: "06:52",
		status: "Presente",
		color: "rose",
	},
	{
		id: "AL-002",
		name: "Mateo García",
		group: "2° B",
		guardian: "Roberto García",
		time: "06:54",
		status: "Presente",
		color: "blue",
	},
	{
		id: "AL-003",
		name: "Valentina López",
		group: "3° A",
		guardian: "Elena López",
		time: "06:58",
		status: "Presente",
		color: "purple",
	},
	{
		id: "AL-004",
		name: "Santiago Martínez",
		group: "1° A",
		guardian: "Diego Martínez",
		time: "07:12",
		status: "Retardo",
		color: "sand",
	},
	{
		id: "AL-005",
		name: "Camila Rodríguez",
		group: "2° B",
		guardian: "Lucía Rodríguez",
		time: "07:02",
		status: "Presente",
		color: "green",
	},
	{
		id: "AL-006",
		name: "Sebastián Pérez",
		group: "3° A",
		guardian: "Daniel Pérez",
		time: "—",
		status: "Sin registro",
		color: "blue",
	},
];
const normalize = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
export function filterStudents(list: Student[], query: string, group: string) {
	const search = normalize(query);
	return list.filter(
		(student) =>
			(group === "Todos" || student.group === group) &&
			normalize(`${student.name} ${student.id} ${student.guardian}`).includes(
				search,
			),
	);
}
export const announcements = [
	{
		title: "Junta de padres de familia",
		audience: "Toda la escuela",
		date: "21 oct · 08:00 h",
		text: "Un espacio para compartir los avances del primer periodo y los próximos proyectos de nuestra comunidad.",
		tag: "Próximo evento",
		color: "green",
	},
	{
		title: "Entrega de proyectos de ciencias",
		audience: "3° A y 3° B",
		date: "23 oct · 10:00 h",
		text: "Consulta las indicaciones para la exposición de proyectos y los materiales necesarios.",
		tag: "Académico",
		color: "blue",
	},
	{
		title: "Suspensión de actividades",
		audience: "Toda la escuela",
		date: "30 oct",
		text: "Recordatorio de suspensión de clases por Consejo Técnico Escolar.",
		tag: "Calendario",
		color: "sand",
	},
];
