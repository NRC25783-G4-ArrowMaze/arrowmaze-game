import { FetchAuthApiClient } from '../../src/infrastructure/api/FetchAuthApiClient';
import { InvalidCredentialsError, ValidationError, EmailAlreadyInUseError } from '../../src/application/errors/AuthErrors';
import { NetworkError } from '../../src/domain/errors/SyncErrors';

describe('FetchAuthApiClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should_return_token_on_successful_login', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'jwt.fake.token' }),
    });
    const client = new FetchAuthApiClient('http://localhost:3000');

    const token = await client.login('user@example.com', 'password123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      }),
    );
    expect(token).toBe('jwt.fake.token');
  });

  it('should_throw_InvalidCredentialsError_on_401', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.login('wrong@example.com', 'bad'))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('should_throw_NetworkError_on_non_401_http_error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.login('user@example.com', 'password123'))
      .rejects.toThrow(NetworkError);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await expect(client.login('user@example.com', 'password123'))
      .rejects.toThrow(/500/);
  });

  it('should_throw_error_when_response_200_but_token_missing', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: 'payload' }),
    });
    const client = new FetchAuthApiClient('http://localhost:3000');

    // El Error del payload faltante se re-envuelve como NetworkError
    // por el catch genérico (no es InvalidCredentialsError ni NetworkError)
    await expect(client.login('user@example.com', 'password123'))
      .rejects.toThrow(NetworkError);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await expect(client.login('user@example.com', 'password123'))
      .rejects.toThrow(/token/i);
  });

  // ─────────────────────────────── REGISTER ───────────────────────────────

  it('register: POST a /api/v1/auth/register con email+password y resuelve en 201', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ message: 'Account created successfully' }) });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.register('nuevo@usuario.com', 'Password123')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nuevo@usuario.com', password: 'Password123' }),
      }),
    );
  });

  it('register: 409 → EmailAlreadyInUseError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'email is already in use' }) });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.register('admin@test.com', 'Password123')).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('register: 400 → ValidationError (política de password del backend)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'password must contain at least 8 characters, 1 number, and 1 uppercase letter' }) });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.register('nuevo@usuario.com', 'weak')).rejects.toBeInstanceOf(ValidationError);
  });

  it('register: otro error HTTP → NetworkError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.register('nuevo@usuario.com', 'Password123')).rejects.toBeInstanceOf(NetworkError);
  });

  // ──────────────────────────────── LOGOUT ────────────────────────────────

  it('logout: POST a /api/v1/auth/logout con header Authorization: Bearer y resuelve en 200', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ message: 'Logged out successfully' }) });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.logout('jwt.token.abc')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt.token.abc' }),
      }),
    );
  });

  it('logout: error HTTP → NetworkError (el caller decide fail-open)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized: missing token' }) });
    const client = new FetchAuthApiClient('http://localhost:3000');

    await expect(client.logout('jwt.token.abc')).rejects.toBeInstanceOf(NetworkError);
  });
});
