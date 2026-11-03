export const profileTabs = [
	"Resumen",
	"Asistencia",
	"Calificaciones",
	"Conducta",
] as const;
export type ProfileTab = (typeof profileTabs)[number];
