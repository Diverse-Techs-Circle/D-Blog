import { relative } from "path";
import { cwd } from "process";

export function fatal(file: string, line: number, error: string) {
  console.error(`${relative(cwd(), file)}:${line} error: ${error}`);
  process.exit(1);
}
