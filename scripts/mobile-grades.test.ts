import { describe, expect, test } from 'bun:test';
import { gradeSummary, type GradeSubject } from '../apps/mobile/src/modules/family/grades';

const subject: GradeSubject = {
  subject: 'Español', evaluations: {
    'evaluation-1': { value: 9.5, published: true },
    'evaluation-2': { value: 8.5, published: true },
    'evaluation-3': { value: 10, published: true },
  },
};

describe('calificaciones móviles por evaluación y Total', () => {
  test('filtra una evaluación, no devuelve otra', () => {
    expect(gradeSummary(subject, 'evaluation-2')).toEqual({ value: 8.5, count: 1, expected: 1, partial: false });
  });
  test('Total es el promedio simple redondeado a una decimal', () => {
    expect(gradeSummary(subject, 'total')).toEqual({ value: 9.3, count: 3, expected: 3, partial: false });
  });
  test('no revela borradores ni convierte faltantes en cero', () => {
    const partial: GradeSubject = { subject: 'Historia', evaluations: {
      'evaluation-1': { value: 9, published: true },
      'evaluation-3': { value: 4, published: false },
    } };
    expect(gradeSummary(partial, 'total')).toEqual({ value: 9, count: 1, expected: 3, partial: true });
    expect(gradeSummary(partial, 'evaluation-3').value).toBeNull();
    expect(gradeSummary(partial, 'evaluation-2').value).toBeNull();
  });
  test('un cero publicado es válido; sin publicaciones no hay promedio', () => {
    expect(gradeSummary({ subject: 'Ciencias', evaluations: {
      'evaluation-1': { value: 0, published: true },
      'evaluation-2': { value: 10, published: true },
    } }, 'total').value).toBe(5);
    expect(gradeSummary({ subject: 'Ciencias', evaluations: {} }, 'total')).toEqual({ value: null, count: 0, expected: 3, partial: false });
  });
  test.each([NaN, Infinity, -1, 11])('ignora valores fuera de escala: %s', value => {
    expect(gradeSummary({ subject: 'Ciencias', evaluations: {
      'evaluation-1': { value, published: true },
    } }, 'total').value).toBeNull();
  });
  test('no modifica los datos de origen', () => {
    const original = structuredClone(subject);
    gradeSummary(subject, 'total');
    expect(subject).toEqual(original);
  });
});
