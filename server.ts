/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleChippieRequest, handleChippieBriefing } from './api/_lib/chippieCore';

dotenv.config();
dotenv.config({ path: '.env.local' }); // NIM_API_KEY / CHIPPIE_* live here in local dev

const app = express();
app.use(express.json());

const PORT = 3000;

// 1. API Route: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1b. API Route: Chippie (NVIDIA NIM-backed advisor) — mirrors api/chippie.ts
app.post('/api/chippie', async (req, res) => {
  const { status, body } = await handleChippieRequest(req.body);
  res.status(status).json(body);
});

// 1c. API Route: Chippie one-shot briefings — mirrors api/chippie-brief.ts
app.post('/api/chippie-brief', async (req, res) => {
  const { status, body } = await handleChippieBriefing(req.body);
  res.status(status).json(body);
});

// 2. Vite Dev Server Setup or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    process.env.VITE_EMBEDDED = 'true'; // disable /api proxy in vite.config.ts (express handles /api here)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Siliconomics Dev Server running on http://localhost:${PORT}`);
  });
}

startServer();
