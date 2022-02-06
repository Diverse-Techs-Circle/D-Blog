import { readFile, writeFile } from "fs/promises";
import { isAnnotateFinish, isAnnotateStart } from "./page/annotateParse";
import got from 'got';
import { extname, resolve } from "path";
import { cwd } from "process";

const authorName = process.env.AUTHORNAME;
const authorURL = process.env.AUTHORURL;
const PRNumber = process.env.PRNUMBER;
const PAT = process.env.PAT;
if ( !authorName || !authorURL || !PRNumber || !PAT ) {
  process.exit(1);
}

(async () => {
  const targets: string[] = (
    (<{filename: string, status: 'added' | 'modified'}[]>JSON.parse((await got(`https://api.github.com/repos/Diverse-Techs-Circle/D-Blog/pulls/${PRNumber}/files`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${PAT}`
      }
    })).body))
      .filter(v => v.status === 'added')
      .map(v => v.filename)
      .filter(v => extname(v) === '.md')
      .map(v => resolve(cwd(), v))
  );

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
      writeFile((await v).filePath, (await v).data.join('\n'))
    );
  await Promise.all(writers);
})();
