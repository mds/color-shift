#!/usr/bin/env node

// Precompute SVG path data for "Aa" in all specimen fonts.
// Splits each glyph into outer contours and inner counters,
// classified by winding direction and sorted by area.
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

// Split a compound SVG path into individual sub-paths (each starts with M)
function splitSubPaths(pathData) {
  const subPaths = [];
  const parts = pathData.split(/(?=M)/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && trimmed.startsWith('M')) {
      subPaths.push(trimmed);
    }
  }
  return subPaths;
}

// Compute signed area of a sub-path using the shoelace formula on the path's points
// Positive area = clockwise (outer), Negative = counter-clockwise (inner)
function computeSignedArea(subPath) {
  // Extract all coordinate pairs from the path
  const coords = [];
  const numbers = subPath.match(/-?\d+\.?\d*/g);
  if (!numbers) return 0;

  for (let i = 0; i < numbers.length - 1; i += 2) {
    coords.push({ x: parseFloat(numbers[i]), y: parseFloat(numbers[i + 1]) });
  }

  if (coords.length < 3) return 0;

  // Shoelace formula
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].x * coords[j].y;
    area -= coords[j].x * coords[i].y;
  }
  return area / 2;
}

// Compute bounding box of a sub-path
function computeBBox(subPath) {
  const numbers = subPath.match(/-?\d+\.?\d*/g);
  if (!numbers) return { x: 0, y: 0, w: 0, h: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = parseFloat(numbers[i]);
    const y = parseFloat(numbers[i + 1]);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function classifyContours(pathData) {
  const subPaths = splitSubPaths(pathData);
  const classified = subPaths.map(sp => {
    const area = computeSignedArea(sp);
    const absArea = Math.abs(area);
    const bbox = computeBBox(sp);
    const isOuter = area >= 0; // clockwise = outer in SVG default coords
    return { path: sp, area, absArea, bbox, isOuter };
  });

  // Sort: outers first (largest first), then inners (largest first)
  const outers = classified.filter(c => c.isOuter).sort((a, b) => b.absArea - a.absArea);
  const inners = classified.filter(c => !c.isOuter).sort((a, b) => b.absArea - a.absArea);

  return {
    outers: outers.map(c => c.path),
    inners: inners.map(c => c.path),
    // Also keep the full path for fallback
    full: pathData,
  };
}

async function processFont(fontName) {
  console.log(`Processing ${fontName}...`);

  const ttfUrl = await getTtfUrl(fontName);
  if (!ttfUrl) { console.log(`  SKIP — no TTF URL found`); return null; }

  const buffer = await fetchUrl(ttfUrl);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const fontPath = font.getPath(TEXT, 0, BASELINE_Y, FONT_SIZE);
  const pathData = fontPath.toPathData(2);

  const contours = classifyContours(pathData);
  console.log(`  Outers: ${contours.outers.length}, Inners: ${contours.inners.length}, Full: ${pathData.length} chars`);

  return contours;
}

async function main() {
  const results = {};
  let success = 0;
  let fail = 0;

  // Find the max number of outers and inners across all fonts
  let maxOuters = 0;
  let maxInners = 0;

  for (const fontName of FONTS) {
    try {
      const contours = await processFont(fontName);
      if (contours) {
        results[fontName] = contours;
        maxOuters = Math.max(maxOuters, contours.outers.length);
        maxInners = Math.max(maxInners, contours.inners.length);
        success++;
      } else {
        fail++;
      }
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nMax outers: ${maxOuters}, Max inners: ${maxInners}`);

  // Pad all fonts to have the same number of outers and inners
  // Missing contours get a tiny dot path so MorphSVG has something to morph
  const DOT = 'M0 0L0.01 0L0.01 0.01L0 0.01Z';
  for (const fontName of Object.keys(results)) {
    const r = results[fontName];
    while (r.outers.length < maxOuters) r.outers.push(DOT);
    while (r.inners.length < maxInners) r.inners.push(DOT);
  }

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'font-path-data.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nDone: ${success} succeeded, ${fail} failed`);
  console.log(`Saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)}KB)`);
}

main().catch(console.error);
