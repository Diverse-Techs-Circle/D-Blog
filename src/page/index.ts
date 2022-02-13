import type { DBlogInstance } from '../instance';
import type { IAnnotate, ILineData } from './annotateParse';
import { join } from 'path';
import { annotateCheck } from './annotateParse';
import { parseCodeBlock } from './block/codeblock';
import { DBlogHTML } from './header';
import { fatal, warn } from '../util/fatal';
import { getGlobalPageTitle } from '../util/getTitle';
import { wrapOn } from '../util/html';

export type markdown = string;
export type html = string;

interface IDay {
    year: number; month: number; day: number;
}
interface IAuthor {
    name: string; url: string;
}

export class DBlogPage {
    title: string;
    content: ILineData[];
    permalink: string;
    postedAt: IDay | null;
    author: IAuthor | null;
    constructor(page: markdown, public filePath: string, public instance: DBlogInstance) {
        const annotateKey = ['title', 'permalink', 'postedAt', 'author'];
        const parsed = annotateCheck(page, filePath);
        this.content = [];
        this.title = '';
        this.permalink = '';
        this.postedAt = null;
        this.author = null;
        if (parsed === null) {
            fatal(filePath, 1, [
                'D-Blogアノテートが不足しています。',
                '各Markdownファイルには、//@D-Blog --- と、 //--- で囲まれたアノテートが必要です。',
                '詳しくはREADMEをご覧ください。',
            ]);
        } else {
            const annotate = parsed.annotate;
            this.content = parsed.content;
            annotate.filter(v => !annotateKey.includes(v.key)).forEach(v => {
                warn(filePath, v.lineNumber, [
                    `D-Blogアノテート「${v.key}」は無効です。`,
                ]);
            });

            const toParse = annotate.filter(v => annotateKey.includes(v.key));
            const firstLine = (annotate[0]?.lineNumber ?? 1) - 1;

            this.title = getTitle(toParse, filePath, firstLine) ?? this.title;
            this.permalink = getPermalink(toParse, filePath, firstLine) ?? this.permalink;
            this.postedAt = getPostedAt(toParse, filePath, firstLine) ?? this.postedAt;
            this.author = getAuthor(toParse, filePath, firstLine) ?? this.author;
        }
    }

    async render(): Promise<html> {
        const body = (await Promise.all(
            parseCodeBlock(this.content).map(async v => {
                if (!v.needToParse) return v.data;
                if (v.data.split('').every(d => [' '].includes(d))) return ``;
                const splitted = v.data.split(' ');
                const headerTagSharp = splitted[0] ?? '';
                if (headerTagSharp !== '' && headerTagSharp.split('').every(h => h === '#')) {
                    const level = headerTagSharp.length;
                    if (level > 5) {
                        fatal(this.filePath, v.line, [
                            'headerタグは、レベル1からレベル5までしか使えません。',
                            '(#の数は5個以下になります)',
                        ]);
                    }
        return `<h${level + 1}>${this.instance.useLetter('MPlus-Bold', textDecoration(splitted.filter((_, i) => i !== 0).join(' '), this.instance))}</h${level}>`;
      }

      const linkcardMatch = v.data.match(/\[linkcard\]\((http.+)\)/);
      if(linkcardMatch) {
        return `<a class="linkcard" href="${linkcardMatch[1]}" target="_blank" rel="noopener noreferrer">${
          wrapOn('p', [this.instance.useLetter('MPlus-Regular', await getGlobalPageTitle(linkcardMatch[1]))], ['title']) +
          wrapOn('p', [this.instance.useLetter('MPlus-Regular', (linkcardMatch[1].match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/) ?? ['', ''])[1])], ['domain'])
        }</a>`;
      }

      return `<p>${textDecoration(this.instance.useLetter('MPlus-Regular', v.data), this.instance)}</p>`;
    }))).join('');

    const html = new DBlogHTML(this.title + ' | D-Blog', 'ja');
    html.addMeta({ charset: 'UTF-8' });
    html.addMeta({ name: 'generator', content: 'D-Blog' });
    html.addMeta({ name: 'theme-color', content: '#0073ff' });
    html.addMeta({ name: 'creator', content: 'D-Techs Circle' });
    html.addMeta({ name: 'robots', content: ['noindex', 'nofollow'] });
    html.addMeta({
      name: 'viewport',
      content: [
        { key: 'width', value: 'device-width' },
        { key: 'initial-scale', value: 1 },
        { key: 'maximum-scale', value: 5 },
        { key: 'minimum-scale', value: 1 },
      ]
    })
    this.instance.useLetter('MPlus-Bold', this.title)
    html.withOGP({
      type: 'article',
      url: this.instance.options.siteUrl + 'article/' + this.permalink,
      title: this.instance.useLetter('MPlus-Regular', this.title),
      site_name: 'D-Blog',
      locale: 'ja_JP'
    });
    html.addStyle(this.instance.options.relativePath ? '../../styles/article.css' : join(this.instance.options.domainPrefix, 'styles', 'article.css'));
    html.addScript(this.instance.options.relativePath ? '../../scripts/article.js' : join(this.instance.options.domainPrefix, 'scripts', 'article.js'));
    const article = wrapOn('article', [body]);
    const title = wrapOn('section', [
      wrapOn('h1', [this.title])
    ], undefined, 'title-wrapper');
    return html.render(wrapOn('div', [title, article], undefined, 'content'));
  }
}

export function textDecoration(text: markdown, instance: DBlogInstance): html {
  return text
    .replace(/(?<!\\)\*(?<!\\)\*(.+)(?<!\\)\*(?<!\\)\*/g, (...[,value]) => `<b>${instance.useLetter('MPlus-Bold', value)}</b>` )
    .replace(/(?<!\\)\*(.+)(?<!\\)\*/g, '<i>$1</i>' )
    .replace(/\_\_(.+?)\_\_/g, '<u>$1</u>' )
    .replace(/\~\~(.+?)\~\~/g, '<s>$1</s>' )
    .replace(/\~\~(.+?)\~\~/g, '<s>$1</s>' )
    .replace(/(?<!\\)\`(.+?)(?<!\\)\`/g, '<code class="inline">$1</code>' )
    .replace(/\\\*/g, '*' )
    .replace(/\\\_/g, '_' )
    .replace(/\\\~/g, '~' )
    .replace(/\\\`/g, '`');
}


export function getTitle(toParse: IAnnotate[], filePath: string, annotateLine: number): string | undefined {
    const title = toParse.find(v => v.key === 'title');
    if (!title) {
        fatal(filePath, annotateLine, ['タイトルアノテートが不足しています。', 'title: 記事のタイトル のように指定してください。']);
        return undefined;
    }
    if (title.value === '') {
        fatal(filePath, title.lineNumber, ['記事のタイトルは空ではいけません。']);
        return undefined;
    }
    if (title.value.length > 128) {
        fatal(filePath, title.lineNumber, ['記事のタイトルは128文字を超えてはいけません。']);
        return title.value;
    }
    if (title.value.length > 32) {
        warn(filePath, title.lineNumber, ['記事のタイトルは32文字以内が適切です。']);
    }
    return title.value;
}

export function getPermalink(toParse: IAnnotate[], filePath: string, annotateLine: number): string | undefined {
    const permalink = toParse.find(v => v.key === 'permalink');
    if (!permalink) {
        fatal(filePath, annotateLine, ['パーマリンクアノテートが不足しています。', 'permalink: パーマリンク のように指定してください。']);
        return undefined;
    }
    if (permalink.value === '') {
        fatal(filePath, permalink.lineNumber, ['パーマリンクは空ではいけません。']);
        return undefined;
    }
    if (permalink.value.length > 64) {
        fatal(filePath, permalink.lineNumber, ['パーマリンクは64文字を超えてはいけません。']);
    }
    if (!/^([A-Z]|[a-z]|[0-9]|-)+$/.test(permalink.value)) {
        fatal(filePath, permalink.lineNumber, ['パーマリンクには英数字とハイフンしか使えません。']);
    }
    return permalink.value;
}

export function getPostedAt(toParse: IAnnotate[], filePath: string, annotateLine: number): IDay | undefined {
    const postedAt = toParse.find(v => v.key === 'postedAt');
    if (!postedAt) {
        fatal(filePath, annotateLine, ['投稿日アノテートが不足しています。', 'postedAt: 年/月/日 のように指定してください。']);
        return undefined;
    }
    const data = postedAt.value.split('/').map(v => parseInt(v));
    if (data.some(v => isNaN(v))) {
        fatal(filePath, annotateLine, ['文字が含まれており、日付として不適切です。', 'postedAt: 年/月/日 のように指定してください。', '「月」「日」などの単語は不要で、年は西暦であることに注意してください。', '例: 2022/3/25']);
        return undefined;
    }
    if (data.length !== 3) {
        fatal(filePath, annotateLine, ['日付として不適切です。', 'postedAt: 年/月/日 のように指定してください。']);
        return undefined;
    }
    if (data[1] < 0 || data[1] > 12) {
        fatal(filePath, annotateLine, ['月は1～12の範囲で指定してください。']);
        return undefined;
    }
    if (data[2] < 0 || data[2] > 31) {
        fatal(filePath, annotateLine, ['日は1～31の範囲で指定してください。']);
        return undefined;
    }
    return { year: data[0], month: data[1], day: data[2] };
}


export function getAuthor(toParse: IAnnotate[], filePath: string, annotateLine: number): IAuthor | undefined {
    const author = toParse.find(v => v.key === 'author');
    if (!author) {
        fatal(filePath, annotateLine, ['作者アノテートが不足しています。', 'author: 作者@アイコンのURL のように指定してください。']);
        return undefined;
    }
    const match = author.value.match(/(.+)@(https:\/\/(.+))/);
    if (!match) {
        fatal(filePath, author.lineNumber, ['作者アノテートが不適切です。', 'author: 作者@アイコンのURL のように指定してください。', 'この行を削除すると、GitHub Actionが自動生成します。']);
        return undefined;
    }
    return { name: match[1], url: match[2] };
}
