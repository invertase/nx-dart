import { ProjectType, Tree } from '@nrwl/devkit';
import * as YAML from 'yaml';
import {
  AnalysisOptions,
  FlutterMetadata,
  isFlutterPackage,
  isFlutterPlugin,
  Pubspec,
} from '../../utils/package';

export function readPubspec(
  tree: Tree,
  packageRoot: string
): Pubspec | undefined {
  if (tree.exists(`${packageRoot}/pubspec.yaml`)) {
    return YAML.parse(tree.read(`${packageRoot}/pubspec.yaml`, 'utf-8'));
  }
}

export function readFlutterMetadata(
  tree: Tree,
  packageRoot: string
): FlutterMetadata | undefined {
  if (tree.exists(`${packageRoot}/.metadata`)) {
    return YAML.parse(tree.read(`${packageRoot}/.metadata`, 'utf-8'));
  }
}

export function readAnalysisOptions(
  tree: Tree,
  directory: string
): AnalysisOptions | undefined {
  if (tree.exists(`${directory}/analysis_options.yaml`)) {
    return (
      YAML.parse(tree.read(`${directory}/analysis_options.yaml`, 'utf-8')) ?? {}
    );
  }
}

export function inferPackageProjectType(
  tree: Tree,
  packageRoot: string
): ProjectType | undefined {
  const pubspec = readPubspec(tree, packageRoot);
  if (!pubspec) {
    // This is not a Dart package.
    return;
  }

  if (isFlutterPackage(pubspec)) {
    // This is a Flutter package.
    const metadata = readFlutterMetadata(tree, packageRoot);
    if (metadata) {
      // If we have a .metadata file we use that because it is the most accurate way to determine
      // the project type.
      switch (metadata.project_type) {
        case 'app':
          return 'application';
        case 'package':
        case 'plugin':
        case 'plugin_ffi':
          return 'library';
      }
    }

    const platformDirs = ['android', 'ios', 'macos', 'linux', 'windows', 'web'];
    const hasPlatformDir = platformDirs.some((dir) =>
      tree.exists(`${packageRoot}/${dir}`)
    );
    const hasMain = tree.exists(`${packageRoot}/lib/main.dart`);
    if (!isFlutterPlugin(pubspec) && (hasPlatformDir || hasMain)) {
      return 'application';
    }

    return 'library';
  } else {
    // This is a Dart package.
    if (tree.children(`${packageRoot}/example`).length > 0) {
      return 'library';
    }

    return 'application';
  }
}
