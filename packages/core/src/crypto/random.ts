import sodium from 'libsodium-wrappers-sumo';

export function randomBytes(length: number = 32): Uint8Array {
  return sodium.randombytes_buf(length);
}
