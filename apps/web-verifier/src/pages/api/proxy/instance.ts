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
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch instance (HTTP ${response.status})` });
    }

    const html = await response.text();

    // Return raw HTML without any processing to preserve exact formatting
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200);
    res.end(html);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch instance HTML' });
  }
}
