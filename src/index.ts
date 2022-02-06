import { DBlogInstance } from "./instance";
import { resolve } from "path";

const instance = new DBlogInstance({
  contentPath: resolve('./', 'content'),
  webPath: resolve('./', 'www'),
  siteUrl: 'https://diverse-techs-circle.github.io/D-Blog/'
});

void instance.build();
