import { resolve } from 'path';
import { cwd } from 'process';
import { DBlogInstance } from './instance';

const instance = new DBlogInstance({
    contentPath: resolve(cwd(), 'content'),
    webPath: resolve(cwd(), 'www'),
    mplus: resolve(cwd(), 'src', 'asset', 'font'),
    siteUrl: 'https://diverse-techs-circle.github.io/D-Blog/',
    domainPrefix: '/D-Blog',
    relativePath: true,
});

instance.build().catch();
