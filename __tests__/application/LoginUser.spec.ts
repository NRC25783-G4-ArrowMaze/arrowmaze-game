import { LoginUser } from '../../src/application/services/LoginUser';
import { type IAuthApiClient } from '../../src/application/ports/IAuthApiClient';
import { type IAuthTokenProvider } from '../../src/application/ports/IAuthTokenProvider';
import { InvalidCredentialsError } from '../../src/application/errors/AuthErrors'
import { NetworkError } from '../../src/domain/errors/SyncErrors';

describe('LoginUser Use Case', () => {
  let mockApiClient: jest.Mocked<IAuthApiClient>;
  let mockTokenProvider: jest.Mocked<IAuthTokenProvider>;
  let useCase: LoginUser;

  beforeEach(() => {
    // Declaración explícita para cumplir con la interfaz y evadir el uso de 'any'
    mockApiClient = {
      login: jest.fn(),
    };

    mockTokenProvider = {
      getToken: jest.fn(),
      setToken: jest.fn(),
      removeToken: jest.fn(),
    };

    useCase = new LoginUser(mockApiClient, mockTokenProvider);
  });

  it('debe iniciar sesión exitosamente y guardar el token', async () => {
    // Arrange
    const fakeToken = 'fake.jwt.token.123';
    mockApiClient.login.mockResolvedValue(fakeToken);
    const email = 'jugador@example.com';
    const password = 'passwordSeguro123';

    // Act
    await useCase.execute(email, password);

    // Assert
    // Verificamos que se llamó a la API con los datos correctos
    expect(mockApiClient.login).toHaveBeenCalledWith(email, password);
    // Verificamos que el orquestador guardó el token devuelto
    expect(mockTokenProvider.setToken).toHaveBeenCalledWith(fakeToken);
  });

  it('debe propagar InvalidCredentialsError y NO guardar el token si las credenciales son incorrectas', async () => {
    // Arrange
    const error = new InvalidCredentialsError();
    mockApiClient.login.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute('wrong@example.com', 'badpass')).rejects.toThrow(InvalidCredentialsError);
    
    // Garantizamos que el token provider no fue alterado
    expect(mockTokenProvider.setToken).not.toHaveBeenCalled();
  });

  it('debe propagar un NetworkError si falla la comunicación y NO guardar el token', async () => {
    // Arrange
    const error = new NetworkError('Timeout del servidor');
    mockApiClient.login.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute('jugador@example.com', 'password123')).rejects.toThrow(NetworkError);
    
    expect(mockTokenProvider.setToken).not.toHaveBeenCalled();
  });
});
