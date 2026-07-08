import type { ReactElement } from 'react';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';

const noop = (): void => undefined;

describe('SettingsOverlay — visibilidad', () => {
  it('visible=false: no renderiza (retorna null)', () => {
    const element = SettingsOverlay({ visible: false, onClose: noop });
    expect(element).toBeNull();
  });

  it('visible=true: renderiza el overlay de ajustes', () => {
    const element = SettingsOverlay({ visible: true, onClose: noop });
    expect(element).not.toBeNull();
    expect(element?.props['data-testid']).toBe('settings-overlay');
  });
});

describe('SettingsOverlay — contenido de placeholders', () => {
  it('muestra "Próximamente" en las secciones de Idioma y Audio', () => {
    const element = SettingsOverlay({ visible: true, onClose: noop });
    const rendered = JSON.stringify(element);
    expect(rendered).toContain('Idioma');
    expect(rendered).toContain('Audio');
    expect((rendered.match(/Próximamente/g) ?? []).length).toBe(2);
  });

  it('el botón "Volver" invoca exactamente onClose', () => {
    const onClose = jest.fn();
    const element = SettingsOverlay({ visible: true, onClose });
    const children = element?.props.children as ReactElement[];
    const closeButton = children.find((child) => child?.type === 'button');
    expect(closeButton?.props.onClick).toBe(onClose);
  });
});
