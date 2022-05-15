import * as path from 'path';
import * as YAML from 'yaml';
import { fsReadFile } from './fs';

export function pubspecPath(packageRoot: string) {
  return path.join(packageRoot, 'pubspec.yaml');
}

export interface Pubspec {
  name?: string;
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
}

export function loadPubspec(
  packageRoot: string,
  readFile = fsReadFile
): Pubspec | undefined {
  const contents = readFile(pubspecPath(packageRoot));
  if (contents === undefined) {
    return undefined;
  }
  return YAML.parse(contents);
}
