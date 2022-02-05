export function fatal(file: string, line: number, error: string) {
  console.error(`${file}:${line} error: ${error}`);
  process.exit(1);
}
