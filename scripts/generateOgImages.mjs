/**
 * Build-time OG image generator.
 * Generates static OG images for each top-level page.
 * Uses SVG and creates a local HTML preview for visual review.
 *
 * Run: node scripts/generateOgImages.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OG_DIR = join(__dirname, '..', 'public', 'og');

if (!existsSync(OG_DIR)) {
  mkdirSync(OG_DIR, { recursive: true });
}

const PAGES = [
  { slug: 'home', title: 'Siliconomics', subtitle: 'The decision system for silicon economics', metric: 'Traceable decision support' },
  { slug: 'platform', title: 'Platform', subtitle: 'Deterministic silicon program modeling', metric: 'From model to decision' },
  { slug: 'solutions', title: 'Solutions', subtitle: 'One shared basis for hard silicon decisions', metric: 'Cross-functional program view' },
  { slug: 'methodology', title: 'Methodology', subtitle: 'Open math, auditable computations', metric: 'Murphy·SIA v4.3' },
  { slug: 'pricing', title: 'Pricing', subtitle: 'No dark patterns. No countdown timers.', metric: 'From $0' },
  { slug: 'trust', title: 'Trust', subtitle: 'Transparent data handling', metric: 'Clear AI and data boundaries' },
  { slug: 'partners', title: 'Partners', subtitle: 'Design Partner Program', metric: 'Active program focus' },
  { slug: 'investors', title: 'Investors', subtitle: 'The decision layer for silicon economics', metric: 'Design partner-led execution' },
  { slug: 'insights', title: 'Insights', subtitle: 'Deterministic teardowns & analysis', metric: 'Live engine data' },
  { slug: 'company', title: 'About', subtitle: 'Engineering excellence deserves executive-grade software', metric: 'Build · Compute · Decide' },
];

for (const page of PAGES) {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0D1117"/>
  <line x1="60" y1="80" x2="1140" y2="80" stroke="rgba(240,246,252,0.08)" stroke-width="1"/>
  <text x="60" y="120" font-family="Georgia, serif" font-size="16" font-weight="700" letter-spacing="2" fill="#00BFA6">DETERMINISTIC ENGINEERING ECONOMICS</text>
  <text x="60" y="220" font-family="Georgia, serif" font-size="64" font-weight="900" letter-spacing="-1" fill="#F0F6FC">${page.title}</text>
  <text x="60" y="290" font-family="Inter, sans-serif" font-size="22" fill="rgba(240,246,252,0.6)">${page.subtitle}</text>
  <rect x="60" y="340" width="2" height="60" fill="#00BFA6"/>
  <text x="80" y="380" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#00BFA6">${page.metric}</text>
  <text x="60" y="440" font-family="'JetBrains Mono', monospace" font-size="12" fill="rgba(240,246,252,0.4)">DETERMINISTIC · REPRODUCIBLE · FORMULA SET MURPHY-SIA-v4.3</text>
  <line x1="60" y1="460" x2="1140" y2="460" stroke="rgba(240,246,252,0.08)" stroke-width="1"/>
  <text x="60" y="490" font-family="'JetBrains Mono', monospace" font-size="12" fill="rgba(240,246,252,0.3)">siliconomics-app.vercel.app</text>
</svg>`;

  writeFileSync(join(OG_DIR, `${page.slug}.svg`), svg, 'utf-8');
  console.log(`Generated OG: ${page.slug}.svg`);
}

// Also generate a simple HTML version that embeds the SVG
const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>OG Preview</title></head>
<body style="margin:0;background:#0D1117">
${PAGES.map(p => `<div style="margin:20px;display:inline-block;border:1px solid rgba(240,246,252,0.1);border-radius:8px;overflow:hidden;">
  <img src="${p.slug}.svg" width="600" height="315" alt="${p.title}"/>
  <p style="color:#F0F6FC;font-family:monospace;font-size:12px;padding:8px;margin:0;background:#161B22">${p.slug}</p>
</div>`).join('\n')}
</body>
</html>`;

writeFileSync(join(OG_DIR, 'preview.html'), html, 'utf-8');
console.log('Generated OG preview.html');
