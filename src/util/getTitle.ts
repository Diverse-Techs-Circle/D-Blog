import got from 'got';

export async function getGlobalPageTitle(url: string) {
    const title = (await got(url)).rawBody.toString().replace(/(\n|\r)/g, '').match(/<head>(.*)<title>(.+?)<\/title>(.*)<\/head>/);
    if (!title) return '';
    return title[2];
}
