import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { version } = req.query;

  if (!version || typeof version !== 'string') {
    return res.status(400).json({ error: 'Version parameter is required' });
  }

  try {
    // Ensure version has 'v' prefix
    const versionWithPrefix = version.startsWith('v') ? version : `v${version}`;
    const manifestUrl = `https://github.com/agam-space/agam-space/releases/download/${versionWithPrefix}/integrity-manifest.json`;
    const response = await fetch(manifestUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch manifest from GitHub' });
    }

    const manifest = await response.json();

    return res.status(200).json(manifest);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch manifest' });
  }
}
