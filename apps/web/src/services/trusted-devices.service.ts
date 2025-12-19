import {
  ApiClientError,
  decryptCmkWithPassword,
  EncryptionRegistry,
  getRegisterChallenge,
  listTrustedDevices,
  registerTrustedDevice,
  removeTrustedDevice,
  requestUnlockChallenge,
  verifyUnlockAssertion,
} from '@agam-space/client';
import {
  PublicKeyCredentialDescriptorJSON,
  PublicKeyCredentialRequestOptionsJSON,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { DeviceKeyManager, EncryptedEnvelopeCodec, fromBase64, toBase64 } from '@agam-space/core';
import { toast } from 'sonner';
import { DeviceCredentials } from '@/store/device-credentials.store';

export const TrustedDevicesService = {
  async fetchDevices() {
    return await listTrustedDevices();
  },
  async registerDevice({
    userId,
    deviceName,
    cmk,
  }: {
    userId: string;
    deviceName: string;
    cmk: Uint8Array;
  }) {
    // 1. Generate DeviceKeyPair and UnlockKey
    const { publicKey: devicePublicKey, privateKey: devicePrivateKey } =
      await DeviceKeyManager.generateDeviceKeyPair();
    const unlockKey = crypto.getRandomValues(new Uint8Array(32));

    // 2. Encrypt DevicePrivateKey with UnlockKey (XChaCha)
    const envelopePriv = await EncryptionRegistry.get().encrypt(devicePrivateKey, unlockKey);
    const encryptedDevicePrivateKey = EncryptedEnvelopeCodec.serialize(envelopePriv);

    // 3. Encrypt CMK with DevicePublicKey (X25519)
    const encryptedCMKBytes = await DeviceKeyManager.encryptWithDevicePublicKey(
      cmk,
      devicePublicKey
    );
    const encryptedCMK = toBase64(encryptedCMKBytes);

    // 4. Request registration challenge from backend
    const challengeResp = await getRegisterChallenge(deviceName);

    // 5. Start WebAuthn registration in browser
    const regResp = await startRegistration(challengeResp.options);

    // 6. Prepare registration payload (only required fields)
    const payload = {
      credentialId: regResp.id,
      attestationObject: regResp.response.attestationObject,
      clientDataJSON: regResp.response.clientDataJSON,
      devicePublicKey: toBase64(devicePublicKey),
      unlockKey: Buffer.from(unlockKey).toString('base64'),
      encryptedCMK,
      deviceName,
      challenge: challengeResp.options.challenge,
    };

    console.log(payload);

    // 7. Register device with backend
    const result = await registerTrustedDevice(payload);
    // 8. Return credentials for zustand store
    return {
      userId,
      deviceId: result.deviceId,
      credentialId: regResp.id,
      encryptedDevicePrivateKey,
      devicePublicKey: toBase64(devicePublicKey),
    };
  },
  async removeDevice(deviceId: string) {
    return await removeTrustedDevice(deviceId);
  },
  async unlockWithDevice({
    credentialId,
    encryptedDevicePrivateKey,
    encryptedCMK,
    deviceId,
    devicePublicKey,
  }: {
    credentialId: string;
    encryptedDevicePrivateKey: string;
    encryptedCMK: string;
    deviceId: string;
    devicePublicKey: string; // base64
  }) {
    const challengeResp = await requestUnlockChallenge(deviceId);
    const opts = challengeResp.options;
    if (!opts.challenge || !opts.rpId) {
      throw new Error('Invalid WebAuthn options from backend');
    }

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: opts.challenge,
      rpId: opts.rpId,
      userVerification: opts.userVerification,
      timeout: opts.timeout,
      allowCredentials: (opts.allowCredentials ?? []).map(
        (cred: PublicKeyCredentialDescriptorJSON) => ({
          ...cred,
          type: 'public-key' as const,
        })
      ),
    };
    const assertion = await startAuthentication({ optionsJSON: options });

    const unlockResp = await verifyUnlockAssertion({
      credentialId,
      challengeId: challengeResp.challengeId,
      authenticatorData: assertion.response.authenticatorData,
      clientDataJSON: assertion.response.clientDataJSON,
      signature: assertion.response.signature,
      deviceId,
    });

    const { unlockKey } = unlockResp;
    if (!unlockKey) throw new Error('UnlockKey not returned');

    const devicePrivateKey = await EncryptionRegistry.get().decrypt(
      EncryptedEnvelopeCodec.deserialize(encryptedDevicePrivateKey),
      fromBase64(unlockKey)
    );
    return await DeviceKeyManager.decryptWithDevicePrivateKey(
      fromBase64(encryptedCMK),
      fromBase64(devicePublicKey),
      devicePrivateKey
    );
  },

  async registerDeviceWithPassword({
    userId,
    deviceName,
    password,
    e2eeKeys,
    setCredentials,
    fetchDevices,
    setModalOpen,
    setPassword,
    setDeviceName,
  }: {
    userId: string;
    deviceName: string;
    password: string;
    e2eeKeys: { encCmkWithPassword: string; kdfMetadata: { salt: string } };
    setCredentials: (creds: DeviceCredentials) => void;
    fetchDevices: () => void;
    setModalOpen: (open: boolean) => void;
    setPassword: (val: string) => void;
    setDeviceName: (val: string) => void;
  }) {
    try {
      if (!e2eeKeys) throw new Error('E2EE keys not found');
      const { encCmkWithPassword } = e2eeKeys;
      const salt = e2eeKeys.kdfMetadata?.salt;
      if (!encCmkWithPassword || !salt) throw new Error('Missing encrypted CMK or salt');
      let cmk: Uint8Array | null = null;
      try {
        cmk = await decryptCmkWithPassword(encCmkWithPassword, password, salt);
        if (!cmk) {
          toast.error(
            'Failed to unlock your master key. Please check your password and try again.'
          );
          return;
        }
      } catch {
        toast.error('Failed to unlock your master key. Please check your password and try again.');
        return;
      }
      const creds = await TrustedDevicesService.registerDevice({ userId, deviceName, cmk }); // ✅ ADD: Pass userId
      setCredentials(creds);
      fetchDevices();
      setModalOpen(false);
      setPassword('');
      setDeviceName('');
      toast.success('Device registered successfully!');
      return creds;
    } catch (err: unknown) {
      let message = 'Failed to register device';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message =
            'WebAuthn registration was cancelled. Please try again and complete the biometric prompt.';
        } else if (err.name === 'NotSupportedError') {
          message =
            'WebAuthn is not supported on this device or browser. Please use a compatible device.';
        } else if (err.name === 'SecurityError') {
          message =
            'WebAuthn registration failed due to security restrictions. Ensure you are on a secure (HTTPS) connection.';
        } else if (err.name === 'AbortError') {
          message = 'WebAuthn registration was aborted. Please try again.';
        } else if (err.message.includes('WebAuthn')) {
          message =
            'WebAuthn registration failed. Please check your biometric settings and try again.';
        } else if (err.message.includes('E2EE keys not found')) {
          message = 'Your encryption keys are not set up. Please log out and log back in.';
        } else {
          message = err.message;
        }
      }
      if (ApiClientError.isApiClientError(err)) {
        const apiErr = err as ApiClientError;
        if (apiErr.isConflict()) {
          message =
            'This device is already registered. If you believe this is an error, try removing the existing device first.';
        } else if (apiErr.isUnauthorized()) {
          message = 'Authentication failed. Please log out and log back in.';
        } else if (apiErr.isServerError()) {
          message = 'Server error occurred. Please try again later.';
        } else {
          message = apiErr.errorMessage || apiErr.message;
        }
      }
      toast.error(message);
      throw new Error(message);
    }
  },
};
