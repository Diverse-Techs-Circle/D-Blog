import type { ILineData } from '../annotateParse';

type operatorFunc = (string: string) => boolean;
export interface BlockParsed extends ILineData {
    needToParse: boolean;
}
export function parseBlock(code: (ILineData | BlockParsed)[], startCondition: operatorFunc, endCondition: operatorFunc, parser: (v: ILineData[]) => string) {
    return parseBlockStep(code.map(v => 'needToParse' in v ? v : { ...v, needToParse: true }), startCondition, endCondition, parser);
}

function parseBlockStep(code: BlockParsed[], startCondition: operatorFunc, endCondition: operatorFunc, parser: (v: ILineData[]) => string): BlockParsed[] {
    const codeWithIndex = code.map((v, i) => ({ ...v, index: i }));
    const startRanges = codeWithIndex.filter(v => startCondition(v.data));
    if (startRanges.length < 1) {
        return code;
    }
    const startRange = startRanges.reduce((a, b) => a.line < b.line ? a : b);
    const endRanges = codeWithIndex.filter(v => endCondition(v.data) && v.line > startRange.line);
    if (endRanges.length < 1) {
        return code;
    }
    const endRange = endRanges.reduce((a, b) => a.line < b.line ? a : b);

    const beforeBlock = codeWithIndex.filter(v => v.index < startRange.index);
    const inBlock = codeWithIndex.filter(v => startRange.index <= v.index && v.index <= endRange.index);
    const afterBlock = codeWithIndex.filter(v => v.index > endRange.index);

    const data = parser(inBlock.map(v => ({ data: v.data, line: v.line })));

    const newCode = [
        ...beforeBlock.map(v => ({ data: v.data, line: v.line, needToParse: v.needToParse })),
        { data, line: -1, needToParse: false },
        ...afterBlock.map(v => ({ data: v.data, line: v.line, needToParse: v.needToParse })),
    ];
    return parseBlockStep(newCode, startCondition, endCondition, parser);
}

export function resolveIndent(code: ILineData[]): ILineData[] {
    const withSpace = code.map(v => {
        const data = v.data.replace(/\t/g, '  ');
        const match = data.match(/^( *)(.*)$/) ?? ['', ''];
        return {
            data,
            spaces: match[1].length,
            line: v.line,
        };
    });
    const minus = withSpace[0].spaces;
    return withSpace.map(v => ({
        data: `${[...[Math.max(v.spaces - minus, 0)]].map(() => ' ').join('')}${v.data}`,
        line: v.line,
    }));
}
