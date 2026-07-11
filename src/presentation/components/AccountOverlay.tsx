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
  /**
   * Notifica al composition root los cambios de sesión (badge del header, re-sync
   * D2). En el login pasa el email para el badge inmediato (sin flicker); en el
   * logout se omite.
   */
  onAuthChanged?: (authenticated: boolean, email?: string) => void;
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
 * SettingsOverlay: modal a pantalla completa (.overlay-backdrop/.overlay-card),
 * role="dialog", estilos inline y clases existentes (btn-primary para la acción
 * principal), sin librería de UI.
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
  // Aceptación de términos + uso de datos: obligatoria para registrarse
  // (proyecto académico). Se reinicia al cambiar de pestaña o tras registrar.
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!visible) {
    return null;
  }

  const resetMessages = (): void => {
    setErrorKey(null);
    setSuccessKey(null);
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    setAcceptedTerms(false);
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
    // Puerta de términos: red de seguridad además del botón deshabilitado.
    if (mode === 'register' && !acceptedTerms) {
      setErrorKey('account.error.termsRequired');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginUser.execute(email, password);
        setPassword('');
        setAuthenticated(true);
        // Pasa el email para el badge inmediato; LoginUser ya lo persistió.
        onAuthChanged?.(true, email);
      } else {
        await registerUser.execute(email, password);
        // El backend responde 201 sin token: no hay auto-login. Volvemos a
        // login con el mensaje de éxito.
        setPassword('');
        setAcceptedTerms(false);
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
    color: 'var(--text)',
  };

  return (
    <div
      data-testid="account-overlay"
      role="dialog"
      aria-label={t('account.title')}
      className="overlay-backdrop"
    >
      <div className="overlay-card">
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
          <span aria-hidden="true">👤</span> {t('account.title')}
        </div>

        {authenticated ? (
          <>
            <div style={{ color: 'var(--text-muted)' }}>{t('account.status.loggedIn')}</div>
            <button
              className="btn-primary"
              onClick={() => void handleLogout()}
              disabled={submitting}
              style={{ width: 'min(300px, 100%)' }}
            >
              {submitting ? t('account.loading') : t('account.logout')}
            </button>
          </>
        ) : (
          <>
            {/* Control segmentado: la pestaña activa mantiene btn-primary; la
                inactiva se funde con la pista (sin borde) para leerse como
                selector, no como dos botones sueltos. */}
            <div
              data-testid="account-tabs"
              style={{
                display: 'flex',
                width: 'min(300px, 100%)',
                background: 'var(--surface-muted)',
                borderRadius: '999px',
                padding: '4px',
              }}
            >
              <button
                onClick={() => switchMode('login')}
                aria-pressed={mode === 'login'}
                className={mode === 'login' ? 'btn-primary' : undefined}
                style={{
                  flex: 1,
                  minHeight: '38px',
                  padding: '0.3em 0.6em',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.95rem',
                  ...(mode === 'login' ? {} : { background: 'transparent', color: 'var(--text-muted)' }),
                }}
              >
                {t('account.tab.login')}
              </button>
              <button
                onClick={() => switchMode('register')}
                aria-pressed={mode === 'register'}
                className={mode === 'register' ? 'btn-primary' : undefined}
                style={{
                  flex: 1,
                  minHeight: '38px',
                  padding: '0.3em 0.6em',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.95rem',
                  ...(mode === 'register' ? {} : { background: 'transparent', color: 'var(--text-muted)' }),
                }}
              >
                {t('account.tab.register')}
              </button>
            </div>

            <form
              data-testid="account-form"
              onSubmit={(e) => void handleSubmit(e)}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: 'min(300px, 100%)' }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  color: 'var(--text)',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
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
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  color: 'var(--text)',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
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

              {mode === 'register' && (
                <div style={{ textAlign: 'left' }}>
                  {/* Mismo patrón desplegable que los créditos de audio de
                      Ajustes: el texto legal no satura el formulario. */}
                  <details
                    data-testid="account-terms"
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45 }}
                  >
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}>
                      {t('account.terms.summary')}
                    </summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      <p>{t('account.terms.academic')}</p>
                      <strong style={{ color: 'var(--text)' }}>{t('account.terms.dataTitle')}</strong>
                      <p>{t('account.terms.dataUse')}</p>
                      <p>{t('account.terms.dataRights')}</p>
                    </div>
                  </details>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginTop: '10px',
                      fontSize: '0.85rem',
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      aria-label={t('account.terms.accept')}
                      style={{ marginTop: '2px', minHeight: 'auto' }}
                    />
                    {t('account.terms.accept')}
                  </label>
                </div>
              )}

              {errorKey !== null && <div style={dangerText}>{t(errorKey)}</div>}
              {successKey !== null && <div style={successText}>{t(successKey)}</div>}

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || (mode === 'register' && !acceptedTerms)}
                style={{ width: '100%', marginTop: '4px' }}
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

        {/* Acción secundaria: sin borde ni fondo para no competir con el submit. */}
        <button
          onClick={onClose}
          style={{
            width: 'min(300px, 100%)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {t('account.back')}
        </button>
      </div>
    </div>
  );
};
