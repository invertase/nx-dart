import {
  createProjectGraphAsync,
  ExecutorContext,
  ProjectGraph,
  ProjectGraphProjectNode,
} from '@nrwl/devkit';
import * as path from 'path';
import { isDartFile } from '../../utils/dart-source';
import { executeCommand } from '../../utils/execute-command';
import { FormatExecutorSchema } from './schema';

export default async function runExecutor(
  options: FormatExecutorSchema,
  context: ExecutorContext
) {
  const graph: ProjectGraph<unknown> = await createProjectGraphAsync();
  const projectNode = graph.nodes[context.projectName];

  // We pass the individual files to format, instead of the project root, because
  // we don't want to format files in nested projects.
  const filePaths = filesToFormat(projectNode);
  const chunks = chunkify(filePaths, 10);

  let success = true;
  for (const chunk of chunks) {
    if (!(await format(projectNode.data.root, chunk, options.check))) {
      success = false;
    }
  }

  return {
    success,
  };
}

function filesToFormat(
  projectNode: ProjectGraphProjectNode<unknown>
): string[] {
  return projectNode.data.files.map((file) => file.file).filter(isDartFile);
}

async function format(
  projectRoot: string,
  files: string[],
  check: boolean
): Promise<boolean> {
  const args = buildFormatArguments(
    check,
    files.map((filePath) => path.relative(projectRoot, filePath))
  );

  return executeCommand({
    executable: 'dart',
    arguments: args,
    cwd: projectRoot,
    throwOnFailure: false,
  });
}

function buildFormatArguments(check: boolean, files: string[]) {
  const command = ['format', '--show', 'all'];

  if (check) {
    command.push('--set-exit-if-changed', '--output', 'none');
  }

  command.push(...files);
  return command;
}

function chunkify(target: string[], size: number): string[][] {
  return target.reduce((current: string[][], value: string, index: number) => {
    if (index % size === 0) current.push([]);
    current[current.length - 1].push(value);
    return current;
  }, []);
}
