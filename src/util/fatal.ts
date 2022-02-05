import { relative, resolve } from "path";
import { cwd } from "process";

export function fatal(file: string, line: number, error: string) {
  console.error(file);
  console.error(`##[error]  ${line}:1  error  ${error}`);
  process.exit(1);
}
