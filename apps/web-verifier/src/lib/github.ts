import { IntegrityManifest } from '../types/manifest';

const GITHUB_REPO = 'agam-space/agam-space';
const GITHUB_RAW = 'https://github.com';

export async function fetchOfficialManifest(version: string): Promise<IntegrityManifest> {
  const manifestUrl = `${GITHUB_RAW}/${GITHUB_REPO}/releases/download/${version}/integrity-manifest.json`;

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Manifest not found for version ${version}. This version may be before v0.2.7 when manifests were introduced.`
        );
      }
      throw new Error(`Failed to fetch manifest for version ${version} (HTTP ${response.status})`);
    }

    const manifest = await response.json();
    return manifest;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch manifest: ${error}`);
  }
}
