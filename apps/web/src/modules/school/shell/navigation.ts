import type { IconName } from "../../../components/ui/icon";

export type SchoolPage =
	| "Inicio"
	| "Alumnos"
	| "Personal"
	| "Grupos"
	| "Ciclos y calendario"
	| EvaluationPage
	| "Comunicados"
	| "Conducta"
	| "Configuración"
	| "Terminales";
export const evaluationPages = [
	"Avance del periodo",
	"Alumnos en riesgo",
	"Resultados",
] as const;
export type EvaluationPage = (typeof evaluationPages)[number];
export const isEvaluationPage = (page: SchoolPage): page is EvaluationPage =>
	(evaluationPages as readonly string[]).includes(page);

type NavigationSection = {
	label: string;
	icon: IconName;
	description: string;
	pages: SchoolPage[];
};

export const schoolNavigation: NavigationSection[] = [
	{ label: "Inicio", icon: "home", description: "", pages: ["Inicio"] },
	{
		label: "Comunidad escolar",
		icon: "users",
		description: "Expedientes y personas que forman tu comunidad.",
		pages: ["Alumnos", "Personal"],
	},
	{
		label: "Gestión académica",
		icon: "layers",
		description:
			"Organiza los grupos, las materias y los horarios de cada ciclo.",
		pages: ["Grupos", "Ciclos y calendario"],
	},
	{
		label: "Evaluación",
		icon: "book",
		description: "Consulta, captura y revisa las calificaciones de cada grupo.",
		pages: [...evaluationPages],
	},
	{
		label: "Vida escolar",
		icon: "heart",
		description: "Comunicación y acompañamiento de la comunidad.",
		pages: ["Comunicados", "Conducta"],
	},
	{
		label: "Administración",
		icon: "settings",
		description: "Datos de la institución, terminales y herramientas locales.",
		pages: ["Configuración", "Terminales"],
	},
];

export function sectionFor(page: SchoolPage): NavigationSection {
	const section = schoolNavigation.find((item) => item.pages.includes(page));
	if (!section) throw new Error(`Página escolar sin sección: ${page}`);
	return section;
}
