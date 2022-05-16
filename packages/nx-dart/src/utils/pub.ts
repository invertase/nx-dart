import * as path from 'path';
import * as YAML from 'yaml';
import { readFile } from './fs';

export function pubspecPath(packageRoot: string) {
  return path.join(packageRoot, 'pubspec.yaml');
}

export interface Pubspec {
  name?: string;
  environment?: {
    sdk?: string;
    flutter?: string;
  };
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
}

export function loadPubspec(packageRoot: string): Pubspec | undefined {
  const contents = readFile(pubspecPath(packageRoot));
  if (contents === undefined) {
    return undefined;
  }
  return YAML.parse(contents);
}

export function isFlutterPackage(pubspec: Pubspec) {
  return (
    'flutter' in (pubspec.environment ?? {}) ||
    'flutter' in (pubspec.dependencies ?? {})
  );
}
