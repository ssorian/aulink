import { describe, expect, test } from 'bun:test';
import { createRequire } from 'node:module';
import { useHydrated } from '../apps/mobile/src/hooks/use-hydrated';

const requireMobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const { createElement } = requireMobile('react');
const { renderToStaticMarkup } = requireMobile('react-dom/server');

describe('hidratación de controles móviles en web', () => {
  test('SSR no habilita acciones antes de que React pueda recibirlas', () => {
    function Control() {
      return createElement('button', { disabled: !useHydrated() }, 'Ver alumno');
    }
    expect(renderToStaticMarkup(createElement(Control))).toContain('disabled=""');
  });
  test('el snapshot SSR mantiene el layout dependiente de ventana en reposo', () => {
    function Layout() {
      return createElement('span', null, useHydrated() ? 'cliente' : 'reposo');
    }
    expect(renderToStaticMarkup(createElement(Layout))).toBe('<span>reposo</span>');
  });
});
