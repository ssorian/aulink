export type AttendanceRecord = {
  date: string;
  entry?: string;
  exit?: string;
  late?: boolean;
  absent?: boolean;
  excused?: boolean;
  noClasses?: boolean;
};

export function attendanceState(record: AttendanceRecord) {
  if (record.noClasses) return 'noClasses';
  if (record.exit) return 'finished';
  if (record.entry) return record.late ? 'late' : 'present';
  if (record.excused) return 'excused';
  if (record.absent) return 'absent';
  return 'pending';
}

export const attendanceLabels = {
  present: { title: 'En la\nescuela', label: 'En la escuela', description: 'Su entrada está registrada. Aún no hay registro de salida.', tone: 'green', icon: 'school' },
  finished: { title: 'Fin de\nclases', label: 'Fin de clases', description: 'Su salida de la escuela está registrada.', tone: 'yellow', icon: 'sun' },
  late: { title: 'En la escuela,\ncon retardo', label: 'Retardo', description: 'Su entrada se registró después de la hora de inicio.', tone: 'yellow', icon: 'clock' },
  absent: { title: 'Sin\nasistencia', label: 'Sin asistencia', description: 'La escuela confirmó que no asistió a clases hoy.', tone: 'red', icon: 'absent' },
  pending: { title: 'Sin registro\ntodavía', label: 'Sin registro', description: 'Aún no hay una entrada registrada. Esto no confirma una falta.', tone: 'muted', icon: 'clock' },
  excused: { title: 'Falta\njustificada', label: 'Falta justificada', description: 'La escuela registró una justificación para esta falta.', tone: 'yellow', icon: 'check' },
  noClasses: { title: 'Hoy no\nhay clases', label: 'Sin clases', description: 'No se espera asistencia en esta fecha.', tone: 'muted', icon: 'calendar' },
} as const;

export function attendanceIndicators(record: AttendanceRecord) {
  const state = attendanceState(record);
  return {
    primary: record.exit ? `Salida registrada · ${record.exit} h`
      : record.entry ? `Entrada registrada · ${record.entry} h` : undefined,
    pendingExit: (state === 'present' || state === 'late') ? 'Salida aún no registrada' : undefined,
  };
}

export function formatDay(date: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
}
