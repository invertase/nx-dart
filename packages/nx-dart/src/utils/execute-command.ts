import { execFile } from 'child_process';
import { platform } from 'os';

export interface ExecutableCommand {
  executable: string;
  arguments?: string[];
  cwd?: string;
  expectedErrorExitCodes?: number[];
  silent?: boolean;
}

export function executeCommand(command: ExecutableCommand): Promise<boolean> {
  const defaultErrorCodes = [1];
  const expectedErrorExitCodes =
    command.expectedErrorExitCodes ?? defaultErrorCodes;

  return new Promise((resolve, reject) => {
    const childProcess = execFile(command.executable, command.arguments, {
      cwd: command.cwd,
      // Ensures that we can use executable names without extensions like .bat on Windows.
      shell: platform() === 'win32',
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (exitCode) => {
      if (exitCode !== 0) {
        if (!expectedErrorExitCodes.includes(exitCode)) {
          reject(
            new Error(
              `Command '${[command.executable, ...command.arguments].join(
                ' '
              )}' exited with unexpected code: ${exitCode}`
            )
          );
        } else {
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });

    if (!command.silent) {
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
    }
  });
}
