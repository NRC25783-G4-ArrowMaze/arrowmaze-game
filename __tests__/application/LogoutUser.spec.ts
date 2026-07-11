import { LogoutUser } from '../../src/application/services/LogoutUser';
import { type IAuthApiClient } from '../../src/application/ports/IAuthApiClient';
import { type IAuthTokenProvider } from '../../src/application/ports/IAuthTokenProvider';
import { NetworkError } from '../../src/domain/errors/SyncErrors';

describe('LogoutUser Use Case', () => {
  let mockApiClient: jest.Mocked<IAuthApiClient>;
  let mockTokenProvider: jest.Mocked<IAuthTokenProvider>;
  let useCase: LogoutUser;

  beforeEach(() => {
    mockApiClient = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };
    mockTokenProvider = {
      getToken: jest.fn(),
      setToken: jest.fn(),
      removeToken: jest.fn(),
      getEmail: jest.fn(),
      setEmail: jest.fn(),
      removeEmail: jest.fn(),
    };
    useCase = new LogoutUser(mockApiClient, mockTokenProvider);
  });

  it('revoca el token en el servidor y luego elimina token y email localmente', async () => {
    mockTokenProvider.getToken.mockResolvedValue('token-A');
    mockApiClient.logout.mockResolvedValue(undefined);

    await useCase.execute();

    expect(mockApiClient.logout).toHaveBeenCalledWith('token-A');
    expect(mockTokenProvider.removeToken).toHaveBeenCalledTimes(1);
    expect(mockTokenProvider.removeEmail).toHaveBeenCalledTimes(1);
  });

  it('FAIL-OPEN LOCAL: si la red falla, elimina token Y email igual y NO propaga el error', async () => {
    mockTokenProvider.getToken.mockResolvedValue('token-A');
    mockApiClient.logout.mockRejectedValue(new NetworkError('sin conexión'));

    await expect(useCase.execute()).resolves.toBeUndefined();

    expect(mockApiClient.logout).toHaveBeenCalledWith('token-A');
    expect(mockTokenProvider.removeToken).toHaveBeenCalledTimes(1);
    // La identidad local muere junto con el token aunque la red esté caída.
    expect(mockTokenProvider.removeEmail).toHaveBeenCalledTimes(1);
  });

  it('sin token local: no llama a la API pero garantiza el estado deslogueado', async () => {
    mockTokenProvider.getToken.mockResolvedValue(null);

    await useCase.execute();

    expect(mockApiClient.logout).not.toHaveBeenCalled();
    expect(mockTokenProvider.removeToken).toHaveBeenCalledTimes(1);
  });
});
