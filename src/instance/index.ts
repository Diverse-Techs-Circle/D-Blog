import { mkdir, readdir, rm, readFile, writeFile } from "fs/promises";
import { extname, join, resolve } from "path";
import { DBlogPage } from "../page";
import { parseStopper } from "../util/fatal";

export interface DBlogInstanceOptions {
  contentPath: string,
  webPath: string,
  siteUrl: string
}

export class DBlogInstance {
  constructor(public options: DBlogInstanceOptions){}

  async build() {
    const contents = await getAllFilesInJoin(this.options.contentPath, ['.md']);
    await rm(this.options.webPath, { recursive: true }).catch(() => {});
    await mkdir(this.options.webPath, { recursive: true }).catch(() => {});
    await writeFile(resolve(this.options.webPath, '.gitkeep'), '');
    const pages = contents
      .map(v => resolve(v.basePath, v.directory, v.dirent.name))
      .map(async v => new DBlogPage(
        (await readFile(v)).toString(), v, this
      ));
    const renderer = (await Promise.all(pages)).map(async v => {
      const target = resolve(this.options.webPath, v.permalink);
      await mkdir(target, { recursive: true }).catch(() => {});
      writeFile(resolve(target, 'index.html'), await v.render());
    });
    parseStopper();
    await Promise.all(renderer);
  }
}

export async function getAllFilesInJoin(path: string, extension: string[]) {
  let files = (await readdir(path, { withFileTypes: true })).map(v => ({
    directory: '',
    dirent: v,
    basePath: path,
  }));
  while (files.some(v => v.dirent.isDirectory())) {
    files = (
      await Promise.all(
        files.map(async v =>
          v.dirent.isDirectory()
            ? (
                await readdir(resolve(v.basePath, v.directory, v.dirent.name), {
                  withFileTypes: true,
                })
              ).map(e => ({
                basePath: v.basePath,
                directory: join(v.directory, v.dirent.name),
                dirent: e,
              }))
            : [v]
        )
      )
    ).flat();
  }
  return files.filter(v => extension.includes(extname(v.dirent.name)));
}
