import sodium from 'libsodium-wrappers-sumo';

export function randomBytes(length: number = 32): Uint8Array {
  return sodium.randombytes_buf(length);
}

export function randomString(length: number = 32) {
  const bytes = randomBytes(length);
  return sodium.to_base64(bytes, sodium.base64_variants.URLSAFE_NO_PADDING);
}