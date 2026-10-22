import type { AttendanceRecord } from './attendance';
import type { GradeSubject } from './grades';

// Synthetic fixtures: never presented as live school information.
export const demoDate = '2026-10-22';
export type Child = { id: string; name: string; initials: string; group: string; color: string; today: AttendanceRecord };
export const children: Child[] = [
  { id: 'sofia', name: 'Sofía Hernández', initials: 'SH', group: '3.º A · Primaria', color: '#D9C7FA', today: { date: demoDate, entry: '07:02' } },
  { id: 'mateo', name: 'Mateo Hernández', initials: 'MH', group: '1.º B · Primaria', color: '#D9EDB0', today: { date: demoDate, entry: '06:58', exit: '12:30' } },
  { id: 'lucia', name: 'Lucía Hernández', initials: 'LH', group: '2.º A · Secundaria', color: '#F5D998', today: { date: demoDate, absent: true } },
];

export function historyFor(child: Child): AttendanceRecord[] {
  return [
    child.today,
    { date: '2026-10-21', entry: '07:01', exit: '13:30' },
    { date: '2026-10-20', entry: '07:18', late: true, exit: '13:32' },
    { date: '2026-10-19', absent: true, excused: true },
    { date: '2026-10-16', noClasses: true },
    { date: '2026-10-15', entry: '06:59', exit: '13:31' },
  ];
}

function results(first: number, second: number, third?: number, thirdPublished = true): GradeSubject['evaluations'] {
  return {
    'evaluation-1': { value: first, published: true },
    'evaluation-2': { value: second, published: true },
    ...(third === undefined ? {} : { 'evaluation-3': { value: third, published: thirdPublished } }),
  };
}

export const grades: Record<string, GradeSubject[]> = {
  sofia: [
    { subject: 'Español', evaluations: results(9.5, 9, 10) },
    { subject: 'Matemáticas', evaluations: results(9, 9.5, 8.5) },
    { subject: 'Ciencias naturales', evaluations: results(10, 9.5, 10) },
    { subject: 'Historia', evaluations: results(9.2, 9.4) },
    { subject: 'Educación física', evaluations: results(10, 10, 10) },
  ],
  mateo: [],
  lucia: [
    { subject: 'Español', evaluations: results(9, 9.5, 8, false) },
    { subject: 'Matemáticas', evaluations: results(8.5, 9, 7.5, false) },
    { subject: 'Biología', evaluations: results(9.5, 10, 9, false) },
    { subject: 'Inglés', evaluations: results(9, 9, 8.5, false) },
  ],
};

export const notices = [
  { id: 'reunion', title: 'Junta de familias', category: 'Comunidad', date: '22 oct', audience: 'Todas las familias', children: ['sofia', 'mateo', 'lucia'], body: 'Les esperamos el viernes 23 de octubre a las 08:00 h en el salón de su grupo. Conversaremos sobre los avances del primer periodo y los próximos proyectos.\n\nSu participación nos ayuda a acompañar mejor a cada estudiante.' },
  { id: 'ciencias', title: 'Proyecto de ciencias', category: 'Académico', date: '21 oct', audience: '3.º A · Primaria', children: ['sofia'], body: 'El lunes 26 de octubre compartiremos nuestros proyectos en el salón. Cada estudiante puede llevar una cartulina y materiales reciclados para explicar lo que aprendió.\n\nNo es necesario comprar materiales nuevos.' },
];
