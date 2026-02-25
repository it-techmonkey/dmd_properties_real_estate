#!/usr/bin/env node
/**
 * Batch-fetch project descriptions — FAST parallel version using async exec.
 * Reads slugs from all_data.json, fetches via curl in parallel (CONCURRENCY at a time),
 * saves { slug: htmlDescription } map to public/descriptions.json.
 * Resumes progress from existing file automatically.
 *
 * Usage: npm run fetch-descriptions
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load env from .env.local
try {
  const envFile = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }
} catch {}

const AUTH_TOKEN = process.env.ALNAIR_AUTH_TOKEN;
if (!AUTH_TOKEN) { console.error('ALNAIR_AUTH_TOKEN not set'); process.exit(1); }

const ALL_DATA_PATH = path.join(__dirname, '../all_data.json');
const OUTPUT_PATH = path.join(__dirname, '../public/descriptions.json');
const API_BASE = 'https://api.alnair.ae';
const CONCURRENCY = 15; // true parallel requests

const allData = JSON.parse(fs.readFileSync(ALL_DATA_PATH, 'utf-8'));
const items = allData?.data?.items || [];
const slugs = [...new Set(items.map(p => p.slug).filter(Boolean))];

let existing = {};
if (fs.existsSync(OUTPUT_PATH)) {
  try { existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8')); } catch {}
}

const done = Object.keys(existing).length;
console.log(`[fetch-descriptions] ${slugs.length} total slugs | ${done} already done | ${slugs.length - done} remaining`);

function fetchOne(slug) {
  return new Promise((resolve) => {
    const url = `${API_BASE}/project/look/${slug}`;
    const curlCmd = [
      'curl --silent --compressed --max-time 12 --tlsv1.2',
      '--tls13-ciphers "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256"',
      '--ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA"',
      `-H "Authorization: ${AUTH_TOKEN}"`,
      `-H "Accept: application/json"`,
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"`,
      `"${url}"`,
    ].join(' ');

    exec(curlCmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve({ slug, desc: null });
      try {
        const json = JSON.parse(stdout);
        resolve({ slug, desc: json?.description || null });
      } catch {
        resolve({ slug, desc: null });
      }
    });
  });
}

async function run() {
  const pending = slugs.filter(s => !(s in existing));
  let processed = 0;
  let withDesc = Object.values(existing).filter(Boolean).length;
  let noDesc = done - withDesc;

  const startTime = Date.now();

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchOne));

    for (const { slug, desc } of results) {
      existing[slug] = desc || '';
      if (desc) withDesc++; else noDesc++;
    }
    processed += batch.length;

    // Save every batch
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (processed / ((Date.now() - startTime) / 1000)).toFixed(1);
    process.stdout.write(`\r[${elapsed}s] ${processed}/${pending.length} | ✓ desc: ${withDesc} | ✗ no-desc: ${noDesc} | ${rate}/s   `);
  }

  console.log(`\n[fetch-descriptions] DONE — saved to ${OUTPUT_PATH}`);
  console.log(`[fetch-descriptions] Total: ${Object.keys(existing).length} | With description: ${withDesc} | Without: ${noDesc}`);
  console.log(`[fetch-descriptions] File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(0)} KB`);
}

run().catch(e => { console.error(e); process.exit(1); });
