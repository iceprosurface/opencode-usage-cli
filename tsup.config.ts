import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['cli.ts', 'analyzer.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false
})
