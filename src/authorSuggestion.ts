import { readFile, writeFile } from "fs/promises";
import { isAnnotateFinish, isAnnotateStart } from "./page/annotateParse";

const authorName: string = '';
const authorURL: string = '';
const targets: string[] = [];

(async () => {
  const writers = targets
    .map(async v => ({ filePath: v, data: (await readFile(v)).toString() }))
    .map<Promise<{ filePath: string, data: string[] }>>(async v => {
      const pathData: { filePath: string, data: string } = await v;
      const lines = pathData.data.split(/\n/).map((v, i) => ({data: v, line: i + 1}));
      const beginAnnotate = lines.find(v => isAnnotateStart(v.data));
      const finishAnnotate = beginAnnotate ? lines.find(v => isAnnotateFinish(v.data) && v.line > beginAnnotate.line) : null;
      if ( !beginAnnotate || !finishAnnotate ) {
        return {
          filePath: pathData.filePath,
          data: lines.flatMap<string>(v =>
              v.line === 1 ? [`//@D-Blog ---` ,`author: ${authorName}@${authorURL}`, `// ---` ] : [v.data]
            )
        };
      } else {
        return {
          filePath: pathData.filePath,
          data: lines.flatMap<string>(v =>
            v.line === finishAnnotate.line ? [`author: ${authorName}@${authorURL}`, finishAnnotate.data] : [v.data]
          )
        };
      }
    }).map(async v =>
      writeFile((await v).filePath, (await v).data.join(''))
    );
  await Promise.all(writers);
})();
