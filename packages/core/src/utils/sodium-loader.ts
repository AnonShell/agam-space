import sodium from 'libsodium-wrappers-sumo';

let sodiumReadyPromise: Promise<typeof sodium> | null = null;

export async function getSodium(): Promise<typeof sodium> {
  if (!sodiumReadyPromise) {
    sodiumReadyPromise = sodium.ready.then(() => sodium);
  }
  return sodiumReadyPromise;
}
