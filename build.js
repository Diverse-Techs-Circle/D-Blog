const { build } = require('estrella');
const { resolve } = require('path');
build({
  define: { 'process.env.NODE_ENV': process.env.NODE_ENV },
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  target: 'esnext',
  outdir: resolve(__dirname, 'dist'),
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: true,
  format: 'esm',
  tslint: true,
  platform: 'node'
}).catch(() => { process.exit(1); });
