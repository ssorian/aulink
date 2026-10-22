import { describe, expect, test } from 'bun:test';
import { readerReducer, revealDiameter, demoScanResult } from '../apps/mobile/src/modules/reader/state';

describe('lector de asistencia demo', () => {
  test('solo procesa una lectura por sesión de cámara', () => {
    const scanning = readerReducer('idle', { type: 'scan' });
    expect(scanning).toBe('scanning');
    const result = readerReducer(scanning, { type: 'result', success: true });
    expect(result).toBe('success');
    expect(readerReducer(result, { type: 'result', success: false })).toBe('success');
  });
  test('permite error, reintento, cancelar y omitir sin registrar', () => {
    expect(readerReducer('scanning', { type: 'result', success: false })).toBe('error');
    expect(readerReducer('error', { type: 'scan' })).toBe('scanning');
    expect(readerReducer('scanning', { type: 'reset' })).toBe('idle');
    expect(readerReducer('error', { type: 'reset' })).toBe('idle');
    expect(readerReducer('idle', { type: 'result', success: true })).toBe('idle');
  });
  test('solo el QR de prueba da éxito; no acepta credenciales reales ni URLs', () => {
    expect(demoScanResult('aulink:asistencia:demo')).toBe(true);
    for (const data of ['', 'https://example.com', 'alumno-123', 'aulink:asistencia:demo-extra']) {
      expect(demoScanResult(data)).toBe(false);
    }
  });
  test('el círculo central cubre las esquinas en teléfono, tablet y paisaje', () => {
    for (const [width, height] of [[390, 844], [768, 1024], [844, 390]]) {
      expect(revealDiameter(width, height) / 2).toBeGreaterThanOrEqual(Math.hypot(width / 2, height / 2));
    }
  });
});
