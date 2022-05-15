import * as fs from 'fs';

export type ReadFile = (path: string) => string | undefined;

export function fsReadFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return undefined;
}
