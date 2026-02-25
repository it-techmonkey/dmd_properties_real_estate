#!/usr/bin/env node
/**
 * Pre-fetch Alnair project data at build time.
 *
 * This script runs LOCALLY (via `npm run prebuild`) before the Next.js build.
 * It fetches all Alnair project data using curl (which bypasses Cloudflare from
 * a local/residential IP) and saves it to public/alnair-data.json.
 *
 * On Vercel, the build uses the committed public/alnair-data.json file instead
 * of making live API calls. This completely avoids the Cloudflare 403 issue.
 *
 * Usage:
 *   npm run fetch-alnair   # manually refresh data
 *   npm run build          # automatically runs this via prebuild if on local machine
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUTH_TOKEN = process.env.ALNAIR_AUTH_TOKEN;
const OUTPUT_FILE = path.join(__dirname, '../public/alnair-data.json');
const API_BASE = 'https://api.alnair.ae';

if (!AUTH_TOKEN) {
  // On Vercel CI, this script is skipped (ALNAIR_AUTH_TOKEN won't be set in build env)
  // The pre-committed alnair-data.json will be used instead.
  console.log('[fetch-alnair] No ALNAIR_AUTH_TOKEN — skipping pre-fetch (using existing data)');
  process.exit(0);
}

function curlFetch(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[fetch-alnair] Fetching: ${url}`);

  const result = execFileSync('curl', [
    '--silent', '--compressed', '--max-time', '30',
    '--tlsv1.2',
    '--tls13-ciphers', 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
    '--ciphers', 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA',
    '-H', `Authorization: ${AUTH_TOKEN}`,
    '-H', 'Accept: application/json',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    url,
  ], { maxBuffer: 50 * 1024 * 1024 });

  return JSON.parse(result.toString());
}

async function fetchAllProjects() {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = curlFetch(`/project/find?limit=100&page=${page}`);
    const items = data?.data?.items || [];
    allItems.push(...items);

    const count = data?.data?.count || items.length;
    totalPages = Math.ceil(count / 100);

    console.log(`[fetch-alnair] Page ${page}/${totalPages} — got ${items.length} items (total so far: ${allItems.length})`);
    page++;
  } while (page <= totalPages && page <= 10); // max 10 pages safety

  return allItems;
}

(async () => {
  console.log('[fetch-alnair] Starting Alnair data pre-fetch...');
  const startTime = Date.now();

  try {
    const projects = await fetchAllProjects();
    console.log(`[fetch-alnair] Fetched ${projects.length} projects total`);

    const output = {
      fetchedAt: new Date().toISOString(),
      count: projects.length,
      projects,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`[fetch-alnair] Saved to ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`);
    console.log(`[fetch-alnair] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error('[fetch-alnair] Failed:', err.message);
    // Don't crash the build if existing data exists
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log('[fetch-alnair] Using existing cached data instead');
    } else {
      console.error('[fetch-alnair] No cached data exists. Build may fail.');
      process.exit(1);
    }
  }
})();
