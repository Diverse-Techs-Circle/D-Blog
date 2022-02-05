import { DBlogInstance } from "./instance";
import { resolve } from "path";

const instance = new DBlogInstance({
  contentPath: resolve('./', 'content'),
  webPath: resolve('./', 'content'),
});

void instance.build();
