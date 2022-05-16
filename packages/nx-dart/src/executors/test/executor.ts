import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import { removeFile } from '../../utils/fs';
import { isFlutterPackage, loadPubspec } from '../../utils/pub';
import { executeCommand } from '../../utils/execute-command';
import { TestExecutorSchema } from './schema';

const coverageDir = 'coverage';
const coverageLcovFile = path.join(coverageDir, 'lcov.info');
const coverageDartDataDir = path.join(coverageDir, 'dart');

export default async function runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot = context.workspace.projects[context.projectName].root;
  const pubspec = loadPubspec(projectRoot);
  if (!pubspec) {
    throw new Error(`Could not find pubspec.yaml in ${projectRoot}`);
  }
  const tool = isFlutterPackage(pubspec) ? 'flutter' : 'dart';
  const args = buildTestArguments(tool, options);

  if (options.coverage) {
    removeFile(path.join(projectRoot, coverageDir));
  }

  let success = executeCommand({
    executable: tool,
    arguments: args,
    cwd: projectRoot,
  });

  if (success && options.coverage && tool === 'dart') {
    // The `flutter` tool already outputs coverage data in the form of a .lcov file,
    // so we only need to convert it when using the `dart` tool.
    success = convertCoverageDataToLcov(projectRoot);
  }

  return {
    success: success,
  };
}

function buildTestArguments(
  tool: 'dart' | 'flutter',
  options: TestExecutorSchema
) {
  const command = ['test'];

  if (!('r' in options) && !('reporter' in options)) {
    // We default to the expanded reporter, because it plays better with Nx's caching of task
    // executions.
    command.push('--reporter', 'expanded');
  }

  for (const [key, value] of Object.entries(options)) {
    if (key === 'targets') {
      // We add the targets as the last arguments, because they are not named options.
      continue;
    }

    if (key === 'coverage') {
      if (value) {
        switch (tool) {
          case 'dart':
            command.push('--coverage', coverageDartDataDir);
            break;
          case 'flutter':
            command.push('--coverage', '--coverage-path', coverageLcovFile);
            break;
        }
      }
      continue;
    }

    command.push(`--${key}`, value.toString());
  }

  if (options.targets) {
    command.push(...options.targets);
  }

  return command;
}

function convertCoverageDataToLcov(projectRoot: string) {
  // Ensure that the `coverage` package is globally installed.
  let success = executeCommand({
    executable: 'dart',
    arguments: ['pub', 'global', 'activate', 'coverage'],
  });
  if (!success) {
    return false;
  }

  // Then run the conversion.
  success = executeCommand({
    executable: 'dart',
    arguments: [
      'pub',
      'global',
      'run',
      'coverage:format_coverage',
      '--lcov',
      '--in',
      coverageDartDataDir,
      '--out',
      coverageLcovFile,
    ],
    cwd: projectRoot,
  });
  if (!success) {
    return false;
  }

  removeFile(path.join(projectRoot, coverageDartDataDir));

  return true;
}
