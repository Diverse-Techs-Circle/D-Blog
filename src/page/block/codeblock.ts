import type { BlockParsed } from '.';
import type { ILineData } from '../annotateParse';
import { parseBlock, resolveIndent } from '.';
import { escapeHTML } from '../../util/escapeHTML';

export function parseCodeBlock(code: (ILineData | BlockParsed)[]): BlockParsed[] {
    return parseBlock(
        code,
        str => str.match(/^(\s*)(?<!\\)`(?<!\\)`(?<!\\)`(.*)$/) !== null,
        str => str.match(/^(\s*)(?<!\\)`(?<!\\)`(?<!\\)`$/) !== null,
        v => {
            const resolved = resolveIndent(v);
            const lang = (resolved[0].data.match(/^```(.*)$/) ?? ['', ''])[1];
            return [
                `<section class="codeblock">`,
                ...resolved
                    .filter((_, i) => i > 0 && i < resolved.length - 1)
                    .map(r => r.data)
                    .map((r, i) =>
                        `<div class="line"><div class="linenumber"><code>${i + 1}</code></div><pre><code>${escapeHTML(r)}</code></pre></div>`,
                    ),
                `<div class="lang">${lang}</div>`,
                `</section>`,
            ].join('');
        },
    );
}
