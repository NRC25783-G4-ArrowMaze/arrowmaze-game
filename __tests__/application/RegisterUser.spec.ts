import { RegisterUser } from '../../src/application/services/RegisterUser';
import { type IAuthApiClient } from '../../src/application/ports/IAuthApiClient';
import { ValidationError, EmailAlreadyInUseError } from '../../src/application/errors/AuthErrors';
import { NetworkError } from '../../src/domain/errors/SyncErrors';

describe('RegisterUser Use Case', () => {
  let mockApiClient: jest.Mocked<IAuthApiClient>;
  let useCase: RegisterUser;

  beforeEach(() => {
    mockApiClient = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };
    useCase = new RegisterUser(mockApiClient);
  });

  it('registra una cuenta con credenciales válidas (sin auto-login: no devuelve token)', async () => {
    mockApiClient.register.mockResolvedValue(undefined);

    await useCase.execute('usuario@test.com', 'Secreta123');

    expect(mockApiClient.register).toHaveBeenCalledWith('usuario@test.com', 'Secreta123');
  });

  it('rechaza email inválido ANTES de tocar la red (ValidationError field=email)', async () => {
    await expect(useCase.execute('usuario.test.com', 'Secreta123')).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute('usuario.test.com', 'Secreta123')).rejects.toMatchObject({ field: 'email' });
    expect(mockApiClient.register).not.toHaveBeenCalled();
  });

  it('rechaza password débil ANTES de tocar la red (ValidationError field=password)', async () => {
    await expect(useCase.execute('usuario@test.com', 'clave')).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute('usuario@test.com', 'clave')).rejects.toMatchObject({ field: 'password' });
    expect(mockApiClient.register).not.toHaveBeenCalled();
  });

  it('propaga EmailAlreadyInUseError si la API responde 409', async () => {
    mockApiClient.register.mockRejectedValue(new EmailAlreadyInUseError());

    await expect(useCase.execute('admin@test.com', 'Secreta123')).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('propaga NetworkError si falla la comunicación', async () => {
    mockApiClient.register.mockRejectedValue(new NetworkError('timeout'));

    await expect(useCase.execute('usuario@test.com', 'Secreta123')).rejects.toBeInstanceOf(NetworkError);
  });
});
