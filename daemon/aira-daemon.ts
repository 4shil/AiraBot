/**
 * AiraBot Background Daemon with IPC
 * Runs proactive checks, listens on Unix socket, sends desktop notifications
 */

import { createServer, createConnection, type Server } from 'net';
import { promises as fs, existsSync, createWriteStream } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawn, exec as cpExec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(cpExec);

const AIRABOT_DIR = join(homedir(), '.airabot');
const SOCK_PATH = join(AIRABOT_DIR, 'aira.sock');
const PID_PATH = join(AIRABOT_DIR, 'daemon.pid');
const LOG_PATH = join(AIRABOT_DIR, 'daemon.log');
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function ensureDir(): Promise<void> {
  await fs.mkdir(AIRABOT_DIR, { recursive: true });
}

function log(message: string): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  // Append to log file (best effort)
  try {
    const stream = createWriteStream(LOG_PATH, { flags: 'a' });
    stream.write(line);
    stream.end();
  } catch { /* ignore */ }
  process.stdout.write(line);
}

async function sendNotification(title: string, body: string): Promise<void> {
  try {
    await execAsync(`notify-send '${title.replace(/'/g, "\\'")}' '${body.replace(/'/g, "\\'")}'`);
  } catch {
    // notify-send not available — ignore
  }
}

async function runProactiveChecks(): Promise<void> {
  const hour = new Date().getHours();
  log('Running proactive checks...');

  // Break reminder every 2 hours during work hours
  if (hour >= 9 && hour <= 22) {
    await sendNotification('AiraBot ⏰', 'Machane, break edukku da! Hydrate cheyyam 💧');
  }
}

function startIpcServer(): Server {
  // Remove stale socket
  try { require('fs').unlinkSync(SOCK_PATH); } catch { /* ignore */ }

  const server = createServer((socket) => {
    socket.on('data', async (data) => {
      const cmd = data.toString().trim();
      log(`IPC command: ${cmd}`);

      let response = 'unknown command';
      if (cmd === 'ping') {
        response = 'pong';
      } else if (cmd === 'status') {
        response = JSON.stringify({ pid: process.pid, uptime: process.uptime() });
      } else if (cmd === 'check') {
        await runProactiveChecks();
        response = 'checks done';
      } else if (cmd === 'stop') {
        response = 'stopping';
        socket.write(response + '\n');
        server.close();
        process.exit(0);
      }

      socket.write(response + '\n');
    });
    socket.on('error', () => { /* ignore */ });
  });

  server.listen(SOCK_PATH, () => {
    log(`IPC server listening on ${SOCK_PATH}`);
  });

  server.on('error', (err) => {
    log(`IPC server error: ${err.message}`);
  });

  return server;
}

async function runDaemon(): Promise<void> {
  await ensureDir();
  await fs.writeFile(PID_PATH, String(process.pid));
  log(`AiraBot daemon started (PID ${process.pid})`);

  startIpcServer();

  // Run checks immediately, then every 30 minutes
  await runProactiveChecks();
  setInterval(runProactiveChecks, CHECK_INTERVAL_MS);

  // Handle clean shutdown
  process.on('SIGTERM', async () => {
    log('SIGTERM received, shutting down');
    try { await fs.unlink(PID_PATH); } catch { /* ignore */ }
    try { await fs.unlink(SOCK_PATH); } catch { /* ignore */ }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log('SIGINT received, shutting down');
    try { await fs.unlink(PID_PATH); } catch { /* ignore */ }
    try { await fs.unlink(SOCK_PATH); } catch { /* ignore */ }
    process.exit(0);
  });
}

// ─── CLI helpers ──────────────────────────────────────────────────────────────

export async function startDaemon(): Promise<void> {
  await ensureDir();

  // Check if already running
  try {
    const pid = parseInt(await fs.readFile(PID_PATH, 'utf-8'), 10);
    try {
      process.kill(pid, 0); // throws if not running
      console.log(`AiraBot daemon already running (PID ${pid})`);
      return;
    } catch { /* not running */ }
  } catch { /* no pidfile */ }

  // Spawn daemon in background
  const child = spawn(process.execPath, [process.argv[1], '_daemon_run'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  console.log(`AiraBot daemon started (PID ${child.pid})`);
}

export async function stopDaemon(): Promise<void> {
  try {
    const pid = parseInt(await fs.readFile(PID_PATH, 'utf-8'), 10);
    process.kill(pid, 'SIGTERM');
    console.log(`Stopped daemon (PID ${pid})`);
    await fs.unlink(PID_PATH).catch(() => { /* ignore */ });
  } catch {
    console.log('Daemon is not running.');
  }
}

export async function getDaemonStatus(): Promise<string> {
  try {
    const pid = parseInt(await fs.readFile(PID_PATH, 'utf-8'), 10);
    try {
      process.kill(pid, 0);
      return `✅ AiraBot daemon is running (PID ${pid})`;
    } catch {
      return `⚠️  Stale pidfile found (PID ${pid}) — daemon not running`;
    }
  } catch {
    return '❌ AiraBot daemon is not running';
  }
}

// Entry point when spawned as daemon
if (process.argv[2] === '_daemon_run') {
  runDaemon().catch((err) => {
    console.error('Daemon error:', err);
    process.exit(1);
  });
}
