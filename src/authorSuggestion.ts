import { readFile, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';
import { cwd } from 'process';
import got from 'got';
import { isAnnotateFinish, isAnnotateStart } from './page/annotateParse';

const authorName = process.env.AUTHORNAME;
const authorURL = process.env.AUTHORURL;
const PRNumber = process.env.PRNUMBER;
const PAT = process.env.PAT;
if (!authorName || !authorURL || !PRNumber || !PAT) {
    process.exit(1);
}

(async () => {
    const targets: string[] =
    (<{ filename: string, status: 'added' | 'modified' }[]>JSON.parse((await got(`https://api.github.com/repos/Diverse-Techs-Circle/D-Blog/pulls/${PRNumber}/files`, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${PAT}`,
        },
    })).body))
        .filter(v => v.status === 'added' || v.status === 'modified')
        .map(v => v.filename)
        .filter(v => extname(v) === '.md')
        .map(v => resolve(cwd(), v));
    const writers = targets
        .map(async v => ({ filePath: v, data: (await readFile(v)).toString() }))
        .map<Promise<{ filePath: string, data: string[] }>>(async v => {
        const pathData: { filePath: string, data: string } = await v;
        const lines = pathData.data.split(/\n/).map((p, i) => ({ data: p, line: i + 1 }));
        const beginAnnotate = lines.find(l => isAnnotateStart(l.data));
        const finishAnnotate = beginAnnotate ? lines.find(l => isAnnotateFinish(l.data) && l.line > beginAnnotate.line) : null;
        if (!beginAnnotate || !finishAnnotate) {
            return {
                filePath: pathData.filePath,
                data: lines.flatMap<string>(l =>
                    l.line === 1 ? [`//@D-Blog ---`, `author: ${authorName}@${authorURL}`, `// ---`] : [l.data],
                ),
            };
        } else {
            if (lines.filter(l => beginAnnotate.line < l.line && l.line < finishAnnotate.line).some(l => /author:( |)(.+)@(https:\/\/(.+))/.test(l.data))) {
                return {
                    filePath: pathData.filePath,
                    data: lines.map(l => l.data),
                };
            }
            const authorLine = lines.filter(l => beginAnnotate.line < l.line && l.line < finishAnnotate.line).find(l => l.data.startsWith('author:'));
            if (authorLine !== undefined) {
                return {
                    filePath: pathData.filePath,
                    data: lines.flatMap<string>(l =>
                        l.line === authorLine.line ? [`author: ${authorName}@${authorURL}`] : [l.data],
                    ),
                };
            }
            return {
                filePath: pathData.filePath,
                data: lines.flatMap<string>(l =>
                    l.line === finishAnnotate.line ? [`author: ${authorName}@${authorURL}`, finishAnnotate.data] : [l.data],
                ),
            };
        }
    }).map(async v =>
        writeFile((await v).filePath, (await v).data.join('\n')),
    );
    await Promise.all(writers);
})();
