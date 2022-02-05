import { DBlogInstance } from "./instance";
import { resolve } from "path";

const instance = new DBlogInstance({
  contentPath: resolve('./', 'content'),
  webPath: resolve('./', 'www'),
});

void instance.build();
