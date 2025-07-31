import { IdentityKeyManager } from './identity-key';

function generateChallengeString(userId: string, timestamp: number): string {
  return `${userId}:${timestamp}`;
}

export async function generateCmkChallenge(
  identifier: string,
  key: Uint8Array
): Promise<{
  timestamp: number;
  signature: string;
}> {
  const timestamp = Date.now();
  const challenge = Buffer.from(generateChallengeString(identifier, timestamp));

  const signature = await IdentityKeyManager.sign(challenge, key);
  return {
    timestamp,
    signature: Buffer.from(signature).toString('base64'),
  };
}

export async function verifyCmkChallenge(
  identifier: string,
  signature: string,
  publicKey: string,
  timestamp: number,
  maxAgeMs: number
): Promise<void> {
  if (timestamp <= 0) {
    throw new Error('Invalid timestamp. Must be a positive integer.');
  }

  const age = Date.now() - timestamp;
  if (age > maxAgeMs) {
    throw new Error('Challenge timestamp too old. Please retry with current timestamp.');
  }

  if (age < -maxAgeMs) {
    throw new Error('Challenge timestamp too far in the future.');
  }

  try {
    const isValid = await IdentityKeyManager.verify(
      Buffer.from(generateChallengeString(identifier, timestamp)),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    );

    if (!isValid) {
      throw new Error('Invalid signature. Cannot verify key possession.');
    }
  } catch {
    throw new Error(`Invalid signature. Cannot verify key possession`);
  }
}
