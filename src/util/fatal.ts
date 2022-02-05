import { relative, resolve } from "path";
import { cwd } from "process";

export function fatal(file: string, line: number, error: string) {
  const pos = './' + relative(cwd(), file).replace(/\\/g, '/');
  console.error(`${pos}:${line} error: ${error}`);
  process.exit(1);
}
