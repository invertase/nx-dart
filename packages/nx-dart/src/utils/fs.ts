import * as fs from 'fs';

export function readFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
}

export function removeFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true });
  }
}
