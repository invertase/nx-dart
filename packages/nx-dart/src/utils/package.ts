import { workspaceRoot } from '@nrwl/devkit';
import * as path from 'path';
import * as pkg from 'path';
import * as YAML from 'yaml';
import { executeCommand } from './execute-command';
import { readFile } from './fs';

export function pubspecPath(packageRoot: string) {
  return pkg.join(packageRoot, 'pubspec.yaml');
}

export interface Pubspec {
  name?: string;
  environment?: {
    sdk?: string;
    flutter?: string;
  };
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
  flutter?: {
    plugin?: unknown;
  };
}

export function loadPubspec(packageRoot: string): Pubspec | undefined {
  const contents = readFile(pubspecPath(packageRoot));
  if (contents === undefined) {
    return undefined;
  }
  return YAML.parse(contents);
}

export interface FlutterMetadata {
  project_type: 'app' | 'package' | 'plugin' | 'plugin_ffi';
}

export function isFlutterPackage(pubspec: Pubspec) {
  return (
    'flutter' in (pubspec.environment ?? {}) ||
    'flutter' in (pubspec.dependencies ?? {})
  );
}

export function isFlutterPlugin(pubspec: Pubspec) {
  return pubspec?.flutter?.plugin !== undefined;
}

export interface AnalysisOptions {
  include?: string;
  analyzer?: {
    exclude?: string[];
  };
  linter?: {
    rules?: string[] | Record<string, boolean>;
  };
}

export async function addHostedDependencyToPackage(
  packageRoot: string,
  name: string,
  { dev }: { dev?: boolean } = {}
) {
  const args = ['pub', 'add'];
  if (dev) {
    args.push('--dev');
  }
  args.push(name);

  await executeCommand({
    executable: 'dart',
    arguments: args,
    expectedErrorExitCodes: [],
    cwd: path.resolve(workspaceRoot, packageRoot),
  });
}

export async function removeDependencyFromPackage(
  packageRoot: string,
  name: string
) {
  const args = ['pub', 'remove', name];

  await executeCommand({
    executable: 'dart',
    arguments: args,
    expectedErrorExitCodes: [],
    cwd: path.resolve(workspaceRoot, packageRoot),
  });
}
