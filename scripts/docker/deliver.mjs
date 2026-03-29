#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const DEFAULT_MODE = 'build-only';
const DEFAULT_SERVICES = ['server', 'app'];
const DEFAULT_REGISTRY = '';
const DEFAULT_SEVERITIES = 'CRITICAL,HIGH';
const DEFAULT_PKG_TYPES = 'os,library';

const args = parseArgs(process.argv.slice(2));
const mode = args.mode ?? DEFAULT_MODE;
const services = normalizeServices(args.service);
const registry = args.registry ?? DEFAULT_REGISTRY;
const imageTag = args.tag ?? `sha-${(process.env.GITHUB_SHA ?? 'local').slice(0, 12)}`;
const trivyIgnoreFile = args.ignorefile ?? '.trivyignore';
const trivySeverity = pickNonEmpty(args.severity, DEFAULT_SEVERITIES);
const trivyPkgTypes = pickNonEmpty(args.pkgTypes ?? args.trivyVulnType, DEFAULT_PKG_TYPES);
const trivyImageCandidates = [args.trivyImage, 'ghcr.io/aquasecurity/trivy:latest', 'aquasec/trivy:latest', 'aquasecurity/trivy:latest'].filter(Boolean);
const publish = mode === 'publish';

if (!['build-only', 'publish'].includes(mode)) {
  fail(`Invalid --mode "${mode}". Expected: build-only | publish`);
}

const exitCodeForTrivy = resolveTrivyExitCode(mode, args);

for (const service of services) {
  const imageRef = buildImageRef({ service, registry, tag: imageTag });
  const { dockerfile, context, buildArgs } = getBuildConfig(service, args);

  run('docker', [
    'build',
    '-f',
    dockerfile,
    '-t',
    imageRef,
    ...toBuildArgFlags(buildArgs),
    context,
  ]);

  runTrivyScan({
    imageRef,
    trivyIgnoreFile,
    trivySeverity,
    trivyPkgTypes,
    exitCode: exitCodeForTrivy,
  });

  if (publish) {
    run('docker', ['push', imageRef]);
  }
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    const value = next && !next.startsWith('--') ? next : 'true';
    if (value !== 'true') i++;

    switch (key) {
      case 'service':
      case 'mode':
      case 'registry':
      case 'tag':
      case 'severity':
      case 'ignorefile':
      case 'pkg-types':
      case 'trivy-vuln-type':
      case 'trivy-exit-code':
      case 'trivy-image':
      case 'build-api-url':
      case 'build-base-url':
      case 'server-port':
      case 'server-cors-origins':
      case 'server-storage-type':
        result[toCamelCase(key)] = value;
        break;
      default:
        break;
    }
  }
  return result;
}

function normalizeServices(serviceValue) {
  if (!serviceValue || serviceValue === 'all') return DEFAULT_SERVICES;
  const parsed = serviceValue.split(',').map((s) => s.trim()).filter(Boolean);
  const invalid = parsed.filter((s) => !DEFAULT_SERVICES.includes(s));
  if (invalid.length > 0) {
    fail(`Invalid --service values: ${invalid.join(', ')}`);
  }
  return parsed;
}

function buildImageRef({ service, registry, tag }) {
  // GHCR: <repository>-<artifact> e.g. mobile-recipes-e1-server, mobile-recipes-e1-app
  const imageName = `mobile-recipes-e1-${service}`;
  return registry ? `${registry}/${imageName}:${tag}` : `${imageName}:${tag}`;
}

function getBuildConfig(service, args) {
  if (service === 'server') {
    return {
      dockerfile: 'docker/server.Dockerfile',
      context: '.',
      buildArgs: {
        DEFAULT_PORT: args.serverPort ?? '3000',
        DEFAULT_CORS_ORIGINS: args.serverCorsOrigins ?? 'http://localhost:5173,http://localhost:8100',
        DEFAULT_STORAGE_TYPE: args.serverStorageType ?? 'local',
      },
    };
  }

  return {
    dockerfile: 'docker/app.Dockerfile',
    context: '.',
    buildArgs: {
      DEFAULT_VITE_API_URL: args.buildApiUrl ?? 'http://localhost:3000',
      DEFAULT_VITE_BASE_URL: args.buildBaseUrl ?? '/',
    },
  };
}

function toBuildArgFlags(buildArgs) {
  return Object.entries(buildArgs).flatMap(([k, v]) => ['--build-arg', `${k}=${v}`]);
}

function resolveTrivyExitCode(mode, args) {
  if (args.trivyExitCode) return args.trivyExitCode;
  return mode === 'publish' ? '1' : '0';
}

function runTrivyScan({ imageRef, trivyIgnoreFile, trivySeverity, trivyPkgTypes, exitCode }) {
  const trivyArgs = [
    'image',
    '--scanners',
    'vuln',
    '--severity',
    trivySeverity,
    '--pkg-types',
    trivyPkgTypes,
    '--ignore-status',
    'fixed',
    '--exit-code',
    exitCode,
    imageRef,
  ];
  const includeIgnoreFile = trivyIgnoreFile && existsSync(trivyIgnoreFile);
  if (includeIgnoreFile) {
    trivyArgs.splice(6, 0, '--ignorefile', trivyIgnoreFile);
  }

  const hasTrivy = spawnSync('trivy', ['--version'], { stdio: 'ignore', shell: true }).status === 0;
  if (hasTrivy) {
    run('trivy', trivyArgs);
    return;
  }

  for (const trivyImage of trivyImageCandidates) {
    // Try pulling candidate first to distinguish "image not found/auth" from actual scan result.
    const pullStatus = run('docker', ['pull', trivyImage], { allowFailure: true });
    if (pullStatus !== 0) continue;

    // Once a candidate is pullable, run scan and propagate Trivy exit code directly.
    // This preserves publish-mode security gate failures as intended.
    run('docker', ['run', '--rm', '-v', '/var/run/docker.sock:/var/run/docker.sock', trivyImage, ...trivyArgs]);
    return;
  }

  fail('Unable to run Trivy: no accessible trivy image candidate found. Set --trivy-image to a reachable image.');
}

function run(command, cmdArgs, options = {}) {
  const { allowFailure = false } = options;
  const rendered = [command, ...cmdArgs].join(' ');
  console.log(`\n$ ${rendered}`);
  const res = spawnSync(command, cmdArgs, { stdio: 'inherit', shell: true });
  if (res.status !== 0 && !allowFailure) {
    fail(`Command failed: ${rendered}`);
  }
  return res.status;
}

function toCamelCase(input) {
  return input.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function fail(msg) {
  console.error(`\n[ERROR] ${msg}`);
  process.exit(1);
}

function pickNonEmpty(value, fallback) {
  const s = typeof value === 'string' ? value.trim() : value;
  return s ? String(s) : fallback;
}
