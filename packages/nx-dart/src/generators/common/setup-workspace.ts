import {
  addDependenciesToPackageJson,
  formatFiles,
  removeDependenciesFromPackageJson,
  Tree,
} from '@nrwl/devkit';
import fetch from 'node-fetch';
import { nxDartPackageJson } from '../../utils/misc';
import {
  addFileToImplicitDependencies,
  addNxPlugin,
  addRuntimeCacheInput,
  setDefaultCollection,
} from '../utils/nx-workspace';

export enum LintRules {
  core = 'core',
  recommended = 'recommended',
  flutter = 'flutter',
  all = 'all',
}

export interface SetupWorkspaceOptions {
  installDependencies?: boolean;
  overwrite?: boolean;
  lints: LintRules;
}

export async function setupWorkspaceForNxDart(
  tree: Tree,
  options: SetupWorkspaceOptions
) {
  const overwrite = options.overwrite ?? false;
  const installDependencies = options.installDependencies ?? false;

  await addDependenciesToWorkspace(tree, installDependencies);
  addNxPlugin(tree, '@nx-dart/nx-dart');
  setDefaultCollection(tree, '@nx-dart/nx-dart', overwrite);
  addRuntimeCacheInput(tree, 'default', 'flutter --version || dart --version');
  await setupAnalysisOptions(tree, options.lints, overwrite);
  await formatFiles(tree);
}

async function addDependenciesToWorkspace(tree: Tree, install: boolean) {
  // When a workspace is created with a preset, that preset will be added to the dependencies
  // but we want to add the plugin to the devDependencies. So we remove it from the dependencies
  // first.
  const uninstallCallback = removeDependenciesFromPackageJson(
    tree,
    ['@nx-dart/nx-dart'],
    []
  );
  if (install && uninstallCallback) {
    await uninstallCallback();
  }

  const installCallback = addDependenciesToPackageJson(
    tree,
    {},
    { '@nx-dart/nx-dart': nxDartPackageJson().version }
  );
  if (install && installCallback) {
    await installCallback();
  }
}

async function setupAnalysisOptions(
  tree: Tree,
  lints: LintRules,
  overwrite: boolean
) {
  if (!tree.exists('analysis_options.yaml') || overwrite) {
    tree.write('analysis_options.yaml', await buildAnalysisOptionsYaml(lints));
  }
  addFileToImplicitDependencies(tree, 'analysis_options.yaml', overwrite);
}

async function buildAnalysisOptionsYaml(lints: LintRules) {
  const parts: string[] = [];

  let include: string | undefined;
  let linterSection: string;
  switch (lints) {
    case LintRules.core:
      include = 'package:lints/core.yaml';
      break;
    case LintRules.recommended:
      include = 'package:lints/recommended.yaml';
      break;
    case LintRules.flutter:
      include = 'package:flutter_lints/flutter.yaml';
      break;
    case LintRules.all:
      linterSection = await downloadAllLintsConfig();
      break;
  }

  if (include) {
    parts.push(`
include: ${include}

`);
  }

  parts.push(`
analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true

`);

  if (linterSection) {
    parts.push(linterSection);
  }

  return parts.join('');
}

async function downloadAllLintsConfig() {
  const url =
    'https://raw.githubusercontent.com/dart-lang/linter/master/example/all.yaml';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not download all lint rules from ${url}: ${response.statusText}`
    );
  }
  const text = await response.text();

  // Remove comments
  return text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
}
