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
import { packageNameFromUri } from '../../utils/dart-source';
import { executeCommand } from '../../utils/execute-command';
import { AnalysisOptions, pubspecPath } from '../../utils/package';
import {
  inferPackageProjectType,
  readAnalysisOptions,
  readPubspec,
} from '../utils/package';
import { AddPackageGeneratorSchema } from './schema';
import path = require('path');

interface NormalizedOptions extends AddPackageGeneratorSchema {
  projectType: ProjectType;
}

function normalizeOptions(
  tree: Tree,
  options: AddPackageGeneratorSchema
): NormalizedOptions {
  const directory = normalizePath(options.directory);
  const projectType =
    options.projectType ?? inferPackageProjectType(tree, directory);

  return {
    directory,
    projectType,
  };
}

export default async function (tree: Tree, options: AddPackageGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const existingProjects = Object.keys(getProjects(tree));
  const workspaceAnalysisOptions = readAnalysisOptions(tree, '.');

  const tasks: (GeneratorCallback | undefined)[] = [];

  tasks.push(
    addPackageProject(
      tree,
      existingProjects,
      workspaceAnalysisOptions,
      normalizedOptions.directory,
      normalizedOptions.projectType
    )
  );

  const exampleDir = `${normalizedOptions.directory}/example`;
  if (tree.exists(`${exampleDir}/pubspec.yaml`)) {
    tasks.push(
      addPackageProject(
        tree,
        existingProjects,
        workspaceAnalysisOptions,
        exampleDir,
        'application'
      )
    );
  }

  await formatFiles(tree);

  return async () => {
    for (const task of tasks) {
      if (task) {
        await task();
      }
    }
  };
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
          arguments: ['pub', 'add', '--dev', workspaceIncludePackage],
          cwd: path.join(workspaceRoot, packageRoot),
          expectedErrorExitCodes: [],
        });
      }
    };
  }
}
