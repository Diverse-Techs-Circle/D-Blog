import { DBlogInstance } from "../instance";
import { fatal, warn } from "../util/fatal";
import { annotateCheck, IAnnotate, ILineData } from "./annotateParse";
import { DBlogHTML } from "./header";

export type markdown = string;
export type html = string;

interface IDay { year: number, month: number, day: number }

export class DBlogPage {
  title: string;
  content: ILineData[];
  permalink: string;
  postedAt: IDay | null;
  constructor(page: markdown, public filePath: string, public instance: DBlogInstance) {


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
    }
  }

  async render(): Promise<html> {
    const body = this.content.map(v => {
      if(v.data.split('').every(v => [' '].includes(v))) {
        return ``
      }
      const splitted = v.data.split(' ');
      const headerTagSharp = splitted[0] ?? '';
      if(headerTagSharp !== '' && headerTagSharp.split('').every(v => v === '#')) {
        const level = headerTagSharp.length;
        if ( level > 6 ) {
          fatal(this.filePath, v.line, [
            'headerタグは、レベル1からレベル6までしか使えません。',
            '(#の数は6個以下になります)'
          ]);
        }
        return `<h${level}>${textDecoration(splitted.filter((_, i) => i !== 0).join(' '))}</h${level}>`;
      }
      return `<p>${textDecoration(v.data)}</p>`;
    }).join('');

    const html = new DBlogHTML(this.title + ' | D-Blog', 'ja');
    html.addMeta({ charset: 'UTF-8' });
    html.addMeta({ name: 'generator', content: 'D-Blog' });
    html.addMeta({ name: 'theme-color', content: '#0073ff' });
    html.addMeta({ name: 'creator', content: 'D-Techs Circle' });
    html.withOGP({
      type: 'article',
      url: this.instance.options.siteUrl + this.permalink,
      title: this.title,
      site_name: 'D-Blog',
      locale: 'ja_JP'
    });
    return html.render(body);
  }
}

export function textDecoration(text: markdown): html {
  return text
    .replace(/(?<!\\)\*(?<!\\)\*(.+)(?<!\\)\*(?<!\\)\*/g, '<b>$1</b>' )
    .replace(/(?<!\\)\*(.+)(?<!\\)\*/g, '<i>$1</i>' )
    .replace(/\_\_(.+)\_\_/g, '<u>$1</u>' )
    .replace(/\~\~(.+)\~\~/g, '<s>$1</s>' )
    .replace(/\\\*/g, '*' )
    .replace(/\\\_/g, '_' )
    .replace(/\\\~/g, '~' );
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


