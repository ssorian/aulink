export type ReaderState = 'idle' | 'scanning' | 'success' | 'error';
export type ReaderEvent = { type: 'scan' } | { type: 'reset' } | { type: 'result'; success: boolean };

export function readerReducer(state: ReaderState, event: ReaderEvent): ReaderState {
  if (event.type === 'reset') return 'idle';
  if (event.type === 'scan') return state === 'scanning' ? state : 'scanning';
  if (state !== 'scanning') return state;
  return event.success ? 'success' : 'error';
}

// Development fixture, not credential validation or a real attendance registration.
export function demoScanResult(data: string) {
  return data === 'aulink:asistencia:demo';
}

export function revealDiameter(width: number, height: number) {
  return Math.ceil(Math.hypot(width, height)) + 2;
}
