import { parseImports } from '@nx-dart/dart-parser';
import * as fs from 'fs';
import * as path from 'path';

export function isDartFile(filePath: string): boolean {
  return path.extname(filePath) === '.dart';
}

export function packageNameFromUri(importUri: string): string | undefined {
  if (!importUri.startsWith('package:')) {
    return;
  }
  const parsedUri = new URL(importUri);
  return parsedUri.pathname.split('/')[0];
}

export function importsForFile(file: string): string[] {
  return parseImports(fs.readFileSync(file, 'utf8'));
}
