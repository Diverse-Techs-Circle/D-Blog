import { DBlogInstance } from "./instance";
import { resolve } from "path";
import { cwd } from "process";

const instance = new DBlogInstance({
  contentPath: resolve(cwd(), 'content'),
  webPath: resolve(cwd(), 'www'),
  siteUrl: 'https://diverse-techs-circle.github.io/D-Blog/',
  domainPrefix: '/D-Blog',
  relativePath: true
});

void instance.build();
