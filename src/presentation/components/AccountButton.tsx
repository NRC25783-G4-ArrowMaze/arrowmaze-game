import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

/** Props del botón de cuenta del header. */
export interface AccountButtonProps {
  /**
   * Alias del usuario logueado (derivado del email, CONTENIDO — no se traduce).
   * Cadena vacía = deslogueado o sesión sin email (migración): el botón cae al
   * label i18n genérico. El fallback lo decide el render, no `aliasFromEmail`.
   */
  alias: string;
  onClick: () => void;
}

/**
 * AccountButton — Botón "Cuenta" del header. Logueado muestra el alias del
 * usuario (identidad de la sesión) y anuncia esa identidad también por
 * aria-label: como aria-label reemplaza al texto visible para los lectores de
 * pantalla, el alias se interpola en la clave i18n para que el "quién" no se
 * pierda. Deslogueado muestra el label traducido y sin aria extra (el texto ya
 * nombra la acción). El alias NO se traduce; es dato del usuario.
 */
export const AccountButton: React.FC<AccountButtonProps> = ({ alias, onClick }) => {
  const { t } = useTranslation();
  const loggedIn = alias.length > 0;

  return (
    <button
      onClick={onClick}
      aria-label={loggedIn ? t('account.ariaLoggedIn', { alias }) : undefined}
    >
      {loggedIn ? alias : t('account.button')}
    </button>
  );
};
