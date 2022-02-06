import { fatal } from "../util/fatal";

export interface ILineData {
  line: number;
  data: string;
}
export interface IAnnotate {
  key: string, value: string, lineNumber: number
}
export function annotateCheck(data: string, fileName: string): { annotate: IAnnotate[], content: ILineData[] } | null {
  const lines = data.split(/\n/).map((v, i) => ({data: v, line: i + 1}));
  const beginAnnotate = lines.find(v => isAnnotateStart(v.data));
  if(!beginAnnotate) return null;
  const finishAnnotate = lines.find(v => isAnnotateFinish(v.data) && v.line > beginAnnotate.line);
  if(!finishAnnotate) return null;

  const anotates = lines.filter(v => beginAnnotate.line < v.line && v.line < finishAnnotate.line);
  const content = lines.filter(v => beginAnnotate.line > v.line || v.line > finishAnnotate.line);
  return { annotate: anotates.map(v => {
    const match = v.data.match(/^(.+?):( |)(.+)$/);
    if(!match) {
      fatal(fileName, v.line, [
        `${v.data} は、アノテートとして不適切です。`,
        `「プロパティ名: 値」という形式で記述してください。`
      ]);
      return { key: '', value: '', lineNumber: 0 };
    }
    return { key: match[1], value: match[3], lineNumber: v.line };
  }), content };
}

export function isAnnotateStart(data: string): boolean {
  return /^((| )*)\/\/( |)@D-Blog( ||-)*$/.test(data);
}

export function isAnnotateFinish(data: string): boolean {
  return /^((| )*)\/\/( ||-)*$/.test(data)
}
