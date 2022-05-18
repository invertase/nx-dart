import {
  addDependenciesToPackageJson,
  formatFiles,
  Generator,
  GeneratorCallback,
  removeDependenciesFromPackageJson,
  Tree,
} from '@nrwl/devkit';
import { nxDartPackageJson } from '../../utils/misc';
import changeLints from '../change-lints/generator';
import { runAllTasks } from '../utils/generator';
import { updateNxJson } from '../utils/nx-workspace';
import { LintRules } from './analysis-options';

export interface SetupWorkspaceOptions {
  lints?: LintRules;
}

export const setupWorkspaceForNxDart: Generator<SetupWorkspaceOptions> = async (
  tree,
  options
) => {
  const tasks: (GeneratorCallback | undefined)[] = [];

  addWorkspaceGitignoreRules(tree);
  tasks.push(await setupWorkspaceDependencies(tree));
  setupNxJson(tree);
  ensureWorkspacePubspec(tree);
  if (options.lints) {
    tasks.push(await changeLints(tree, { lints: options.lints }));
  }

  await formatFiles(tree);

  return runAllTasks(tasks);
};

async function setupWorkspaceDependencies(tree: Tree) {
  // When a workspace is created with a preset, that preset will be added to the dependencies
  // but we want to add the plugin to the devDependencies. So we remove it from the dependencies
  // first.
  const uninstall = removeDependenciesFromPackageJson(
    tree,
    ['@nx-dart/nx-dart'],
    []
  );

  const install = addDependenciesToPackageJson(
    tree,
    {},
    { '@nx-dart/nx-dart': nxDartPackageJson().version }
  );

  return runAllTasks([uninstall, install]);
}

function setupNxJson(tree: Tree) {
  updateNxJson(tree, (nxJson) => {
    // Add this plugin to plugins.
    const plugins = (nxJson.plugins = nxJson.plugins ?? []);
    if (!plugins.includes('@nx-dart/nx-dart')) {
      plugins.push('@nx-dart/nx-dart');
    }

    // Make this plugin the default collection.
    const defaultCollection = nxJson.cli?.defaultCollection;
    if (!defaultCollection) {
      nxJson.cli = {
        ...nxJson.cli,
        defaultCollection: '@nx-dart/nx-dart',
      };
    }

    const tasksRunnerOptions = nxJson.tasksRunnerOptions ?? {};
    const taskRunner = tasksRunnerOptions.default;
    const taskRunnerOptions = (taskRunner.options = taskRunner.options ?? {});

    // Add a runtime cache input for Dart / Flutter SDK.
    const runtimeCacheInputs = (taskRunnerOptions.runtimeCacheInputs =
      taskRunnerOptions.runtimeCacheInputs ?? []);
    const input = 'flutter --version || dart --version';
    if (!runtimeCacheInputs.includes(input)) {
      runtimeCacheInputs.push(input);
    }

    // Add Dart / Flutter related cacheable operations.
    const cacheableOperations = (taskRunnerOptions.cacheableOperations =
      taskRunnerOptions.cacheableOperations ?? []);
    const operations = ['format', 'analyze'];
    for (const operation of operations) {
      if (!cacheableOperations.includes(operation)) {
        cacheableOperations.push(operation);
      }
    }

    return nxJson;
  });
}

const nxDartIgnoreRules = `
# Ignore rules added by nx-dart

## Node
node_modules/

## Dart
.packages
.dart_tool/
build/
doc/api/
# We only ignore the pubspec.lock at the workspace root here.
# Other lock files should be ignored at the package level.
/pubspec.lock

## Flutter
.flutter-plugins
.flutter-plugins-dependencies
`;

function addWorkspaceGitignoreRules(tree: Tree) {
  let gitignore = '';
  const currentGitignore = tree.read('.gitignore', 'utf-8');
  if (currentGitignore) {
    gitignore += currentGitignore;
    gitignore += '\n';
  }
  gitignore += nxDartIgnoreRules;
  tree.write('.gitignore', gitignore);
}

const workspacePubspec = `
name: workspace
publish_to: none

environment:
  sdk: '>=2.17.0 <3.0.0'
`;

export function ensureWorkspacePubspec(tree: Tree) {
  if (!tree.exists('pubspec.yaml')) {
    tree.write('pubspec.yaml', workspacePubspec);
  }

  updateNxJson(tree, (nxJson) => {
    // Make the pubspec.yaml at the workspace root an implicit dependencies.
    const implicitDependencies = (nxJson.implicitDependencies =
      nxJson.implicitDependencies ?? {});
    if (!('pubspec.yaml' in implicitDependencies)) {
      implicitDependencies['pubspec.yaml'] = '*';
    }

    return nxJson;
  });
}
