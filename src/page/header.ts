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

type OGP = {
  type: 'website' | 'article',
  url: string,
  title: string,
  site_name: string,
  locale: 'ja_JP',
  description?: string,
};

function buildMeta(meta: IMetaData): string {
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

function buildOGP(ogp: OGP): {prefix: string, data: string[]} {
  return {
    prefix: `og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# ${ogp.type}: http://ogp.me/ns/${ogp.type}#`,
    data:  [
      `<meta property="og:url" content="${ogp.url}">`,
      `<meta property="og:title" content="${ogp.title}">`,
      ...ogp.description ? [`<meta property="og:description" content="${ogp.description}">`] : [],
      `<meta property="og:site_name" content="${ogp.site_name}">`,
      `<meta property="og:locale" content="${ogp.locale}">`,
    ]
  };
}

export class DBlogHTML {
  meta: IMetaData[] = [];
  ogp: null | OGP = null;
  constructor(public title: string, public lang: 'en' | 'ja'){}

  addMeta(meta: IMetaData) {
    this.meta.push(meta);
  }

  withOGP(ogp: OGP) {
    this.ogp = ogp;
  }

  render(body: string) {
    const ogp = this.ogp === null ? null : buildOGP(this.ogp);
    return [
      '<!DOCTYPE html>',
      `<html lang="${this.lang}">`,
      ogp ? `<head prefix="${ogp.prefix}">` : '<head>',
      ...this.meta.map(v => buildMeta(v)),
      ...(ogp ? ogp.data : []),
      `<title>${this.title}</title>`,
      '</head>',
      '<body>',
      body,
      '</body>',
      `</html>`
    ].join('');
  }
}
