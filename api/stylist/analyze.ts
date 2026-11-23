import { analyzeGarmentRequest } from '../../src/server/analyzeGarment.ts';

interface VercelRequestLike {
  method?: string;
  body?: unknown;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let parsedBody: Record<string, unknown>;
  if (typeof req.body === 'string') {
    try {
      parsedBody = JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request payload.' });
    }
  } else if (req.body && typeof req.body === 'object') {
    parsedBody = req.body as Record<string, unknown>;
  } else {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const result = await analyzeGarmentRequest(parsedBody);
  return res.status(result.status).json(result.body);
}
