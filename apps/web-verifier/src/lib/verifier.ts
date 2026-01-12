import { VerificationResult, FileComparison, VerificationStep } from '../types/manifest';
import { fetchOfficialManifest } from './github';
import { extractVersion, extractCommit, parseIntegrityHashes } from './parser';

/**
 * Compare semantic versions
 * Returns true if version1 < version2
 */
function isVersionBefore(version1: string, version2: string): boolean {
  const v1 = version1.replace(/^v/, '').split('.').map(Number);
  const v2 = version2.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (v1[i] < v2[i]) return true;
    if (v1[i] > v2[i]) return false;
  }

  return false;
}

/**
 * Check if version is a valid release tag (e.g., v1.0.0, 1.0.0)
 * Rejects dev builds, commit hashes, or non-release versions
 */
function isValidReleaseVersion(version: string): boolean {
  // Check for common dev/non-release patterns
  const invalidPatterns = [
    /^dev/i, // dev, dev-abc123
    /^latest$/i, // latest
    /^main$/i, // main
    /^master$/i, // master
    /^canary/i, // canary
    /^alpha$/i, // alpha (without version)
    /^beta$/i, // beta (without version)
    /^rc$/i, // rc (without version)
    /^[0-9a-f]{7,40}$/i, // commit hash (7-40 hex chars)
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(version)) {
      return false;
    }
  }

  // Valid release version should be semantic versioning format
  // v1.0.0, v1.0.0-beta.1, v1.0.0-alpha.2, 1.0.0, etc.
  const semverPattern = /^v?\d+\.\d+\.\d+(-(?:alpha|beta|rc)\.\d+)?$/i;

  return semverPattern.test(version);
}

/**
 * Get user-friendly error message for invalid versions
 */
function getVersionErrorMessage(version: string): string {
  if (/^dev/i.test(version)) {
    return `This instance is running a development version (${version}). Development builds cannot be verified as they don't have official release integrity manifest.`;
  }

  if (/^[0-9a-f]{7,40}$/i.test(version)) {
    return `This instance is running a commit version (${version}). Only tagged releases can be verified.`;
  }

  if (/^(latest|main|master|canary)$/i.test(version)) {
    return `This instance is running "${version}" which is not a specific release version. Only tagged releases (e.g., v1.0.0) can be verified.`;
  }

  return `Invalid version format: "${version}". Only official release versions (e.g., v1.0.0) can be verified.`;
}

export async function verifyInstance(
  instanceUrl: string,
  version?: string
): Promise<VerificationResult> {
  const steps: VerificationStep[] = [];

  try {
    steps.push({
      name: 'Instance Connection',
      status: 'success',
      message: 'Connecting to instance...',
    });

    const html = await fetchInstanceHTML(instanceUrl);

    steps[0] = {
      name: 'Instance Connection',
      status: 'success',
      message: 'Successfully fetched instance HTML',
    };

    return await verifyFromHTML(html, instanceUrl, version, steps);
  } catch (error) {
    // If error has steps, throw it as-is for better error display
    if (error && typeof error === 'object' && 'steps' in error) {
      throw error;
    }

    // Handle fetch errors with structured steps
    if (error instanceof Error) {
      steps[0] = {
        name: 'Instance Connection',
        status: 'failed',
        message: 'Failed to connect to instance',
        details: error.message,
      };
      throw { steps, message: error.message };
    }

    throw new Error('Verification failed');
  }
}

/**
 * Verify an instance from manually provided HTML
 * Use this for instances behind authentication that can't be fetched via proxy
 */
export async function verifyInstanceManual(
  html: string,
  version?: string
): Promise<VerificationResult> {
  try {
    return await verifyFromHTML(html, 'manual-verification', version);
  } catch (error) {
    // If error has steps, throw it as-is for better error display
    if (error && typeof error === 'object' && 'steps' in error) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Verification failed');
  }
}

/**
 * Core verification logic - used by both URL and manual modes
 */
async function verifyFromHTML(
  html: string,
  instanceUrl: string,
  version?: string,
  existingSteps: VerificationStep[] = []
): Promise<VerificationResult> {
  const steps: VerificationStep[] = [...existingSteps];

  // Step 1: Extract version from HTML if not provided
  const detectedVersion = version || extractVersion(html);
  if (!detectedVersion) {
    steps.push({
      name: 'Version Detection',
      status: 'failed',
      message: 'Could not detect version',
      details:
        'The instance HTML does not contain version metadata. Ensure the instance is running a proper Agam Space build.',
    });
    throw {
      steps,
      message:
        'Could not detect version from instance. The instance may not have version metadata.',
    };
  }
  steps.push({
    name: 'Version Detection',
    status: 'success',
    message: `Detected version: ${detectedVersion}`,
  });

  // Step 2: Validate that it's a release version (not dev/commit)
  if (!isValidReleaseVersion(detectedVersion)) {
    const errorMsg = getVersionErrorMessage(detectedVersion);
    steps.push({
      name: 'Release Version Check',
      status: 'failed',
      message: 'Not a release version',
      details: errorMsg,
    });
    throw { steps, message: errorMsg };
  }
  steps.push({
    name: 'Release Version Check',
    status: 'success',
    message: 'Valid release version format',
  });

  // Step 2.5: Check if version supports manifest (v0.2.7+)
  if (isVersionBefore(detectedVersion, '0.2.7')) {
    steps.push({
      name: 'Manifest Availability',
      status: 'failed',
      message: 'Version too old for verification',
      details: `Version ${detectedVersion} is before v0.2.7. Integrity verification is only available for v0.2.7 and later releases.`,
    });
    throw {
      steps,
      message: `This instance is running ${detectedVersion}, which is before v0.2.7. Integrity verification is only available for v0.2.7 and later.`,
    };
  }

  // Step 3: Extract commit
  const commit = extractCommit(html) || 'unknown';
  steps.push({
    name: 'Commit Detection',
    status: commit !== 'unknown' ? 'success' : 'warning',
    message:
      commit !== 'unknown' ? `Build commit: ${commit.substring(0, 7)}` : 'Commit hash not found',
  });

  // Step 4: Parse integrity hashes from HTML
  const instanceHashes = parseIntegrityHashes(html);
  if (Object.keys(instanceHashes).length === 0) {
    steps.push({
      name: 'Integrity Hashes',
      status: 'failed',
      message: 'No integrity hashes found',
      details:
        'The HTML does not contain any script or style tags with integrity attributes (SRI).',
    });
    throw { steps, message: 'No integrity hashes found in the instance HTML.' };
  }
  steps.push({
    name: 'Integrity Hashes',
    status: 'success',
    message: `Found ${Object.keys(instanceHashes).length} files with integrity hashes`,
  });

  // Step 5: Fetch official manifest
  let manifest;
  try {
    manifest = await fetchOfficialManifest(detectedVersion);
    steps.push({
      name: 'Official Manifest',
      status: 'success',
      message: `Downloaded manifest for ${detectedVersion}`,
    });
  } catch (error) {
    steps.push({
      name: 'Official Manifest',
      status: 'failed',
      message: 'Failed to fetch official manifest',
      details:
        error instanceof Error
          ? error.message
          : 'Could not download the official release integrity manifest from GitHub.',
    });
    throw {
      steps,
      message: error instanceof Error ? error.message : 'Failed to fetch official manifest',
    };
  }

  // Step 6: Verify ALL HTML files
  const htmlFiles = Object.keys(manifest.assets).filter(path => path.endsWith('.html'));

  if (instanceUrl !== 'manual-verification') {
    // URL mode: fetch and verify all HTML routes
    const { HTML_ROUTE_MAPPINGS } = await import('./route-mappings');

    steps.push({
      name: 'HTML Discovery',
      status: 'success',
      message: `Will verify ${HTML_ROUTE_MAPPINGS.length} HTML files`,
    });

    for (const route of HTML_ROUTE_MAPPINGS) {
      const routeUrl = `${instanceUrl}${route.sampleUrl}`;

      try {
        const response = await fetch(`/api/proxy?url=${encodeURIComponent(routeUrl)}`);
        if (!response.ok) {
          steps.push({
            name: `HTML: ${route.htmlPath}`,
            status: 'failed',
            message: `Failed to fetch (HTTP ${response.status})`,
          });
          throw { steps, message: `Failed to fetch ${route.htmlPath}` };
        }

        const routeHtml = await response.text();

        const encoder = new TextEncoder();
        const data = encoder.encode(routeHtml);
        const hashBuffer = await crypto.subtle.digest('SHA-384', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const htmlHash = btoa(String.fromCharCode(...hashArray));

        const expectedHash = manifest.assets[route.htmlPath];
        if (!expectedHash) {
          steps.push({
            name: `HTML: ${route.htmlPath}`,
            status: 'failed',
            message: 'Not found in manifest',
          });
          throw { steps, message: `${route.htmlPath} not in manifest` };
        }

        if (expectedHash !== `sha384-${htmlHash}`) {
          steps.push({
            name: `HTML: ${route.htmlPath}`,
            status: 'failed',
            message: 'Hash mismatch - modified!',
          });
          throw { steps, message: `${route.htmlPath} has been tampered with` };
        }

        steps.push({
          name: `HTML: ${route.htmlPath}`,
          status: 'success',
          message: 'Verified ✓',
        });
      } catch (error) {
        if (error && typeof error === 'object' && 'steps' in error) {
          throw error;
        }
        steps.push({
          name: `HTML: ${route.htmlPath}`,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Verification failed',
        });
        throw { steps, message: `Failed to verify ${route.htmlPath}` };
      }
    }
  } else {
    // Manual mode: verify single HTML
    let htmlHash: string;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(html);
      const hashBuffer = await crypto.subtle.digest('SHA-384', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      htmlHash = btoa(String.fromCharCode(...hashArray));
    } catch (error) {
      steps.push({
        name: 'HTML Integrity',
        status: 'failed',
        message: 'Failed to calculate hash',
      });
      throw { steps, message: 'Failed to calculate HTML hash' };
    }

    const matchingHtmlPath = htmlFiles.find(path => {
      const expectedHash = manifest.assets[path];
      return expectedHash === `sha384-${htmlHash}`;
    });

    if (!matchingHtmlPath) {
      steps.push({
        name: 'HTML Integrity',
        status: 'failed',
        message: 'HTML does not match official release',
        details:
          'Manual mode: only verified the HTML you provided. Use URL mode for complete verification.',
      });
      throw { steps, message: 'HTML verification failed' };
    }

    steps.push({
      name: 'HTML Integrity',
      status: 'success',
      message: `Verified: ${matchingHtmlPath}`,
      details: 'Manual mode: only this HTML verified. Use URL mode for all routes.',
    });
  }

  // Step 7: Compare external resource hashes (JS/CSS)
  const comparison = compareHashes(instanceHashes, manifest.assets);
  const isAuthentic = comparison.modifiedFiles.length === 0 && comparison.missingFiles.length === 0;

  if (isAuthentic) {
    steps.push({
      name: 'Hash Comparison',
      status: 'success',
      message: `All ${comparison.matchedFiles} files match official release`,
    });
  } else {
    const issues = [];
    if (comparison.modifiedFiles.length > 0) {
      issues.push(`${comparison.modifiedFiles.length} modified`);
    }
    if (comparison.missingFiles.length > 0) {
      issues.push(`${comparison.missingFiles.length} missing`);
    }
    steps.push({
      name: 'Hash Comparison',
      status: 'failed',
      message: `Files don't match: ${issues.join(', ')}`,
      details: 'Some files have been modified or are missing compared to the official release.',
    });
  }

  return {
    success: true,
    authentic: isAuthentic,
    instanceUrl,
    version: detectedVersion,
    commit,
    totalFiles: Object.keys(instanceHashes).length,
    matchedFiles: comparison.matchedFiles,
    modifiedFiles: comparison.modifiedFiles,
    missingFiles: comparison.missingFiles,
    extraFiles: comparison.extraFiles,
    details: comparison.details,
    steps,
  };
}

async function fetchInstanceHTML(instanceUrl: string): Promise<string> {
  const url = instanceUrl.endsWith('/') ? instanceUrl : `${instanceUrl}/`;

  try {
    // Direct fetch with CORS - Agam instances now support CORS for root path
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        Accept: 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch instance (HTTP ${response.status})`);
    }

    const html = await response.text();

    // Basic HTML validation
    if (!html.toLowerCase().includes('<html') && !html.toLowerCase().includes('<!doctype')) {
      throw new Error('Response does not appear to be valid HTML');
    }

    return html;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to instance. Possible reasons: (1) Instance is offline or unreachable, (2) Instance is behind authentication/VPN - try Manual HTML mode, (3) Instance has ALLOW_CORS_FOR_INTEGRITY_VERIFICATION disabled.'
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch instance');
  }
}

function compareHashes(
  instanceHashes: Record<string, string>,
  officialHashes: Record<string, string>
) {
  const details: FileComparison[] = [];
  const modifiedFiles: string[] = [];
  const missingFiles: string[] = [];
  const extraFiles: string[] = [];
  let matchedFiles = 0;

  for (const [path, officialHash] of Object.entries(officialHashes)) {
    const instanceHash = instanceHashes[path];

    if (!instanceHash) {
      missingFiles.push(path);
      details.push({ path, instanceHash: null, officialHash, status: 'missing' });
    } else if (instanceHash !== officialHash) {
      modifiedFiles.push(path);
      details.push({ path, instanceHash, officialHash, status: 'modified' });
    } else {
      matchedFiles++;
      details.push({ path, instanceHash, officialHash, status: 'match' });
    }
  }

  for (const path of Object.keys(instanceHashes)) {
    if (!officialHashes[path]) {
      extraFiles.push(path);
      details.push({
        path,
        instanceHash: instanceHashes[path],
        officialHash: null,
        status: 'extra',
      });
    }
  }

  return { matchedFiles, modifiedFiles, missingFiles, extraFiles, details };
}
