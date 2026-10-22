import { describe, expect, test } from 'bun:test';
import { attendanceIndicators, attendanceState } from '../apps/mobile/src/modules/family/attendance';

describe('estado de asistencia para tutores', () => {
  test('muestra salida pendiente solo después de una entrada real', () => {
    expect(attendanceIndicators({ date: '2026-10-22', entry: '07:02' })).toEqual({ primary: 'Entrada registrada · 07:02 h', pendingExit: 'Salida aún no registrada' });
    expect(attendanceIndicators({ date: '2026-10-22', entry: '07:20', late: true }).pendingExit).toBe('Salida aún no registrada');
    expect(attendanceIndicators({ date: '2026-10-22', entry: '07:02', exit: '13:30' })).toEqual({ primary: 'Salida registrada · 13:30 h', pendingExit: undefined });
    for (const record of [{}, { absent: true }, { excused: true }, { noClasses: true }]) {
      expect(attendanceIndicators({ date: '2026-10-22', ...record })).toEqual({ primary: undefined, pendingExit: undefined });
    }
  });
  test('no confunde un registro pendiente con una falta confirmada', () => {
    expect(attendanceState({ date: '2026-10-22' })).toBe('pending');
    expect(attendanceState({ date: '2026-10-22', absent: true })).toBe('absent');
  });
  test('prioriza los registros de entrada y salida', () => {
    expect(attendanceState({ date: '2026-10-22', entry: '07:02' })).toBe('present');
    expect(attendanceState({ date: '2026-10-22', entry: '07:20', late: true })).toBe('late');
    expect(attendanceState({ date: '2026-10-22', entry: '07:20', late: true, exit: '13:30' })).toBe('finished');
  });
  test('explica jornadas sin clases y faltas justificadas', () => {
    expect(attendanceState({ date: '2026-10-22', noClasses: true })).toBe('noClasses');
    expect(attendanceState({ date: '2026-10-22', absent: true, excused: true })).toBe('excused');
  });
});
