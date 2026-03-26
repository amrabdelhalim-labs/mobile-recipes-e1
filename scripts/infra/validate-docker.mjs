#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const COMPOSE_FILE = path.join(ROOT, 'docker-compose.yml');
const RUN_SMOKE = process.argv.includes('--smoke');

const requiredFiles = [
  '.dockerignore',
  'docker-compose.yml',
  'docker/server.Dockerfile',
  'docker/app.Dockerfile',
  'docker/app-entrypoint.sh',
  'scripts/docker/deliver.mjs',
  '.github/workflows/docker-delivery.yml',
];

let failed = 0;

await main();

async function main() {
  runStaticChecks();

  if (RUN_SMOKE && failed === 0) {
    await runSmokeChecks();
  }

  if (failed > 0) {
    console.error(`\n[FAIL] Docker validation failed with ${failed} issue(s).`);
    process.exit(1);
  }

  console.log('\n[OK] Docker validation passed.');
}

function runStaticChecks() {
  for (const rel of requiredFiles) {
    const full = path.join(ROOT, rel);
    if (!existsSync(full)) {
      logFail(`Missing required file: ${rel}`);
    } else {
      logOk(`Found: ${rel}`);
    }
  }

  assertContains('docker/server.Dockerfile', ['ARG DEFAULT_PORT', 'ENV PORT=${DEFAULT_PORT}', 'HEALTHCHECK', 'npm ci --omit=dev']);
  assertContains('docker/app.Dockerfile', ['ARG DEFAULT_VITE_API_URL', 'ENV BAKED_VITE_API_URL=${DEFAULT_VITE_API_URL}', 'ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]']);
  assertContains('docker/app-entrypoint.sh', [
    'VITE_API_URL:-${BAKED_VITE_API_URL:-http://localhost:3000}',
    'VITE_BASE_URL:-${BAKED_VITE_BASE_URL:-/}',
    'npm run build',
  ]);
  assertContains('scripts/docker/deliver.mjs', ['--pkg-types', '--ignorefile', 'trivy-vuln-type', "mode === 'publish' ? '1' : '0'"]);
  assertContains('docker-compose.yml', [
    'services:',
    'postgres:',
    'server:',
    'app:',
    'depends_on:',
    '"3002:3000"',
    'POSTGRES_HOST_PORT',
    'VITE_API_URL: http://localhost:3002',
    'NODE_ENV: production',
  ]);
  assertOrderWithAlternatives('docker/app.Dockerfile', ['RUN npm ci', 'RUN CYPRESS_INSTALL_BINARY=0 npm ci'], 'ENV NODE_ENV=production');
  assertNoMergeMarkers([
    '.github/workflows/docker-delivery.yml',
    'docker/server.Dockerfile',
    'docker/app.Dockerfile',
    'scripts/docker/deliver.mjs',
    'docker-compose.yml',
  ]);
}

async function runSmokeChecks() {
  console.log('\n-- Running smoke checks (compose up + endpoint probes + cleanup)');
  let started = false;
  const smokeEnv = { ...process.env, POSTGRES_HOST_PORT: process.env.SMOKE_POSTGRES_HOST_PORT || '55432' };

  try {
    runCompose(['down', '--remove-orphans'], true, smokeEnv);
    runCompose(['up', '-d', '--build'], false, smokeEnv);
    started = true;

    await waitForHttp('http://localhost:3002/health', (text) => text.includes('"status":"OK"'), 120000, 3000);
    logOk('Health endpoint is reachable: http://localhost:3002/health');

    await waitForHttp('http://localhost:4173/', (text) => text.includes('<!DOCTYPE html>'), 180000, 4000);
    logOk('App endpoint is reachable: http://localhost:4173/');
  } catch (error) {
    logFail(`Smoke check failed: ${error.message}`);
  } finally {
    // Safety-first cleanup to prevent leaked containers/ports.
    if (started) {
      runCompose(['down', '--remove-orphans'], true, smokeEnv);
      logOk('Smoke cleanup completed (compose resources removed)');
    }
  }
}

function runCompose(args, allowFailure = false, env = process.env) {
  const res = spawnSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  if (res.status !== 0 && !allowFailure) {
    throw new Error(`docker compose ${args.join(' ')} failed`);
  }
}

async function waitForHttp(url, predicate, timeoutMs, pollMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      if (response.ok && predicate(text)) return;
    } catch {
      // Retry until timeout.
    }
    await sleep(pollMs);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertContains(relPath, snippets) {
  const fullPath = path.join(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf8');
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      logFail(`Missing snippet in ${relPath}: ${snippet}`);
    } else {
      logOk(`Verified snippet in ${relPath}: ${snippet}`);
    }
  }
}

function assertOrder(relPath, beforeText, afterText) {
  const fullPath = path.join(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf8');
  const beforeIndex = content.indexOf(beforeText);
  const afterIndex = content.indexOf(afterText);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex > afterIndex) {
    logFail(`Expected order in ${relPath}: "${beforeText}" must appear before "${afterText}"`);
  } else {
    logOk(`Verified order in ${relPath}: "${beforeText}" before "${afterText}"`);
  }
}

function assertOrderWithAlternatives(relPath, beforeTexts, afterText) {
  const fullPath = path.join(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf8');
  const afterIndex = content.indexOf(afterText);
  const matchedBeforeText = beforeTexts.find((candidate) => content.includes(candidate));
  const beforeIndex = matchedBeforeText ? content.indexOf(matchedBeforeText) : -1;

  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex > afterIndex) {
    logFail(`Expected order in ${relPath}: one of [${beforeTexts.join(' | ')}] must appear before "${afterText}"`);
  } else {
    logOk(`Verified order in ${relPath}: "${matchedBeforeText}" before "${afterText}"`);
  }
}

function assertNoMergeMarkers(relPaths) {
  const markers = ['<<<<<<<', '=======', '>>>>>>>'];
  for (const rel of relPaths) {
    const full = path.join(ROOT, rel);
    if (!existsSync(full)) continue;
    const content = readFileSync(full, 'utf8');
    for (const marker of markers) {
      if (content.includes(marker)) {
        logFail(`Merge marker "${marker}" found in ${rel}`);
      }
    }
  }
}

function logOk(msg) {
  console.log(`  OK  ${msg}`);
}

function logFail(msg) {
  console.error(`  ERR ${msg}`);
  failed += 1;
}
