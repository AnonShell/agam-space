import sodium from 'libsodium-wrappers-sumo';

export enum Argon2idVersion {
  v1 = 'v1',
  session = 'session',
  light = 'light',
}

export interface Argon2idOptions {
  opslimit: number;
  memlimit: number;
  hashLength: number;
}

export const ARGON2ID_PRESETS: Record<Argon2idVersion, Argon2idOptions> = {
  v1: {
    opslimit: 3,
    memlimit: 65_536,
    hashLength: 32,
  },
  session: {
    opslimit: 2,
    memlimit: 32_768,
    hashLength: 32,
  },
  light: {
    opslimit: 2,
    memlimit: 32_768,
    hashLength: 32,
  },
};

export async function deriveKeyFromSecret(
  password: Uint8Array,
  salt: Uint8Array,
  version: Argon2idVersion = Argon2idVersion.v1
): Promise<{
  params: Argon2idOptions;
  key: Uint8Array;
}> {
  await sodium.ready;

  const preset = ARGON2ID_PRESETS[version];

  const hash = await sodium.crypto_pwhash(
    preset.hashLength,
    password,
    salt,
    preset.opslimit,
    preset.memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  return {
    params: preset,
    key: hash,
  };
}
