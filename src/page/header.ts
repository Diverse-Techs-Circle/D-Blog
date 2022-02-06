type ViewportContent =
  { key: 'width', value: number | 'device-width' } |
  { key: 'height', value: number | 'device-height' } |
  { key: 'initial-scale' | 'maximum-scale' | 'minimum-scale', value: number } |
  { key: 'user-scalable', value: 'yes' | 'no' };

type IMetaData =
  { charset:  'UTF-8' | 'UTF-16'  } |
  { httpEquiv: 'content-security-policy' | 'refresh', content: string } |
  { name: 'application-name' | 'author' | 'description' | 'generator' | 'keywords' | 'theme-color' | 'creator' | 'publisher', content: string } |
  { name: 'referrer', content: 'no-referrer' | 'origin' | 'no-referrer-when-downgrade' | 'origin-when-crossorigin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-URL' } |
  { name: 'color-scheme', content: 'normal' | 'only light' | 'only dark' | 'light dark' | 'dark light' } |
  { name: 'googlebot' | 'robots' | 'slurp', content: ('index' | 'noindex' | 'follow' | 'nofollow' | 'none' | 'noodp' | 'noarchive' | 'nosnippet' | 'noimageindex' | 'nocache')[] } |
  { name: 'viewport', content: ViewportContent[] };

export function buildMeta(meta: IMetaData): string {
  if ( 'charset' in meta ) {
    return `<meta charset="${meta.charset}">`;
  }
  if ( 'httpEquiv' in meta ) {
    return `<meta http-equiv="${meta.httpEquiv}" content=${meta.content}>`;
  }
  if ( meta.name === 'googlebot' || meta.name === 'robots' || meta.name === 'slurp') {
    return `<meta name="${meta.name}" content="${meta.content.join(', ')}">`
  }
  if ( meta.name === 'viewport' ) {
    return `<meta name="${meta.name}" content="${meta.content.map(v => `${v.key}=${v.value}`).join(', ')}">`;
  }
  return `<meta name="${meta.name}" content="${meta.content}">`;
}
