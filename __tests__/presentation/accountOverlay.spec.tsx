import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';
import { AccountOverlay } from '../../src/presentation/components/AccountOverlay';
import { translate } from '../../src/presentation/i18n/i18n';
import { LoginUser } from '../../src/application/services/LoginUser';
import { RegisterUser } from '../../src/application/services/RegisterUser';
import { LogoutUser } from '../../src/application/services/LogoutUser';
import { InvalidCredentialsError, EmailAlreadyInUseError } from '../../src/application/errors/AuthErrors';
import { type IAuthApiClient } from '../../src/application/ports/IAuthApiClient';
import { type IAuthTokenProvider } from '../../src/application/ports/IAuthTokenProvider';

const noop = (): void => undefined;
const T = (key: string): string => translate('es', key);

interface Harness {
  api: jest.Mocked<IAuthApiClient>;
  tokens: jest.Mocked<IAuthTokenProvider>;
  loginUser: LoginUser;
  registerUser: RegisterUser;
  logoutUser: LogoutUser;
}

function makeHarness(): Harness {
  const api: jest.Mocked<IAuthApiClient> = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };
  const tokens: jest.Mocked<IAuthTokenProvider> = {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
    getEmail: jest.fn(),
    setEmail: jest.fn(),
    removeEmail: jest.fn(),
  };
  return {
    api,
    tokens,
    loginUser: new LoginUser(api, tokens),
    registerUser: new RegisterUser(api),
    logoutUser: new LogoutUser(api, tokens),
  };
}

function renderOverlay(h: Harness, overrides: Partial<Parameters<typeof AccountOverlay>[0]> = {}) {
  const props = {
    visible: true,
    onClose: noop,
    initialAuthenticated: false,
    loginUser: h.loginUser,
    registerUser: h.registerUser,
    logoutUser: h.logoutUser,
    ...overrides,
  };
  return render(<I18nProvider initialLang="es">{<AccountOverlay {...props} />}</I18nProvider>);
}

const fillForm = (email: string, password: string): void => {
  fireEvent.change(screen.getByLabelText(T('account.email')), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(T('account.password')), { target: { value: password } });
};

/** Marca la casilla de términos (obligatoria para registrarse). */
const acceptTerms = (): void => {
  fireEvent.click(screen.getByLabelText(T('account.terms.accept')));
};

describe('AccountOverlay — visibilidad', () => {
  it('visible=false: no renderiza', () => {
    const h = makeHarness();
    renderOverlay(h, { visible: false });
    expect(screen.queryByTestId('account-overlay')).toBeNull();
  });

  it('visible=true (deslogueado): muestra el diálogo con pestañas y formulario', () => {
    const h = makeHarness();
    renderOverlay(h);
    expect(screen.getByTestId('account-overlay')).toBeInTheDocument();
    expect(screen.getByLabelText(T('account.email'))).toBeInTheDocument();
    expect(screen.getByLabelText(T('account.password'))).toBeInTheDocument();
  });
});

describe('AccountOverlay — login', () => {
  it('login exitoso: llama al caso de uso y pasa a estado logueado + notifica', async () => {
    const h = makeHarness();
    h.api.login.mockResolvedValue('jwt.token');
    const onAuthChanged = jest.fn();
    renderOverlay(h, { onAuthChanged });

    fillForm('user@test.com', 'Secreta123');
    fireEvent.submit(screen.getByTestId('account-form'));

    await waitFor(() => expect(h.api.login).toHaveBeenCalledWith('user@test.com', 'Secreta123'));
    expect(await screen.findByText(T('account.status.loggedIn'))).toBeInTheDocument();
    // Contrato extendido: en login pasa el email para el badge inmediato.
    expect(onAuthChanged).toHaveBeenCalledWith(true, 'user@test.com');
  });

  it('credenciales inválidas: muestra el mensaje i18n mapeado por tipo (no el crudo)', async () => {
    const h = makeHarness();
    h.api.login.mockRejectedValue(new InvalidCredentialsError());
    renderOverlay(h);

    fillForm('user@test.com', 'Secreta123');
    fireEvent.submit(screen.getByTestId('account-form'));

    expect(await screen.findByText(T('account.error.invalidCredentials'))).toBeInTheDocument();
  });
});

describe('AccountOverlay — registro', () => {
  it('registro válido: no auto-login, vuelve a login con mensaje de éxito', async () => {
    const h = makeHarness();
    h.api.register.mockResolvedValue(undefined);
    renderOverlay(h);

    fireEvent.click(screen.getByText(T('account.tab.register')));
    fillForm('nuevo@test.com', 'Secreta123');
    acceptTerms();
    fireEvent.submit(screen.getByTestId('account-form'));

    await waitFor(() => expect(h.api.register).toHaveBeenCalledWith('nuevo@test.com', 'Secreta123'));
    expect(await screen.findByText(T('account.register.success'))).toBeInTheDocument();
    expect(h.tokens.setToken).not.toHaveBeenCalled();
  });

  it('sin aceptar términos: bloquea el registro y muestra el aviso', async () => {
    const h = makeHarness();
    renderOverlay(h);

    fireEvent.click(screen.getByText(T('account.tab.register')));
    fillForm('nuevo@test.com', 'Secreta123');
    // Sin marcar la casilla: el submit no debe llegar a la red.
    fireEvent.submit(screen.getByTestId('account-form'));

    expect(await screen.findByText(T('account.error.termsRequired'))).toBeInTheDocument();
    expect(h.api.register).not.toHaveBeenCalled();
  });

  it('password débil: validación inline bloquea la red y muestra el mensaje', async () => {
    const h = makeHarness();
    renderOverlay(h);

    fireEvent.click(screen.getByText(T('account.tab.register')));
    fillForm('nuevo@test.com', 'clave');
    fireEvent.submit(screen.getByTestId('account-form'));

    expect(await screen.findByText(T('account.error.weakPassword'))).toBeInTheDocument();
    expect(h.api.register).not.toHaveBeenCalled();
  });

  it('email duplicado (409): muestra el mensaje de email en uso', async () => {
    const h = makeHarness();
    h.api.register.mockRejectedValue(new EmailAlreadyInUseError());
    renderOverlay(h);

    fireEvent.click(screen.getByText(T('account.tab.register')));
    fillForm('admin@test.com', 'Secreta123');
    acceptTerms();
    fireEvent.submit(screen.getByTestId('account-form'));

    expect(await screen.findByText(T('account.error.emailInUse'))).toBeInTheDocument();
  });
});

describe('AccountOverlay — sesión activa y logout', () => {
  it('logueado: muestra estado activo y botón de cierre', () => {
    const h = makeHarness();
    renderOverlay(h, { initialAuthenticated: true });
    expect(screen.getByText(T('account.status.loggedIn'))).toBeInTheDocument();
    expect(screen.getByText(T('account.logout'))).toBeInTheDocument();
  });

  it('logout: invoca el caso de uso, notifica deslogueo y regresa al formulario', async () => {
    const h = makeHarness();
    h.tokens.getToken.mockResolvedValue('jwt.token');
    h.api.logout.mockResolvedValue(undefined);
    const onAuthChanged = jest.fn();
    renderOverlay(h, { initialAuthenticated: true, onAuthChanged });

    fireEvent.click(screen.getByText(T('account.logout')));

    await waitFor(() => expect(h.tokens.removeToken).toHaveBeenCalled());
    expect(onAuthChanged).toHaveBeenCalledWith(false);
    expect(await screen.findByLabelText(T('account.email'))).toBeInTheDocument();
  });
});

describe('AccountOverlay — cierre', () => {
  it('el botón Volver invoca onClose', () => {
    const h = makeHarness();
    const onClose = jest.fn();
    renderOverlay(h, { onClose });
    fireEvent.click(screen.getByText(T('account.back')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
