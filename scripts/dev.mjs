#!/usr/bin/env node
/**
 * Starts API + grading worker + web together for local dogfood.
 * The worker is mandatory — submits stay queued without it.
 */
const { spawn } = require("node:child_process");

const children = [];

function start(name, command, args, color) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      FORCE_COLOR: "1",
      // Local machines usually lack gVisor; agent/sandbox grades need this.
      SANDBOX_ALLOW_RUNC_FALLBACK:
        process.env.SANDBOX_ALLOW_RUNC_FALLBACK ?? "true",
    },
    shell: process.platform === "win32",
  });
  children.push(child);

  const prefix = (stream) => {
    stream.on("data", (chunk) => {
      const lines = String(chunk).split(/\r?\n/);
      for (const line of lines) {
        if (line.length === 0) {
          continue;
        }
        process.stdout.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    });
  };

  prefix(child.stdout);
  prefix(child.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    console.error(
      `\x1b[31m[${name}] exited (${signal ?? code}). Stopping the rest.\x1b[0m`,
    );
    shutdown(typeof code === "number" ? code : 1);
  });
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 500);
}

console.log(`
\x1b[1mLabPath local stack\x1b[0m
  • API     http://localhost:3001
  • Web     http://localhost:3000
  • Worker  required for grading (submits stay queued without it)
  • Agents  need: docker compose up -d sandbox-gateway
`);

start("api", "npm", ["run", "dev:api"], "\x1b[34m");
start("worker", "npm", ["run", "dev:worker"], "\x1b[35m");
start("web", "npm", ["run", "dev:web"], "\x1b[32m");

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
