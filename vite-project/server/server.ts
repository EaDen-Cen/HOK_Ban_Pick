import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import heroes from '../src/components/HeroList.js';
import type { Role } from '../src/shared/types.js';
import { Store } from './store.js';

const production = process.env.NODE_ENV === 'production';
const tokens: Record<Role, string> = {
  control: process.env.CONTROL_TOKEN || (production ? '' : 'local-control'),
  caster: process.env.CASTER_TOKEN || (production ? '' : 'local-caster'),
  overlay: process.env.OVERLAY_TOKEN || (production ? '' : 'local-overlay'),
};
if (Object.values(tokens).some(t => !t || (production && t.length < 24)) || new Set(Object.values(tokens)).size !== 3) throw new Error('Set three distinct tokens of at least 24 characters in production');
const roleFor = (token: unknown): Role | undefined => (Object.keys(tokens) as Role[]).find(role => tokens[role] === token);
const project = fileURLToPath(new URL('../', import.meta.url));
const store = new Store(resolve(process.env.DATA_FILE || resolve(project, 'data/match.json')));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
  const json = (status: number, data: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET') { json(405, { error: 'Method not allowed' }); return; }
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health') { json(200, { ok: true }); return; }
    if (url.pathname.startsWith('/api/')) {
      const role = roleFor(req.headers.authorization?.replace(/^Bearer /, ''));
      if (!role) { json(401, { error: 'Access token required' }); return; }
      if (url.pathname === '/api/match') json(200, store.snapshot(role));
      else if (url.pathname === '/api/heroes') json(200, heroes);
      else json(404, { error: 'Not found' });
      return;
    }
    const root = resolve(project, 'dist');
    const route = ['/', '/control', '/caster', '/overlay/draft'].includes(url.pathname);
    const file = resolve(root, route ? 'index.html' : `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(root + '/') && !file.startsWith(root + '\\')) { json(404, { error: 'Not found' }); return; }
    const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { json(404, { error: 'Not found; run npm run build for frontend' }); }
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16384 });
interface Client { role?: Role; last?: string; alive: boolean; count: number; window: number }
const clients = new Map<WebSocket, Client>();
function update(ws: WebSocket, force = false) {
  const c = clients.get(ws);
  if (!c?.role || ws.readyState !== WebSocket.OPEN) return;
  const payload = JSON.stringify(store.snapshot(c.role));
  if (force || c.last !== payload) {
    if (ws.bufferedAmount > 1024 * 1024) { ws.terminate(); return; }
    ws.send(payload); c.last = payload;
  }
}
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (production && origin && !allowedOrigins.includes(origin)) { ws.close(1008, 'Origin not allowed'); return; }
  clients.set(ws, { alive: true, count: 0, window: Date.now() });
  const authTimeout = setTimeout(() => { if (!clients.get(ws)?.role) ws.close(1013, 'Authentication timeout; retry'); }, 5000);
  ws.on('pong', () => { const c = clients.get(ws); if (c) c.alive = true; });
  ws.on('error', () => ws.terminate());
  ws.on('close', () => { clearTimeout(authTimeout); clients.delete(ws); });
  ws.on('message', raw => {
    const c = clients.get(ws)!;
    let id: unknown;
    try {
      if (Date.now() - c.window > 1000) { c.window = Date.now(); c.count = 0; }
      if (++c.count > 30) { ws.close(1008, 'Too many messages'); return; }
      const message = JSON.parse(raw.toString()); id = message.id;
      if (!c.role) {
        c.role = message.type === 'auth' ? roleFor(message.token) : undefined;
        if (!c.role) { ws.close(1008, 'Invalid token'); return; }
        clearTimeout(authTimeout); update(ws, true); return;
      }
      if (message.type === 'ping') { ws.send(JSON.stringify({ type: 'pong' })); return; }
      if (c.role !== 'control') throw new Error('Read-only connection');
      if (message.type !== 'action') throw new Error('Unknown message');
      store.apply(message.id, message.revision, message.action);
      for (const client of clients.keys()) update(client);
      ws.send(JSON.stringify({ type: 'ack', id: message.id }));
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', id: typeof id === 'string' ? id : undefined, error: e instanceof Error ? e.message : 'Invalid message' }));
      update(ws, true);
    }
  });
});
const tick = setInterval(() => { for (const ws of clients.keys()) update(ws); }, 200);
const heartbeat = setInterval(() => { for (const [ws, c] of clients) { if (!c.alive) ws.terminate(); else { c.alive = false; ws.ping(); } } }, 15000);
server.listen(Number(process.env.PORT || 3001), process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'), () => console.log('HOK Broadcast server ready on port ' + (process.env.PORT || 3001)));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
  clearInterval(tick); clearInterval(heartbeat); for (const ws of clients.keys()) ws.close(1001, 'Server stopping');
  server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000).unref();
});
