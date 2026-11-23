import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeGarmentRequest } from './src/server/analyzeGarment.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/stylist/analyze', async (req, res) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const result = await analyzeGarmentRequest(body);
    return res.status(result.status).json(result.body);
  });

  // Always return JSON (never HTML) for unknown /api routes
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Ensure body-parser & Express errors on /api/* always return JSON instead of HTML
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      return next(err);
    }
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status)
        : 500;
    const type =
      typeof err === 'object' && err !== null && 'type' in err
        ? String((err as { type?: string }).type)
        : '';

    if (status === 413 || type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Image upload is too large. Please try a smaller photograph.',
      });
    }
    if (status === 400 || type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Invalid request payload. Please re-upload your photograph and try again.',
      });
    }
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Unexpected server error while processing your request.',
    });
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atelier Edit server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
