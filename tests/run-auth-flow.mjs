import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'clinic-auth-test-'));
try {
  const outfile = join(directory, 'auth-flow.test.cjs');
  await build({ absWorkingDir: root, entryPoints: ['tests/auth-flow.test.ts'], outfile, bundle: true, platform: 'node', tsconfig: 'tsconfig.json', format: 'cjs', define: { 'import.meta.env': '{"VITE_API_BASE_URL":"http://localhost:8000/api/v1"}' }, logLevel: 'silent' });
  execFileSync(process.execPath, [outfile], { stdio: 'inherit' });
} finally {
  await rm(directory, { recursive: true, force: true });
}
