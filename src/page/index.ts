export type markdown = string;
export type html = string;

export class DBlogPage {
  title: string;
  permalink: string;
  postedAt: Date;
  constructor(public page: markdown) {
    this.title = '';
    this.permalink = '';
    this.postedAt = new Date();
  }

  async render(): Promise<html> {
    return this.page;
  }
}
