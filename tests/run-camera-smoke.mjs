import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'google-chrome');
const testPage = process.argv[2] || 'gesture-camera-smoke.html';
const profile = await mkdtemp(join(tmpdir(), 'birtat-camera-test-'));
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu',
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  `http://localhost:8080/tests/${testPage}`
], { stdio: ['ignore', 'ignore', 'pipe'] });

let endpoint = '';
browser.stderr.on('data', chunk => {
  const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
  if (match) endpoint = match[1];
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  for (let i = 0; i < 100 && !endpoint; i++) await wait(100);
  if (!endpoint) throw new Error('Chrome DevTools did not start');
  const pages = await (await fetch(endpoint.replace('ws://', 'http://').replace(/\/devtools\/browser\/.*$/, '/json'))).json();
  const page = pages.find(item => item.type === 'page' && item.url.includes(testPage));
  if (!page) throw new Error('Smoke-test page did not open');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const response = JSON.parse(event.data);
    if (!pending.has(response.id)) return;
    const { resolve, reject } = pending.get(response.id);
    pending.delete(response.id);
    response.error ? reject(new Error(response.error.message)) : resolve(response.result);
  };
  const send = (method, params) => new Promise((resolve, reject) => {
    const nextId = ++id;
    pending.set(nextId, { resolve, reject });
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
  let outcome = 'RUNNING';
  for (let i = 0; i < 30 && outcome === 'RUNNING'; i++) {
    const result = await send('Runtime.evaluate', { expression: "document.querySelector('#result')?.textContent || 'RUNNING'", returnByValue: true });
    outcome = result.result.value;
    if (outcome === 'RUNNING') await wait(1000);
  }
  socket.close();
  console.log(outcome);
  if (!outcome.startsWith('PASS:')) process.exitCode = 1;
} finally {
  browser.kill();
  if (browser.exitCode === null) await new Promise(resolve => browser.once('exit', resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
}
