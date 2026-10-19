import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Bundle Vite's import.meta.env for the Node test environment.
const directory = await mkdtemp(join(tmpdir(), 'patient-portal-test-'));
try {
  const outfile = join(directory, 'patient-portal.test.cjs');
  await build({ entryPoints: ['tests/patient-portal.test.ts'], outfile, bundle: true, platform: 'node', tsconfig: 'tsconfig.json', format: 'cjs', define: { 'import.meta.env': '{}' }, logLevel: 'silent' });
  execFileSync(process.execPath, [outfile], { stdio: 'inherit' });
} finally {
  await rm(directory, { recursive: true, force: true });
}
