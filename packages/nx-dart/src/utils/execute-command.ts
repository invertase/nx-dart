import { execFileSync } from 'child_process';
import { platform } from 'os';

export interface ExecutableCommand {
  executable: string;
  arguments?: string[];
  cwd?: string;
  expectedErrorExitCodes?: number[];
  silent?: boolean;
}

export function executeCommand(command: ExecutableCommand): boolean {
  const defaultErrorCodes = [1];
  const expectedErrorExitCodes =
    command.expectedErrorExitCodes ?? defaultErrorCodes;

  try {
    execFileSync(command.executable, command.arguments, {
      stdio: command.silent ? 'ignore' : 'inherit',
      cwd: command.cwd,
      // Ensures that we can use executable names without extensions like .bat on Windows.
      shell: platform() === 'win32',
    });
    return true;
  } catch (e) {
    if (!expectedErrorExitCodes.includes(e.status)) {
      throw e;
    }
    return false;
  }
}
