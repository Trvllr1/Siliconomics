/**
 * Build-time sitemap.xml and robots.txt generator.
 * Run: node scripts/generateSitemap.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const SITE_URL = 'https://siliconomics-app.vercel.app';

function extractSlugs(filePath) {
  const source = readFileSync(filePath, 'utf-8');
  return [...source.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
}

const insightSlugs = extractSlugs(join(__dirname, '..', 'src', 'site', 'content', 'insights', 'first-teardown.ts'));
const stakeholderSlugs = extractSlugs(join(__dirname, '..', 'src', 'site', 'content', 'pages.ts'));

const PAGES = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'platform', priority: '0.9', changefreq: 'monthly' },
  { path: 'decision-system', priority: '0.9', changefreq: 'monthly' },
  { path: 'solutions', priority: '0.8', changefreq: 'monthly' },
  { path: 'methodology', priority: '0.9', changefreq: 'monthly' },
  { path: 'pricing', priority: '0.8', changefreq: 'monthly' },
  { path: 'trust', priority: '0.8', changefreq: 'monthly' },
  { path: 'partners', priority: '0.7', changefreq: 'monthly' },
  { path: 'investors', priority: '0.7', changefreq: 'monthly' },
  { path: 'insights', priority: '0.9', changefreq: 'weekly' },
  ...insightSlugs.map((slug) => ({ path: `insights/${slug}`, priority: '0.8', changefreq: 'monthly' })),
  ...stakeholderSlugs.map((slug) => ({ path: `solutions/${slug}`, priority: '0.7', changefreq: 'monthly' })),
  { path: 'company', priority: '0.6', changefreq: 'monthly' },
  { path: 'privacy', priority: '0.5', changefreq: 'yearly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url>
    <loc>${SITE_URL}/${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf-8');
console.log('Generated sitemap.xml');

const robots = `User-agent: *
Allow: /
Allow: /app
Disallow: /app/*/edit

Sitemap: ${SITE_URL}/sitemap.xml
`;

writeFileSync(join(PUBLIC_DIR, 'robots.txt'), robots, 'utf-8');
console.log('Generated robots.txt');
