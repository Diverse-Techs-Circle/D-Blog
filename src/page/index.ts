import { fatal } from "../util/fatal";

export type markdown = string;
export type html = string;

export class DBlogPage {
  title: string;
  permalink: string;
  postedAt: Date;
  constructor(public page: markdown, public filePath: string) {
    this.title = '';
    this.permalink = '';
    this.postedAt = new Date();
    fatal(filePath, 1, [
      'D-Blogアノテートが不足しています。',
      '各Markdownファイルには、//@D-Blog --- と、 //--- で囲まれたアノテートが必要です。',
      '詳しくはREADMEをご覧ください。'
    ]);
  }

  async render(): Promise<html> {
    return this.page;
  }
}
