#!/usr/bin/env node

// Precompute separate SVG paths for "A" and "a" glyphs.
// Each glyph gets its own complete path (outer + inner combined).
// MorphSVG morphs A→A and a→a independently — no cross-contamination.
//
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
  return new Promise((resolve, reject) => {
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
  if (!ttfUrl) { console.log(`  SKIP — no TTF URL`); return null; }

  const buffer = await fetchUrl(ttfUrl);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  // Get "A" and "a" as separate glyphs with separate paths
  const glyphA = font.charToGlyph('A');
  const glypha = font.charToGlyph('a');

  // Get advance width for "A" to position "a" correctly
  const scale = FONT_SIZE / font.unitsPerEm;
  const advanceA = (glyphA.advanceWidth || 0) * scale;

  const pathA = glyphA.getPath(0, BASELINE_Y, FONT_SIZE);
  const patha = glypha.getPath(advanceA, BASELINE_Y, FONT_SIZE);

  const dA = pathA.toPathData(2);
  const da = patha.toPathData(2);
  const full = dA + da;

  console.log(`  A: ${dA.length} chars, a: ${da.length} chars`);

  return { A: dA, a: da, full };
}

async function main() {
  const results = {};
  let success = 0;

  for (const fontName of FONTS) {
    try {
      const data = await processFont(fontName);
      if (data) { results[fontName] = data; success++; }
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
    }
  }

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'font-path-data.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nDone: ${success}/${FONTS.length}`);
  console.log(`Saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)}KB)`);
}

main().catch(console.error);
