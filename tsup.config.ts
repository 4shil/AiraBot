import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['entry.ts', 'airabot-cli.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
});
