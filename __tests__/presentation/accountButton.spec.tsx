import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { translate, type TranslateParams } from '../../src/presentation/i18n/i18n';
import { AccountButton } from '../../src/presentation/components/AccountButton';

const T = (key: string, params?: TranslateParams): string => translate('es', key, params);

function renderButton(alias: string, onClick = (): void => undefined) {
  return render(
    <I18nProvider initialLang="es">
      <AccountButton alias={alias} onClick={onClick} />
    </I18nProvider>,
  );
}

describe('AccountButton — badge de usuario', () => {
  it('logueado: muestra el alias (contenido) y un aria-label que anuncia esa identidad', () => {
    renderButton('juan');
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('juan');
    // aria-label reemplaza al texto para lectores de pantalla: el alias debe
    // interpolarse en la clave i18n para que el "quién" también se anuncie.
    expect(btn).toHaveAttribute('aria-label', T('account.ariaLoggedIn', { alias: 'juan' }));
    expect(btn.getAttribute('aria-label')).toContain('juan');
  });

  it('el alias es CONTENIDO, no una clave i18n (no se traduce)', () => {
    renderButton('José.M');
    expect(screen.getByRole('button')).toHaveTextContent('José.M');
  });

  it('deslogueado (alias vacío): muestra el label i18n y sin aria-label de sesión', () => {
    renderButton('');
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent(T('account.button'));
    expect(btn).not.toHaveAttribute('aria-label');
  });

  it('MIGRACIÓN: token presente pero sin email (alias vacío) → label genérico, sin crash', () => {
    expect(() => renderButton('')).not.toThrow();
    expect(screen.getByRole('button')).toHaveTextContent(T('account.button'));
  });

  it('dispara onClick al pulsarlo', () => {
    const onClick = jest.fn();
    renderButton('juan', onClick);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
