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
  { name: 'viewport', content: ViewportContent[] }
