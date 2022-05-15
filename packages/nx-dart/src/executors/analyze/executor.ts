import { ExecutorContext } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { AnalyzeExecutorSchema } from './schema';

export default async function runExecutor(
  options: AnalyzeExecutorSchema,
  context: ExecutorContext
) {
  const command = buildAnalyzeCommand(options);

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: context.workspace.projects[context.projectName].root,
    });

    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}

function buildAnalyzeCommand(options: AnalyzeExecutorSchema) {
  const command = ['dart', 'analyze'];

  if (options.fatalInfos) {
    command.push('--fatal-infos');
  }

  if (!options.fatalWarnings) {
    command.push('--no-fatal-warnings');
  }

  return command.join(' ');
}
