import { relative, resolve } from "path";
import { cwd } from "process";

export function fatal(file: string, line: number, error: string) {
  console.error(file);
  console.error(`Error: ${line}:1 ${error}`);
  process.exit(1);
}
