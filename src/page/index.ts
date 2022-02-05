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
    fatal(filePath, 1, 'Something went wrong!');
  }

  async render(): Promise<html> {
    return this.page;
  }
}
