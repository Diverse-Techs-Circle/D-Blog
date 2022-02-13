const { resolve } = require('path');
const { build } = require('estrella');

build({
    define: { 'process.env.NODE_ENV': process.env.NODE_ENV },
    entryPoints: [resolve(__dirname, 'src/index.ts')],
    target: 'esnext',
    outdir: resolve(__dirname, 'dist'),
    bundle: true,
    external: ['estrella', 'scss', 'node:http', 'node:util', 'node:buffer', 'node:https', 'node:url', 'node:net', 'node:tls', 'node:process', 'node:stream', 'node:events', 'fontmin'],
    minify: false,
    sourcemap: true,
    tslint: true,
    platform: 'node'
}).catch(() => { process.exit(1); });
