import { mkdir, readdir, rm, readFile, writeFile } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { cwd } from 'process';
import { build } from 'estrella';
import { compile } from 'sass';
import { DBlogPage } from '../page';
import { parseStopper } from '../util/fatal';
import { build, file } from "estrella";
import { compile } from "sass";
import { cwd } from "process";
import Fontmin from "fontmin";
export interface DBlogInstanceOptions {
    contentPath: string;
    webPath: string;
    siteUrl: string;
    domainPrefix: string;
    relativePath: boolean;
    mplus: string
}
type letterType = 'MPlus-Bold' | 'MPlus-Regular';

export class DBlogInstance {
    constructor(public options: DBlogInstanceOptions) {}

    async build() {
        const contents = await getAllFilesInJoin(this.options.contentPath, ['.md']);
        await rm(this.options.webPath, { recursive: true }).catch();
        await mkdir(this.options.webPath, { recursive: true }).catch();
        await writeFile(resolve(this.options.webPath, '.gitkeep'), '');

    letterList: { weight: letterType, data: string[] }[] = [
      { weight: 'MPlus-Bold', data: [] },
      { weight: 'MPlus-Regular', data: [] },
    ];
    urlsuffix = `-${new Date().getTime()}`;
    constructor(public options: DBlogInstanceOptions) {}

    useLetter(weight: letterType, string: string) {
      this.letterList = this.letterList.map(v => v.weight === weight ? { weight, data: [...new Set([...string.split(''), ...v.data])] } : v);
      return string;
    }

    async build() {
        const contents = await getAllFilesInJoin(this.options.contentPath, ['.md']);
        await rm(this.options.webPath, { recursive: true }).catch();
        await mkdir(this.options.webPath, { recursive: true }).catch();
        await writeFile(resolve(this.options.webPath, '.gitkeep'), '');

        await mkdir(resolve(this.options.webPath, 'scripts'), { recursive: true }).catch();

        const scriptRoot = resolve(cwd(), 'src', 'scripts');
        const styleRoot = resolve(cwd(), 'src', 'styles');

        await build({
            target: 'esnext',
            entryPoints: (await readdir(scriptRoot)).map(v => resolve(scriptRoot, v)).filter(v => v.endsWith('.ts')),
            bundle: true,
            minify: true,
            outdir: resolve(this.options.webPath, 'scripts'),
            sourcemap: false,
            platform: 'browser',
        }).catch(console.error);


      await mkdir(resolve(this.options.webPath, 'styles')).catch(() => {});
      await Promise.all((await readdir(styleRoot)).filter(v => v.endsWith('.scss')).map(async v => {
        const sass = compile(resolve(styleRoot, v), {
            style: 'compressed'
        });
        await writeFile(resolve(this.options.webPath, 'styles', `${basename(v, extname(v))}.css`), sass.css.replace(/@{dblog-url-suffix}/g, this.urlsuffix));
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
      parseStopper();

      const letters = this.letterList.map(v => ( { weight: v.weight, data: v.data.join('') } ));
      console.log(letters);
      letters.forEach(v => {
        console.log(join(this.options.mplus,`${v.weight}.ttf`));
        new Fontmin()
            .use(Fontmin.glyph({
                text: v.data,
                hinting: false         // keep ttf hint info (fpgm, prep, cvt). default = true
            }))
            .use(Fontmin.ttf2woff2())
            .src(join(this.options.mplus,`${v.weight}.ttf`))
            .run(async (_, files) => {
              const fontdir = resolve(this.options.webPath, 'assets', 'font');
              await mkdir(fontdir, { recursive: true }).catch(() => {});
              await writeFile(resolve(fontdir, `${v.weight}${this.urlsuffix}.woff2`), files[0]._contents);
            });
      });

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
                        : [v],
                ),
            )
        ).flat();
    }
    return files.filter(v => extension.includes(extname(v.dirent.name)));
}
