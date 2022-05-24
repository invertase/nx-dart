import { execFile } from 'child_process';
import { platform } from 'os';

export interface ExecutableCommand {
  executable: string;
  arguments?: string[];
  cwd?: string;
  throwOnFailure?: boolean;
  expectedErrorExitCodes?: number[];
  silent?: boolean;
}

export function executeCommand(command: ExecutableCommand): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const childProcess = execFile(command.executable, command.arguments, {
      cwd: command.cwd,
      // Ensures that we can use executable names without extensions like .bat on Windows.
      shell: platform() === 'win32',
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (exitCode) => {
      if (exitCode !== 0) {
        let isExpectedExitCode = false;
        if (!command.throwOnFailure) {
          const expectedErrorExitCodes = command.expectedErrorExitCodes ?? [];
          if (expectedErrorExitCodes) {
            isExpectedExitCode = expectedErrorExitCodes.includes(exitCode);
          } else {
            isExpectedExitCode = true;
          }
        }

        if (isExpectedExitCode) {
          resolve(false);
        } else {
          reject(
            new Error(
              `Command '${[command.executable, ...command.arguments].join(
                ' '
              )}' exited with unexpected code: ${exitCode}`
            )
          );
        }
      } else {
        resolve(true);
      }
    });

    if (!command.silent) {
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
    } else {
      // We need to consume the output to prevent the child process from blocking.
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      childProcess.stdout.on('data', () => {});
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      childProcess.stderr.on('data', () => {});
    }
  });
}
