let globalFatal = false;

export function fatal(file: string, line: number, error: string[]) {
    console.error(`::error file=${file},line=${line},col=1::${error.join('%0A')}`);
    globalFatal = true;
}
export function warn(file: string, line: number, error: string[]) {
    console.error(`::warning file=${file},line=${line},col=1::${error.join('%0A')}`);
}
export function parseStopper() {
    if (globalFatal) process.exit(1);
}
