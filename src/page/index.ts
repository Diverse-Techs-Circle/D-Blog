import { fatal, warn } from "../util/fatal";
import { annotateCheck, IAnnotate } from "./annotateParse";

export type markdown = string;
export type html = string;

export class DBlogPage {
  title: string;
  permalink: string;
  postedAt: Date;
  constructor(public page: markdown, public filePath: string) {


    const annotateKey = ['title', 'permalink', 'postedAt'];
    const annotate = annotateCheck(page, filePath);
    this.title = '';
    this.permalink = '';
    this.postedAt = new Date();
    if ( annotate === null ) {
      fatal(filePath, 1, [
        'D-Blogアノテートが不足しています。',
        '各Markdownファイルには、//@D-Blog --- と、 //--- で囲まれたアノテートが必要です。',
        '詳しくはREADMEをご覧ください。'
      ]);
    } else {
      annotate.filter(v => !annotateKey.includes(v.key)).forEach(v => {
        warn(filePath, v.lineNumber, [
          `D-Blogアノテート「${v.key}」は無効です。`
        ]);
      });

      const toParse = annotate.filter(v => annotateKey.includes(v.key));
      const firstLine = (annotate[0]?.lineNumber ?? 1) - 1;

      this.title = getTitle(toParse, filePath, firstLine) ?? this.title;
      this.permalink = getPermalink(toParse, filePath, firstLine) ?? this.permalink;
      this.postedAt = new Date();
    }
  }

  async render(): Promise<html> {
    return this.page;
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

