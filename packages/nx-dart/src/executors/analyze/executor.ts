import { ExecutorContext } from '@nrwl/devkit';
import { executeCommand } from '../../utils/execute-command';
import { AnalyzeExecutorSchema } from './schema';

export default async function runExecutor(
  options: AnalyzeExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot = context.workspace.projects[context.projectName].root;
  const args = buildAnalyzeArguments(options);

  return {
    success: await executeCommand({
      executable: 'dart',
      arguments: args,
      cwd: projectRoot,
      throwOnFailure: false,
    }),
  };
}

function buildAnalyzeArguments(options: AnalyzeExecutorSchema) {
  const command = ['analyze'];

  if (options.fatalInfos) {
    command.push('--fatal-infos');
  }

  if (!options.fatalWarnings) {
    command.push('--no-fatal-warnings');
  }

  return command;
}
