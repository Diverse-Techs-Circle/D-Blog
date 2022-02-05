import { copyFile, mkdir, readdir, rm } from "fs/promises";
import { basename, extname, join, resolve } from "path";

export interface DBlogInstanceOptions {
  contentPath: string,
  webPath: string
}

export class DBlogInstance {
  constructor(public options: DBlogInstanceOptions){}

  async build() {
    const contents = await getAllFilesInJoin(this.options.contentPath, ['.md']);
    await rm(this.options.webPath, { recursive: true });
    await Promise.all(contents.map(async v => {
      const buildAt = resolve(this.options.webPath, basename(v.dirent.name, extname(v.dirent.name)));
      await mkdir(buildAt, {recursive: true}).catch(() => {});
      copyFile(
        resolve(v.basePath, v.directory, v.dirent.name),
        resolve(buildAt, 'index.html')
        );
    }));
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
