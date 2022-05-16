import { execFileSync } from 'child_process';

export interface ExecutableCommand {
  executable: string;
  arguments?: string[];
  cwd?: string;
  expectedErrorExitCodes?: number[];
}

export function executeCommand(command: ExecutableCommand): boolean {
  const defaultErrorCodes = [1];
  const expectedErrorExitCodes =
    command.expectedErrorExitCodes ?? defaultErrorCodes;

  try {
    execFileSync(command.executable, command.arguments, {
      stdio: 'inherit',
      cwd: command.cwd,
    });
    return true;
  } catch (e) {
    if (!expectedErrorExitCodes.includes(e.status)) {
      throw e;
    }
    return false;
  }
}
