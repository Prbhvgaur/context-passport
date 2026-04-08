import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
}

export class EncryptionService {
  private readonly key: Buffer;

  public constructor(keyHex: string | undefined = env.ENCRYPTION_KEY) {
    if (!keyHex) {
      throw new AppError(500, 'CONFIG_ERROR', 'Encryption key is not configured.');
    }

    this.key = Buffer.from(keyHex, 'hex');
  }

  public encrypt(value: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.from(
      JSON.stringify({
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        ciphertext: ciphertext.toString('base64'),
      } satisfies EncryptedPayload),
      'utf8',
    ).toString('base64');
  }

  public decrypt(payload: string): string {
    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as EncryptedPayload;
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(parsed.iv, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(parsed.ciphertext, 'base64')),
        decipher.final(),
      ]);

      return plaintext.toString('utf8');
    } catch (error) {
      throw new AppError(500, 'DECRYPTION_FAILED', 'Unable to decrypt stored payload.', {
        cause: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}

