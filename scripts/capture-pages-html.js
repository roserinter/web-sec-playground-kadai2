#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');
const { URL } = require('url');

const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'html');
const URLS = [
  { url: 'http://localhost:3000/', name: 'home.html' },
  { url: 'http://localhost:3000/signup', name: 'signup_strength.html' },
  { url: 'http://localhost:3000/login', name: 'login_page.html' },
  { url: 'http://localhost:3000/me/security', name: 'login_history.html' },
  { url: 'http://localhost:3000/admin/users', name: 'locked_users.html' },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const reqLib = parsed.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = reqLib(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + (parsed.search || ''),
          timeout: timeoutMs,
          headers: { 'User-Agent': 'capture-pages-html/1.0' },
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body }));
        }
      );
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('timeout'));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

(async () => {
  for (const u of URLS) {
    const outPath = path.join(OUT_DIR, u.name);
    try {
      console.log('Fetching', u.url);
      const res = await fetchUrl(u.url, 15000);
      if (res.status >= 200 && res.status < 400) {
        fs.writeFileSync(outPath, res.body, 'utf8');
        console.log('Saved', outPath, `(status ${res.status})`);
      } else {
        const errPath = outPath + '.txt';
        fs.writeFileSync(errPath, `Failed: status ${res.status}`);
        console.error('Failed', u.url, 'status', res.status);
      }
    } catch (err) {
      const errPath = outPath + '.txt';
      fs.writeFileSync(errPath, `Error: ${err && err.message ? err.message : err}`);
      console.error('Error fetching', u.url, err && err.message ? err.message : err);
    }
  }
})();
