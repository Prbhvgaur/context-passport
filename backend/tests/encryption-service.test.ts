import { EncryptionService } from '../src/services/encryption-service';

describe('EncryptionService', () => {
  it('encrypts and decrypts values', () => {
    const service = new EncryptionService(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    const payload = 'hello context passport';

    const encrypted = service.encrypt(payload);

    expect(encrypted).not.toEqual(payload);
    expect(service.decrypt(encrypted)).toEqual(payload);
  });
});
