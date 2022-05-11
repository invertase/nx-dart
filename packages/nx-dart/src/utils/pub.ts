import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';

export function pubspecPath(packageRoot: string) {
  return path.join(packageRoot, 'pubspec.yaml');
}

export function dartToolPath(packageRoot: string) {
  return path.join(packageRoot, '.dart_tool');
}

export function packageConfigPath(packageRoot: string) {
  return path.join(dartToolPath(packageRoot), 'package_config.json');
}

export interface PackageConfig {
  packages: ResolvedDependency[];
}

export interface ResolvedDependency {
  name: string;
  rootUri: string;
}

export function loadPackageConfig(
  packageRoot: string
): PackageConfig | undefined {
  const packageConfigPath = path.join(
    packageRoot,
    '.dart_tool',
    'package_config.json'
  );
  if (!fs.existsSync(packageConfigPath)) {
    return undefined;
  }
  return JSON.parse(
    fs.readFileSync(packageConfigPath, 'utf8')
  ) as PackageConfig;
}

export interface Pubspec {
  name?: string;
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
}

export function loadPubspec(packageRoot: string): Pubspec {
  return YAML.parse(fs.readFileSync(pubspecPath(packageRoot), 'utf8'));
}
