import bs58 from 'bs58';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export function encodeBase58(data: Uint8Array): string {
  return bs58.encode(data);
}

export function decodeBase58(encoded: string): Uint8Array {
  return bs58.decode(encoded);
}

export function toUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function fromUtf8Bytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function toHex(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

export function fromHex(hex: string): Uint8Array {
  return hexToBytes(hex);
}

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  return new Uint8Array([...binary].map(char => char.charCodeAt(0)));
}
