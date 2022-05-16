import {
  addProjectConfiguration,
  formatFiles,
  GeneratorCallback,
  getProjects,
  normalizePath,
  ProjectType,
  TargetConfiguration,
  Tree,
  workspaceRoot,
} from '@nrwl/devkit';
import { executeCommand } from '../../executors/utils/execute-command';
import { AnalysisOptions } from '../../utils/analyzer';
import { packageNameFromUri } from '../../utils/dart-code';
import { pubspecPath } from '../../utils/pub';
import { readAnalysisOptions } from '../utils/analyzer';
import { readPubspec } from '../utils/pub';
import { AddPackageGeneratorSchema } from './schema';
import path = require('path');

function normalizeOptions(
  tree: Tree,
  options: AddPackageGeneratorSchema
): AddPackageGeneratorSchema {
  const directory = normalizePath(options.directory);

  return {
    directory,
    projectType: options.projectType,
  };
}

export default async function (tree: Tree, options: AddPackageGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const existingProjects = Object.keys(getProjects(tree));
  const workspaceAnalysisOptions = readAnalysisOptions(tree, '.');

  const task = addPackageProject(
    tree,
    existingProjects,
    workspaceAnalysisOptions,
    normalizedOptions.directory,
    normalizedOptions.projectType
  );

  await formatFiles(tree);

  return task;
}

function addPackageProject(
  tree: Tree,
  existingProjects: string[],
  workspaceAnalysisOptions: AnalysisOptions | undefined,
  packageRoot: string,
  projectType: ProjectType
): GeneratorCallback | undefined {
  const pubspec = readPubspec(tree, packageRoot);
  if (!pubspec) {
    throw new Error(`Could not find a pubspec.yaml file in ${packageRoot}`);
  }

  const packageName = pubspec.name;
  if (!packageName) {
    throw new Error(`Could not find a name in ${pubspecPath(packageRoot)}`);
  }
  if (existingProjects.includes(packageName)) {
    throw new Error(`A project with the name ${packageName} already exists.`);
  }

  addProjectConfiguration(tree, packageName, {
    root: packageRoot,
    projectType: projectType,
    targets: buildPackageTargets(tree, packageRoot),
  });
  existingProjects.push(packageName);

  if (workspaceAnalysisOptions !== undefined) {
    return migrateToWorkspaceAnalysisOptions(
      tree,
      packageRoot,
      workspaceAnalysisOptions
    );
  }
}

function buildPackageTargets(tree: Tree, directory: string) {
  const targets: Record<string, TargetConfiguration> = {
    format: {
      executor: '@nx-dart/nx-dart:format',
      outputs: [],
    },
    analyze: {
      executor: '@nx-dart/nx-dart:analyze',
      outputs: [],
    },
  };

  const hasTests = tree.exists(`${directory}/test`);
  const hasIntegrationTests = tree.exists(`${directory}/integration_test`);

  if (hasTests) {
    targets.test = {
      executor: '@nx-dart/nx-dart:test',
      outputs: [`${directory}/coverage`],
    };
  }

  if (hasIntegrationTests) {
    targets.e2e = {
      executor: '@nx-dart/nx-dart:test',
      outputs: [`${directory}/coverage`],
      options: {
        targets: ['integration_test'],
      },
    };
  }

  return targets;
}

function migrateToWorkspaceAnalysisOptions(
  tree: Tree,
  packageRoot: string,
  workspaceAnalysisOptions: AnalysisOptions
): GeneratorCallback | undefined {
  const workspaceIncludePackage = packageNameFromUri(
    workspaceAnalysisOptions.include ?? ''
  );
  let includePackage: string | undefined;

  const analysisOptions = readAnalysisOptions(tree, packageRoot);
  if (analysisOptions !== undefined) {
    tree.delete(`${packageRoot}/analysis_options.yaml`);
    includePackage = packageNameFromUri(analysisOptions.include ?? '');
  }

  if (workspaceIncludePackage !== includePackage) {
    return () => {
      if (includePackage) {
        executeCommand({
          executable: 'dart',
          arguments: ['pub', 'remove', includePackage],
          cwd: path.join(workspaceRoot, packageRoot),
          expectedErrorExitCodes: [],
        });
      }
      if (workspaceIncludePackage) {
        executeCommand({
          executable: 'dart',
          arguments: ['pub', 'add', workspaceIncludePackage],
          cwd: path.join(workspaceRoot, packageRoot),
          expectedErrorExitCodes: [],
        });
      }
    };
  }
}
