import { DeviceKeyManager } from '../src';
import { randomBytes } from 'crypto';

describe('DeviceKeyManager', () => {
  it('should generate a valid X25519 keypair', async () => {
    const keypair = await DeviceKeyManager.generateDeviceKeyPair();

    expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keypair.publicKey.length).toBe(32);
    expect(keypair.privateKey.length).toBe(32);
  });

  it('should generate different keypairs on each call', async () => {
    const keypair1 = await DeviceKeyManager.generateDeviceKeyPair();
    const keypair2 = await DeviceKeyManager.generateDeviceKeyPair();

    expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
    expect(keypair1.privateKey).not.toEqual(keypair2.privateKey);
  });

  it('should encrypt and decrypt data', async () => {
    const keypair = await DeviceKeyManager.generateDeviceKeyPair();
    const data = randomBytes(32);

    const ciphertext = await DeviceKeyManager.encryptWithDevicePublicKey(data, keypair.publicKey);
    const decrypted = await DeviceKeyManager.decryptWithDevicePrivateKey(
      ciphertext,
      keypair.publicKey,
      keypair.privateKey
    );

    expect(decrypted).toEqual(data);
  });

  it('should produce different ciphertext for same data', async () => {
    const keypair = await DeviceKeyManager.generateDeviceKeyPair();
    const data = randomBytes(32);

    const ciphertext1 = await DeviceKeyManager.encryptWithDevicePublicKey(data, keypair.publicKey);
    const ciphertext2 = await DeviceKeyManager.encryptWithDevicePublicKey(data, keypair.publicKey);

    expect(ciphertext1).not.toEqual(ciphertext2);
  });

  it('should fail to decrypt with wrong keypair', async () => {
    const keypair1 = await DeviceKeyManager.generateDeviceKeyPair();
    const keypair2 = await DeviceKeyManager.generateDeviceKeyPair();
    const data = randomBytes(32);

    const ciphertext = await DeviceKeyManager.encryptWithDevicePublicKey(data, keypair1.publicKey);

    await expect(
      DeviceKeyManager.decryptWithDevicePrivateKey(
        ciphertext,
        keypair2.publicKey,
        keypair2.privateKey
      )
    ).rejects.toThrow();
  });
});
