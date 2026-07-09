import React, { useState } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import type { LoginUser } from '../../application/services/LoginUser';
import type { RegisterUser } from '../../application/services/RegisterUser';
import type { LogoutUser } from '../../application/services/LogoutUser';
import { isValidEmail, validatePassword } from '../../application/services/credentialPolicy';
import {
  InvalidCredentialsError,
  EmailAlreadyInUseError,
  ValidationError,
} from '../../application/errors/AuthErrors';

/** Props del overlay de cuenta (E1/E2). */
export interface AccountOverlayProps {
  /** El caller decide la visibilidad (acceso desde el header de la pantalla SELECT). */
  visible: boolean;
  /** Cierra el overlay sin cambiar el estado de sesión. */
  onClose: () => void;
  /** Estado de sesión conocido al abrir: token presente = logueado. */
  initialAuthenticated: boolean;
  loginUser: LoginUser;
  registerUser: RegisterUser;
  logoutUser: LogoutUser;
  /** Notifica al composition root los cambios de sesión (badge del header, re-sync D2). */
  onAuthChanged?: (authenticated: boolean) => void;
}

type Mode = 'login' | 'register';

/** Mapea el error tipado a su clave i18n. La UI nunca muestra el mensaje crudo. */
function errorKeyOf(error: unknown): string {
  if (error instanceof InvalidCredentialsError) return 'account.error.invalidCredentials';
  if (error instanceof EmailAlreadyInUseError) return 'account.error.emailInUse';
  if (error instanceof ValidationError) {
    return error.field === 'email' ? 'account.error.invalidEmail' : 'account.error.weakPassword';
  }
  return 'account.error.network';
}

/**
 * AccountOverlay — UI de cuenta (E1/E2). Mismo patrón visual que PauseOverlay /
 * SettingsOverlay: position:absolute;inset:0, role="dialog", estilos inline y
 * clases existentes (btn-primary para la acción principal), sin librería de UI.
 *
 * Estados: deslogueado (formulario login/registro) · cargando · error · logueado.
 * El password vive solo en memoria y se limpia tras cada operación; nunca se
 * persiste ni se registra.
 */
export const AccountOverlay: React.FC<AccountOverlayProps> = ({
  visible,
  onClose,
  initialAuthenticated,
  loginUser,
  registerUser,
  logoutUser,
  onAuthChanged,
}) => {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  if (!visible) {
    return null;
  }

  const resetMessages = (): void => {
    setErrorKey(null);
    setSuccessKey(null);
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    resetMessages();
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    resetMessages();

    // Validación inline (misma política que el backend): feedback inmediato y
    // ahorro de una ida a la red. RegisterUser vuelve a validar como red de
    // seguridad.
    if (!isValidEmail(email)) {
      setErrorKey('account.error.invalidEmail');
      return;
    }
    if (mode === 'register' && !validatePassword(password)) {
      setErrorKey('account.error.weakPassword');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginUser.execute(email, password);
        setPassword('');
        setAuthenticated(true);
        onAuthChanged?.(true);
      } else {
        await registerUser.execute(email, password);
        // El backend responde 201 sin token: no hay auto-login. Volvemos a
        // login con el mensaje de éxito.
        setPassword('');
        setMode('login');
        setSuccessKey('account.register.success');
      }
    } catch (error) {
      setErrorKey(errorKeyOf(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    resetMessages();
    setSubmitting(true);
    try {
      // Fail-open local: LogoutUser nunca rechaza; el token local se limpia igual.
      await logoutUser.execute();
    } finally {
      setEmail('');
      setPassword('');
      setAuthenticated(false);
      setSubmitting(false);
      onAuthChanged?.(false);
    }
  };

  const dangerText: React.CSSProperties = { color: 'var(--danger)', fontSize: '0.9rem', minHeight: '1.2em' };
  const successText: React.CSSProperties = { color: 'var(--success)', fontSize: '0.9rem', minHeight: '1.2em' };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    padding: '0.6em 0.8em',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '1em',
    color: '#374151',
  };

  return (
    <div
      data-testid="account-overlay"
      role="dialog"
      aria-label={t('account.title')}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        // Mismo backdrop que PauseOverlay/SettingsOverlay: rgba(255,255,255,0.9).
        // Aquellos heredan una superficie blanca de `.app-main > div`; este modal
        // cubre la pantalla SELECT sobre el degradado de `.app`, así que aporta su
        // propia base blanca bajo el tinte idéntico para no transparentar el mapa.
        background: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), #ffffff',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>{t('account.title')}</div>

      {authenticated ? (
        <>
          <div style={{ color: '#6b7280' }}>{t('account.status.loggedIn')}</div>
          <button
            className="btn-primary"
            onClick={() => void handleLogout()}
            disabled={submitting}
            style={{ minWidth: '220px', maxWidth: '100%' }}
          >
            {submitting ? t('account.loading') : t('account.logout')}
          </button>
        </>
      ) : (
        <>
          <div data-testid="account-tabs" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => switchMode('login')}
              aria-pressed={mode === 'login'}
              className={mode === 'login' ? 'btn-primary' : undefined}
              style={{ minWidth: '120px' }}
            >
              {t('account.tab.login')}
            </button>
            <button
              onClick={() => switchMode('register')}
              aria-pressed={mode === 'register'}
              className={mode === 'register' ? 'btn-primary' : undefined}
              style={{ minWidth: '120px' }}
            >
              {t('account.tab.register')}
            </button>
          </div>

          <form
            data-testid="account-form"
            onSubmit={(e) => void handleSubmit(e)}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px', maxWidth: '100%' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#374151' }}>
              {t('account.email')}
              <input
                type="email"
                autoComplete="email"
                aria-label={t('account.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#374151' }}>
              {t('account.password')}
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-label={t('account.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            {errorKey !== null && <div style={dangerText}>{t(errorKey)}</div>}
            {successKey !== null && <div style={successText}>{t(successKey)}</div>}

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ minWidth: '220px', maxWidth: '100%' }}
            >
              {submitting
                ? t('account.loading')
                : mode === 'login'
                  ? t('account.submit.login')
                  : t('account.submit.register')}
            </button>
          </form>
        </>
      )}

      <button onClick={onClose} style={{ minWidth: '220px', maxWidth: '100%' }}>
        {t('account.back')}
      </button>
    </div>
  );
};
