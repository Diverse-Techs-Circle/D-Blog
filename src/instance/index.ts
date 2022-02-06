import { mkdir, readdir, rm, readFile, writeFile } from "fs/promises";
import { basename, extname, join, resolve } from "path";
import { DBlogPage } from "../page";
import { parseStopper } from "../util/fatal";
import { build } from "estrella";
import { compile } from "sass";
import { cwd } from "process";
export interface DBlogInstanceOptions {
  contentPath: string,
  webPath: string,
  siteUrl: string,
  domainPrefix: string,
  relativePath: boolean
}

export class DBlogInstance {
  constructor(public options: DBlogInstanceOptions){}

  async build() {
    const contents = await getAllFilesInJoin(this.options.contentPath, ['.md']);
    await rm(this.options.webPath, { recursive: true }).catch(() => {});
    await mkdir(this.options.webPath, { recursive: true }).catch(() => {});
    await writeFile(resolve(this.options.webPath, '.gitkeep'), '');

    await mkdir(resolve(this.options.webPath, 'scripts'), { recursive: true }).catch(() => {})

    const scriptRoot = resolve(cwd(), 'src', 'scripts');
    const styleRoot = resolve(cwd(), 'src', 'styles');

    await build({
      target: 'esnext',
      entryPoints: (await readdir(scriptRoot)).map(v => resolve(scriptRoot, v)).filter(v => v.endsWith('.ts')),
      bundle: true,
      minify: true,
      outdir: resolve(this.options.webPath, 'scripts'),
      sourcemap: false,
      platform: 'browser'
    }).catch(console.error);

    await mkdir(resolve(this.options.webPath, 'styles')).catch(() => {});
    await Promise.all((await readdir(styleRoot)).filter(v => v.endsWith('.scss')).map(async v => {
      const sass = compile(resolve(styleRoot, v), {
          style: 'compressed'
      });
      await writeFile(resolve(this.options.webPath, 'styles', `${basename(v, extname(v))}.css`), sass.css);
    }))

    const pages = contents
      .map(v => resolve(v.basePath, v.directory, v.dirent.name))
      .map(async v => new DBlogPage(
        (await readFile(v)).toString(), v, this
      ));
    const renderer = (await Promise.all(pages)).map(async v => {
      const target = resolve(this.options.webPath, 'article', v.permalink);
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
