import { BlockParsed, parseBlock, resolveIndent } from ".";
import { ILineData } from "../annotateParse";

export function parseCodeBlock(code: (ILineData | BlockParsed)[]): BlockParsed[] {
  return parseBlock(
    code,
    str => str.match(/^(\s*)(?<!\\)\`(?<!\\)\`(?<!\\)\`(.*)$/) !== null,
    str => str.match(/^(\s*)(?<!\\)\`(?<!\\)\`(?<!\\)\`$/) !== null,
    v => {
      const resolved = resolveIndent(v);
      const lang = (resolved[0].data.match(/^\`\`\`(.*)$/) ?? ['', ''])[1];
      return [
        `<section class="codeblock">`,
        ...resolved
          .filter((_, i) => i > 0 && i < resolved.length - 1)
          .map(v => v.data)
          .map((v, i) =>
            `<div class="line"><div class="linenumber"><code>${i}</code></div><pre><code>${v}</code></pre></div>`
          ),
        `<div class="lang">${lang}</div>`,
        `</section>`,
      ].join('');
    }
  )
}
