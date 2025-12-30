import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { toBase64 } from './encoding';

export function blake3Hash(input: string | Uint8Array, length = 32): Uint8Array {
  const inputBytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return blake3(inputBytes, { dkLen: length });
}

export function blake3HashWithEncoding(
  input: string | Uint8Array,
  output: 'hex' | 'base64' = 'hex'
): string {
  const hash = blake3Hash(input);

  if (output === 'hex') {
    return bytesToHex(hash);
  } else if (output === 'base64') {
    return toBase64(hash);
  } else {
    throw new Error('Unsupported output format. Use "hex" or "base64".');
  }
}
