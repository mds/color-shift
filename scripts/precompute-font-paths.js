#!/usr/bin/env node

// Precompute SVG path data for "Aa" in all specimen fonts.
// Run: node scripts/precompute-font-paths.js
// Output: src/lib/font-path-data.json

const opentype = require('opentype.js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS = [
  'Playfair Display', 'DM Serif Display', 'Instrument Serif', 'Fraunces',
  'Crimson Pro', 'Source Serif 4', 'Literata', 'Lora',
  'Space Mono', 'JetBrains Mono', 'Syne', 'Bricolage Grotesque',
  'Outfit', 'Familjen Grotesk', 'Space Grotesk', 'Hanken Grotesk',
  'Libre Baskerville', 'Cormorant Garamond', 'Bodoni Moda', 'Sorts Mill Goudy',
];

const TEXT = 'Aa';
const FONT_SIZE = 200;
const BASELINE_Y = FONT_SIZE * 0.8;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getTtfUrl(fontName) {
  const encoded = fontName.replace(/ /g, '+');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;

  return new Promise((resolve, reject) => {
    // Use CSS v1 API (not css2) — always returns TTF URLs
    const options = {
      hostname: 'fonts.googleapis.com',
      path: `/css?family=${encoded}`,
    };

    https.get(options, (res) => {
      let css = '';
      res.on('data', d => css += d);
      res.on('end', () => {
        const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
        resolve(match ? match[1] : null);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function processFont(fontName) {
  console.log(`Processing ${fontName}...`);

  const ttfUrl = await getTtfUrl(fontName);
  if (!ttfUrl) { console.log(`  SKIP — no TTF URL found`); return null; }

  const buffer = await fetchUrl(ttfUrl);
  console.log(`  Downloaded ${buffer.length} bytes`);

  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const fontPath = font.getPath(TEXT, 0, BASELINE_Y, FONT_SIZE);
  const pathData = fontPath.toPathData(2);

  console.log(`  Path: ${pathData.length} chars`);
  return pathData;
}

async function main() {
  const results = {};
  let success = 0;
  let fail = 0;

  for (const fontName of FONTS) {
    try {
      const pathData = await processFont(fontName);
      if (pathData) {
        results[fontName] = pathData;
        success++;
      } else {
        fail++;
      }
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
      fail++;
    }
  }

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'font-path-data.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nDone: ${success} succeeded, ${fail} failed`);
  console.log(`Saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)}KB)`);
}

main().catch(console.error);
