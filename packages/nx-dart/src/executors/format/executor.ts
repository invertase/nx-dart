import {
  createProjectGraphAsync,
  ExecutorContext,
  ProjectGraph,
  ProjectGraphProjectNode,
} from '@nrwl/devkit';
import { execSync } from 'child_process';
import * as path from 'path';
import { isDartFile } from '../../utils/dart-code';
import { FormatExecutorSchema } from './schema';

export default async function runExecutor(
  options: FormatExecutorSchema,
  context: ExecutorContext
) {
  const graph: ProjectGraph<unknown> = await createProjectGraphAsync();
  const projectNode = graph.nodes[context.projectName];
  const filePaths = filesToFormat(projectNode);
  const chunks = chunkify(filePaths, 10);

  let success = true;
  for (const chunk of chunks) {
    if (!format(projectNode.data.root, chunk, options.check)) {
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

function format(projectRoot: string, files: string[], check: boolean): boolean {
  const command = buildFormatCommand(
    check,
    files.map((filePath) => path.relative(projectRoot, filePath))
  );

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    return true;
  } catch (e) {
    if (e.status !== 1) {
      throw e;
    }
    return false;
  }
}

function buildFormatCommand(check: boolean, files: string[]) {
  const command = ['dart', 'format', '--show', 'all'];

  if (check) {
    command.push('--set-exit-if-changed', '--output', 'none');
  }

  command.push(...files.map((file) => `"${file}"`));
  return command.join(' ');
}

function chunkify(target: string[], size: number): string[][] {
  return target.reduce((current: string[][], value: string, index: number) => {
    if (index % size === 0) current.push([]);
    current[current.length - 1].push(value);
    return current;
  }, []);
}
