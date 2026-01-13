import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Agam-Space-Verifier/1.0',
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch instance (HTTP ${response.status})` });
    }

    const html = await response.text();

    return res.status(200).json({ html });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch instance HTML' });
  }
}
