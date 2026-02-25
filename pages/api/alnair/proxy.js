/**
 * Alnair API Proxy
 * Routes all Alnair API calls through the backend to bypass CORS issues.
 *
 * Problem: Cloudflare on api.alnair.ae uses TLS fingerprinting (JA3/JA4) to block
 * server-side requests. Node.js's default TLS stack is identified as a bot.
 *
 * Solution: Use curl subprocess with Chrome-matching TLS settings. Curl with the
 * correct cipher suite order passes Cloudflare's JA3 fingerprint check successfully.
 *
 * Flow: Browser → Next.js Proxy → curl (Chrome TLS) → Alnair API
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ALNAIR_API_BASE = 'https://api.alnair.ae';
const AUTH_TOKEN = process.env.ALNAIR_AUTH_TOKEN;

/**
 * Make a request to Alnair API using curl with Chrome-like TLS settings.
 * This passes Cloudflare's JA3 fingerprint check.
 */
async function fetchWithCurl(url, authToken, userAgent) {
  const args = [
    '--silent',
    '--compressed',           // Handle gzip/br automatically
    '--max-time', '15',
    '--tlsv1.2',
    // Chrome's TLS 1.3 cipher order
    '--tls13-ciphers', 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
    // Chrome's TLS 1.2 cipher order
    '--ciphers', [
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
    ].join(':'),
    '-H', `Authorization: ${authToken}`,
    '-H', 'Accept: application/json, text/plain, */*',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-H', `User-Agent: ${userAgent}`,
    '-H', 'Sec-Fetch-Dest: empty',
    '-H', 'Sec-Fetch-Mode: cors',
    '-H', 'Sec-Fetch-Site: same-site',
    '-w', '\n__HTTP_STATUS__%{http_code}',  // Append status code at end
    url,
  ];

  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer

  // Parse status code from end of output
  const statusMatch = stdout.match(/\n__HTTP_STATUS__(\d+)$/);
  const status = statusMatch ? parseInt(statusMatch[1]) : 0;
  const body = stdout.replace(/\n__HTTP_STATUS__\d+$/, '');

  return { status, body };
}

export default async function handler(req, res) {
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method POST required' });
  }

  try {
    const { endpoint, queryParams = {} } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    if (!AUTH_TOKEN) {
      return res.status(500).json({ error: 'Alnair auth token is not configured' });
    }

    // Construct full URL
    const url = new URL(`${ALNAIR_API_BASE}${endpoint}`);

    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const fullUrl = url.toString();
    console.log(`[Proxy] Request to: ${fullUrl}`);

    // Use the real browser User-Agent from the incoming request
    const userAgent =
      req.headers['user-agent'] ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    const { status, body } = await fetchWithCurl(fullUrl, AUTH_TOKEN, userAgent);

    console.log(`[Proxy] Response status: ${status}`);

    if (status < 200 || status >= 300) {
      console.error(`Alnair API Error: ${status}`);
      console.error(`Response: ${body.substring(0, 200)}`);

      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(status || 502).json({
        error: `Alnair API Error: ${status}`,
        details: body.substring(0, 500),
      });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse Alnair response as JSON:', body.substring(0, 200));
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({
        error: 'Invalid JSON response from Alnair API',
        details: body.substring(0, 200),
      });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Failed to fetch from Alnair API',
      message: error.message,
    });
  }
}
