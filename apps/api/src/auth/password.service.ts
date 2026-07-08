import { Injectable } from '@nestjs/common';
import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const hexPattern = /^[0-9a-f]+$/i;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, saltValue, hashValue] = storedHash.split(':');
    if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;

    const isHexHash = hashValue.length % 2 === 0 && hexPattern.test(hashValue);
    const expected = Buffer.from(hashValue, isHexHash ? 'hex' : 'base64url');
    const salt =
      saltValue.length % 2 === 0 && hexPattern.test(saltValue)
        ? Buffer.from(saltValue, 'hex')
        : saltValue;
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
