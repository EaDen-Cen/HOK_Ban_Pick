import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import type { Snapshot } from '../src/shared/types.js';

test('HTTP/WS auth, realtime broadcast, delayed REST/WS, read-only roles and reconnect', { timeout: 20000 }, async () => {
  const port = 19000 + Math.floor(Math.random() * 1000);
  const proc = spawn(process.execPath, ['--import', 'tsx', 'server/server.ts'], {
    env: { ...process.env, NODE_ENV: 'development', HOST: '127.0.0.1', PORT: String(port), DATA_FILE: join(mkdtempSync(join(tmpdir(), 'hok-api-')), 'match.json'), CONTROL_TOKEN: 'test-control', CASTER_TOKEN: 'test-caster', OVERLAY_TOKEN: 'test-overlay' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const sockets: WebSocket[] = [];
  const base = `http://127.0.0.1:${port}`;
  const connect = (token: string) => new Promise<{ ws: WebSocket; messages: Record<string, unknown>[] }>((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`); sockets.push(ws);
    const messages: Record<string, unknown>[] = [];
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', token })));
    ws.on('error', reject);
    ws.on('message', raw => { const m = JSON.parse(raw.toString()); messages.push(m); if (m.type === 'match_state_update') resolve({ ws, messages }); });
  });
  const wait = async (fn: () => boolean) => { for (let n = 0; n < 100; n++) { if (fn()) return; await new Promise(r => setTimeout(r, 30)); } throw new Error('Timed out'); };
  try {
    await new Promise<void>((resolve, reject) => { proc.stdout!.on('data', chunk => { if (String(chunk).includes('ready')) resolve(); }); proc.once('exit', code => reject(new Error(`Server exited ${code}`))); proc.once('error', reject); });
    assert.equal((await fetch(base + '/api/match')).status, 401);
    const control = await connect('test-control'), overlay = await connect('test-overlay'), caster = await connect('test-caster');
    const id = randomUUID();
    control.ws.send(JSON.stringify({ type: 'action', id, revision: 0, action: { type: 'draft_action', team: 'blue', action: 'ban', heroId: 46 } }));
    await wait(() => overlay.messages.some(m => m.revision === 1));
    assert.equal(caster.messages.length, 1);
    const delayed = await (await fetch(base + '/api/match?role=control', { headers: { Authorization: 'Bearer test-caster' } })).json() as Snapshot;
    assert.deepEqual(delayed.state.blueBans, []); assert.equal(delayed.revision, 0);
    caster.ws.send(JSON.stringify({ type: 'action', id: randomUUID(), revision: 1, action: { type: 'reset_match' } }));
    await wait(() => caster.messages.some(m => m.type === 'error'));
    assert.ok(caster.messages.some(m => m.error === '当前页面仅供查看，无法修改比赛'));
    overlay.ws.close(); const reconnected = await connect('test-overlay');
    assert.equal(reconnected.messages[0].revision, 1);
    control.ws.send(JSON.stringify({ type: 'action', id: randomUUID(), revision: 1, action: { type: 'delay', seconds: 0 } }));
    await wait(() => caster.messages.some(m => m.revision === 1));
    const latest = await (await fetch(base + '/api/match', { headers: { Authorization: 'Bearer test-caster' } })).json() as Snapshot;
    assert.deepEqual(latest.state.blueBans, [46]);
  } finally { for (const ws of sockets) ws.terminate(); proc.kill(); }
});
