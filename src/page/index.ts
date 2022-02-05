import { fatal, warn } from "../util/fatal";
import { annotateCheck, IAnnotate, ILineData } from "./annotateParse";

export type markdown = string;
export type html = string;

interface IDay { year: number, month: number, day: number }

export class DBlogPage {
  title: string;
  content: ILineData[];
  permalink: string;
  postedAt: IDay | null;
  constructor(page: markdown, public filePath: string) {


    const annotateKey = ['title', 'permalink', 'postedAt'];
    const parsed = annotateCheck(page, filePath);
    this.content = [];
    this.title = '';
    this.permalink = '';
    this.postedAt = null;
    if ( parsed === null ) {
      fatal(filePath, 1, [
        'D-Blogアノテートが不足しています。',
        '各Markdownファイルには、//@D-Blog --- と、 //--- で囲まれたアノテートが必要です。',
        '詳しくはREADMEをご覧ください。'
      ]);
    } else {
      const annotate = parsed.annotate;
      this.content = parsed.content;
      annotate.filter(v => !annotateKey.includes(v.key)).forEach(v => {
        warn(filePath, v.lineNumber, [
          `D-Blogアノテート「${v.key}」は無効です。`
        ]);
      });

      const toParse = annotate.filter(v => annotateKey.includes(v.key));
      const firstLine = (annotate[0]?.lineNumber ?? 1) - 1;

      this.title = getTitle(toParse, filePath, firstLine) ?? this.title;
      this.permalink = getPermalink(toParse, filePath, firstLine) ?? this.permalink;
      this.postedAt = getPostedAt(toParse, filePath, firstLine) ?? this.postedAt;
      console.log(this);
    }
  }

  async render(): Promise<html> {
    return this.content.join('\n');
  }
}

export function getTitle(toParse: IAnnotate[], filePath: string, annotateLine: number): string | undefined {
  const title = toParse.find(v => v.key === 'title');
  if ( !title ) {
    fatal(filePath, annotateLine, ['タイトルアノテートが不足しています。', 'title: 記事のタイトル のように指定してください。']);
    return undefined;
  }
  if ( title.value ===  '') {
    fatal(filePath, title.lineNumber, ['記事のタイトルは空ではいけません。'])
    return undefined;
  }
  if ( title.value.length > 128 ) {
    fatal(filePath, title.lineNumber, ['記事のタイトルは128文字を超えてはいけません。'])
    return title.value;
  }
  if ( title.value.length > 32 ) {
    warn(filePath, title.lineNumber, ['記事のタイトルは32文字以内が適切です。'])
  }
  return title.value;
}

export function getPermalink(toParse: IAnnotate[], filePath: string, annotateLine: number): string | undefined {
  const permalink = toParse.find(v => v.key === 'permalink');
  if ( !permalink ) {
    fatal(filePath, annotateLine, ['パーマリンクアノテートが不足しています。', 'permalink: パーマリンク のように指定してください。']);
    return undefined;
  }
  if ( permalink.value ===  '') {
    fatal(filePath, permalink.lineNumber, ['パーマリンクは空ではいけません。'])
    return undefined;
  }
  if ( permalink.value.length > 64 ) {
    fatal(filePath, permalink.lineNumber, ['パーマリンクは64文字を超えてはいけません。'])
  }
  if ( !/^([A-Z]|[a-z]|[0-9]|-)+$/.test(permalink.value) ) {
    fatal(filePath, permalink.lineNumber, ['パーマリンクには英数字とハイフンしか使えません。'])
  }
  return permalink.value;
}

export function getPostedAt(toParse: IAnnotate[], filePath: string, annotateLine: number): IDay | undefined {
  const postedAt = toParse.find(v => v.key === 'postedAt');
  if ( !postedAt ) {
    fatal(filePath, annotateLine, ['投稿日アノテートが不足しています。', 'postedAt: 年/月/日 のように指定してください。']);
    return undefined;
  }
  const data = postedAt.value.split('/').map(v => parseInt(v));
  if(data.some(v => isNaN(v))) {
    fatal(filePath, annotateLine, ['文字が含まれており、日付として不適切です。', 'postedAt: 年/月/日 のように指定してください。', '「月」「日」などの単語は不要で、年は西暦であることに注意してください。', '例: 2022/3/25']);
    return undefined;
  }
  if( data.length !== 3 ) {
    fatal(filePath, annotateLine, ['日付として不適切です。', 'postedAt: 年/月/日 のように指定してください。']);
    return undefined;
  }
  if(data[1] < 0 || data[1] > 12 ) {
    fatal(filePath, annotateLine, ['月は1～12の範囲で指定してください。']);
    return undefined;
  }
  if(data[2] < 0 || data[2] > 31 ) {
    fatal(filePath, annotateLine, ['日は1～31の範囲で指定してください。']);
    return undefined;
  }
  return { year: data[0], month: data[1], day: data[2] };
}


