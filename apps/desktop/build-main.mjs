import { build } from 'esbuild';
import { builtinModules } from 'node:module';

await build({
  entryPoints: ['src/main.ts'],
  bundle:      true,
  platform:    'node',
  target:      'node20',
  format:      'cjs',
  outfile:     'dist/main/index.js',
  sourcemap:   true,
  external: [
    'electron',
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`),
  ],
});
