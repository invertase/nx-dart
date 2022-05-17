import {
  addDependenciesToPackageJson,
  formatFiles,
  Generator,
  GeneratorCallback,
  readWorkspaceConfiguration,
  removeDependenciesFromPackageJson,
  Tree,
} from '@nrwl/devkit';
import { nxDartPackageJson } from '../../utils/misc';
import { runAllTasks } from '../utils/generator';
import { updateNxJson } from '../utils/nx-workspace';
import {
  ensureWorkspaceAnalysisOptions,
  LintRules,
  updateWorkspaceAnalysisOptions,
} from './analysis-options';

export interface SetupWorkspaceOptions {
  overwrite?: boolean;
  lints: LintRules;
}

export const setupWorkspaceForNxDart: Generator<SetupWorkspaceOptions> = async (
  tree,
  options
) => {
  const overwrite = options.overwrite ?? false;

  const tasks: (GeneratorCallback | undefined)[] = [];

  addGitignoreRules(tree);
  tasks.push(await setupWorkspaceDependencies(tree));
  setupNxJson(tree, overwrite);
  ensureWorkspacePubspec(tree);
  ensureWorkspaceAnalysisOptions(tree);
  tasks.push(await updateWorkspaceAnalysisOptions(tree, options.lints));

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

function setupNxJson(tree: Tree, overwrite: boolean) {
  updateNxJson(tree, (nxJson) => {
    // Add this plugin to plugins.
    const plugins = (nxJson.plugins = nxJson.plugins ?? []);
    if (!plugins.includes('@nx-dart/nx-dart')) {
      plugins.push('@nx-dart/nx-dart');
    }

    // Make this plugin the default collection.
    const defaultCollection = nxJson.cli?.defaultCollection;
    if (!defaultCollection || overwrite) {
      nxJson.cli = {
        ...nxJson.cli,
        defaultCollection: '@nx-dart/nx-dart',
      };
    }

    // Make the pubspec.yaml and analysis_options.yaml files at the workspace root
    // implicit dependencies.
    const implicitDependencies = (nxJson.implicitDependencies =
      nxJson.implicitDependencies ?? {});
    if (!('pubspec.yaml' in implicitDependencies) || overwrite) {
      implicitDependencies['pubspec.yaml'] = '*';
    }
    if (!('analysis_options.yaml' in implicitDependencies) || overwrite) {
      implicitDependencies['analysis_options.yaml'] = '*';
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

const dartFlutterIgnoreRules = `
# Dart
.packages
.dart_tool/
build/
doc/api/
# We only ignore the pubspec.lock at the workspace root here.
# Other lock files should be ignored at the package level.
/pubspec.lock

# Flutter
.flutter-plugins
.flutter-plugins-dependencies
`;

function addGitignoreRules(tree: Tree) {
  const gitignore = tree.read('.gitignore', 'utf-8');
  tree.write('.gitignore', `${gitignore}\n${dartFlutterIgnoreRules}`);
}

const workspacePubspec = (name: string) => `
name: ${name}
publish_to: none

environment:
  sdk: '>=2.17.0 <3.0.0'
`;

export function ensureWorkspacePubspec(tree: Tree) {
  if (!tree.exists('pubspec.yaml')) {
    const config = readWorkspaceConfiguration(tree);
    tree.write(
      'pubspec.yaml',
      workspacePubspec(config.npmScope.replace('-', '_'))
    );
  }
}
