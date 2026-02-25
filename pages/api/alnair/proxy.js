/**
 * Alnair API Proxy
 *
 * Problem: Cloudflare on api.alnair.ae uses TLS fingerprinting (JA3/JA4) to
 * block server-side requests. Node.js's default TLS stack is identified as a bot.
 *
 * Solution:
 *  1. PRIMARY: Node.js native https with Chrome-matching TLS cipher suites.
 *     Works on Vercel (Node.js 18+ serverless) without any external dependencies.
 *  2. FALLBACK: curl subprocess with Chrome TLS flags (works on macOS locally).
 *
 * Flow: Browser → Next.js API Route → Node.js https / curl → Alnair API
 */

import https from 'node:https';
import { execFile } from 'child_process';
import { promisify } from 'util';
import zlib from 'node:zlib';

const execFileAsync = promisify(execFile);

const ALNAIR_API_BASE = 'https://api.alnair.ae';
const ALNAIR_HOST = 'api.alnair.ae';
const AUTH_TOKEN = process.env.ALNAIR_AUTH_TOKEN;

// Chrome 121 TLS 1.2 cipher suite order (matches JA3 fingerprint)
const CHROME_CIPHERS = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'ECDHE-RSA-AES128-SHA',
  'ECDHE-RSA-AES256-SHA',
  'AES128-GCM-SHA256',
  'AES256-GCM-SHA384',
  'AES128-SHA',
  'AES256-SHA',
].join(':');

/**
 * Primary: Fetch via Node.js native https with Chrome-matching TLS settings.
 * On Vercel/Node 18+, this uses OpenSSL which supports the cipher list above.
 */
function fetchWithNodeHttps(url, authToken, userAgent) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        Authorization: authToken,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': userAgent,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
      },
      // Chrome-like TLS settings
      minVersion: 'TLSv1.2',
      ciphers: CHROME_CIPHERS,
      // Disable session tickets to avoid fingerprinting by session ticket extension
      honorCipherOrder: true,
    };

    const req = https.get(options, (res) => {
      const status = res.statusCode;
      const encoding = res.headers['content-encoding'];
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Decompress if needed
        const decompress = (buf) => {
          return new Promise((res, rej) => {
            if (encoding === 'br') {
              zlib.brotliDecompress(buf, (e, d) => (e ? rej(e) : res(d.toString())));
            } else if (encoding === 'gzip') {
              zlib.gunzip(buf, (e, d) => (e ? rej(e) : res(d.toString())));
            } else if (encoding === 'deflate') {
              zlib.inflate(buf, (e, d) => (e ? rej(e) : res(d.toString())));
            } else {
              res(buf.toString('utf-8'));
            }
          });
        };

        decompress(buffer).then((body) => resolve({ status, body })).catch(reject);
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Fallback: Fetch via curl (works on macOS locally with LibreSSL Chrome fingerprint).
 * curl is also available on Vercel Linux but might have a different JA3 than Node.js.
 */
async function fetchWithCurl(url, authToken, userAgent) {
  const args = [
    '--silent',
    '--compressed',
    '--max-time', '15',
    '--tlsv1.2',
    '--tls13-ciphers', 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
    '--ciphers', [
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-RSA-AES256-SHA',
    ].join(':'),
    '-H', `Authorization: ${authToken}`,
    '-H', 'Accept: application/json, text/plain, */*',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-H', `User-Agent: ${userAgent}`,
    '-H', 'Sec-Fetch-Dest: empty',
    '-H', 'Sec-Fetch-Mode: cors',
    '-H', 'Sec-Fetch-Site: same-site',
    '-w', '\n__HTTP_STATUS__%{http_code}',
    url,
  ];

  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 10 * 1024 * 1024 });

  const statusMatch = stdout.match(/\n__HTTP_STATUS__(\d+)$/);
  const status = statusMatch ? parseInt(statusMatch[1]) : 0;
  const body = stdout.replace(/\n__HTTP_STATUS__\d+$/, '');

  return { status, body };
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method POST required' });
  }

  try {
    const { endpoint, queryParams = {} } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    if (!AUTH_TOKEN) {
      return res.status(500).json({ error: 'ALNAIR_AUTH_TOKEN is not configured in environment variables' });
    }

    // Construct full URL with query params
    const url = new URL(`${ALNAIR_API_BASE}${endpoint}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const fullUrl = url.toString();
    console.log(`[Proxy] → ${fullUrl}`);

    const userAgent =
      req.headers['user-agent'] ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    // Try Node.js native https first (primary — works on Vercel)
    let result;
    try {
      result = await fetchWithNodeHttps(fullUrl, AUTH_TOKEN, userAgent);
      console.log(`[Proxy] Node.js https → status ${result.status}`);
    } catch (nodeErr) {
      console.warn('[Proxy] Node.js https failed, falling back to curl:', nodeErr.message);
      try {
        result = await fetchWithCurl(fullUrl, AUTH_TOKEN, userAgent);
        console.log(`[Proxy] curl → status ${result.status}`);
      } catch (curlErr) {
        console.error('[Proxy] Both methods failed:', curlErr.message);
        throw curlErr;
      }
    }

    const { status, body } = result;

    if (status < 200 || status >= 300) {
      console.error(`[Proxy] Alnair error ${status}: ${body.substring(0, 300)}`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(status || 502).json({
        error: `Alnair API Error: ${status}`,
        details: body.substring(0, 500),
      });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.error('[Proxy] Non-JSON response:', body.substring(0, 200));
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({
        error: 'Invalid JSON from Alnair API',
        details: body.substring(0, 200),
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Cache at CDN edge for 5 min, stale-while-revalidate 60s
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Proxy] Fatal error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Proxy failed to reach Alnair API',
      message: error.message,
    });
  }
}
