import {
  addProjectConfiguration,
  formatFiles,
  GeneratorCallback,
  getProjects,
  normalizePath,
  ProjectType,
  TargetConfiguration,
  Tree,
} from '@nrwl/devkit';
import { packageNameFromUri } from '../../utils/dart-source';
import {
  AnalysisOptions,
  pubspecPath,
  removeDependencyFromPackage,
} from '../../utils/package';
import { runAllTasks } from '../utils/generator';
import {
  inferPackageProjectType,
  readAnalysisOptions,
  readPubspec,
} from '../utils/package';
import { AddPackageGeneratorSchema } from './schema';
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

  return runAllTasks(tasks);
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
    // There are workspace wide analysis options, so we remove the package's
    // analysis options.
    return removeAnalysisOptions(tree, packageRoot);
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

function removeAnalysisOptions(
  tree: Tree,
  packageRoot: string
): GeneratorCallback | undefined {
  const analysisOptions = readAnalysisOptions(tree, packageRoot);
  if (analysisOptions !== undefined) {
    tree.delete(`${packageRoot}/analysis_options.yaml`);

    const includePackage = packageNameFromUri(analysisOptions.include ?? '');
    if (includePackage) {
      // Remove the package from which analysis options were included.
      // The pubspec.yaml and analysis_options.yaml at the workspace root
      // handle everything now.
      return () => removeDependencyFromPackage(packageRoot, includePackage);
    }
  }
}
