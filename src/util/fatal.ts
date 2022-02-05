import { relative, resolve } from "path";
import { cwd } from "process";

export function fatal(file: string, line: number, error: string[]) {
  console.error(`::error file=${file},line=${line},col=1::${error.join('%0A')}`);
  process.exit(1);
}
