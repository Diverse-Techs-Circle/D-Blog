const { build } = require('estrella');
const { resolve } = require('path');
build({
  define: { 'process.env.NODE_ENV': process.env.NODE_ENV },
  entryPoints: [resolve(__dirname, 'src/authorSuggestion.ts')],
  target: 'esnext',
  outdir: resolve(__dirname, 'dist'),
  external: ['node:http', 'node:util', 'node:buffer', 'node:https', 'node:url', 'node:net', 'node:tls', 'node:process', 'node:stream', 'node:events'],
  bundle: true,
  minify: true,
  sourcemap: true,
  tslint: true,
  platform: 'node'
}).catch(() => { process.exit(1); });
