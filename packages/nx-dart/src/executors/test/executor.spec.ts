import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import { executeCommand } from '../../utils/execute-command';
import { readFile } from '../../utils/fs';
import executor from './executor';
import { TestExecutorSchema } from './schema';

jest.mock('../../utils/execute-command');
jest.mock('../../utils/fs');

const options: TestExecutorSchema = {};

describe('Test Executor', () => {
  it('should use dart for standalone Dart packages', async () => {
    mockDartPackage();
    mockExecuteCommandResult(true);
    const context = testContext({ projectName: 'a' });

    await executor(options, context);

    expect(executeCommand).toHaveBeenCalledWith({
      executable: 'dart',
      arguments: defaultTestArguments,
      cwd: 'libs/a',
    });
  });

  it('should use flutter for Flutter packages', async () => {
    mockFlutterPackage();
    mockExecuteCommandResult(true);
    const context = testContext({ projectName: 'a' });

    await executor(options, context);

    expect(executeCommand).toHaveBeenCalledWith({
      executable: 'flutter',
      arguments: defaultTestArguments,
      cwd: 'libs/a',
    });
  });

  it('should forward targets', async () => {
    mockDartPackage();
    mockExecuteCommandResult(true);
    const context = testContext({ projectName: 'a' });

    await executor({ ...options, targets: ['a', 'b'] }, context);

    expect(executeCommand).toHaveBeenCalledWith({
      executable: 'dart',
      arguments: [...defaultTestArguments, 'a', 'b'],
      cwd: 'libs/a',
    });
  });

  it('should forward additional options', async () => {
    mockDartPackage();
    mockExecuteCommandResult(true);
    const context = testContext({ projectName: 'a' });

    await executor({ concurrency: 1 }, context);

    expect(executeCommand).toHaveBeenCalledWith({
      executable: 'dart',
      arguments: [...defaultTestArguments, '--concurrency', '1'],
      cwd: 'libs/a',
    });
  });

  describe('coverage', () => {
    it('should convert to lcov in standalone Dart packages', async () => {
      mockDartPackage();
      mockExecuteCommandResult(true); // Run test
      mockExecuteCommandResult(true); // Activate coverage package
      mockExecuteCommandResult(true); // Convert coverage data to lcov
      const context = testContext({ projectName: 'a' });

      await executor({ coverage: true }, context);

      expect(executeCommand).toHaveBeenCalledWith({
        executable: 'dart',
        arguments: [
          ...defaultTestArguments,
          '--coverage',
          path.join('coverage', 'dart'),
        ],
        cwd: 'libs/a',
      });
      expect(executeCommand).toHaveBeenCalledWith({
        executable: 'dart',
        arguments: ['pub', 'global', 'activate', 'coverage'],
      });
      expect(executeCommand).toHaveBeenCalledWith({
        executable: 'dart',
        arguments: [
          'pub',
          'global',
          'run',
          'coverage:format_coverage',
          '--lcov',
          '--in',
          path.join('coverage', 'dart'),
          '--out',
          path.join('coverage', 'lcov.info'),
        ],
        cwd: 'libs/a',
      });
    });

    it('should pass coverage flags to flutter tool', async () => {
      mockFlutterPackage();
      mockExecuteCommandResult(true); // Run test
      const context = testContext({ projectName: 'a' });

      await executor({ coverage: true }, context);

      expect(executeCommand).toHaveBeenCalledWith({
        executable: 'flutter',
        arguments: [
          ...defaultTestArguments,
          '--coverage',
          '--coverage-path',
          path.join('coverage', 'lcov.info'),
        ],
        cwd: 'libs/a',
      });
    });
  });
});

const defaultTestArguments = ['test', '--reporter', 'expanded'];

function mockExecuteCommandResult(success: boolean) {
  (executeCommand as jest.Mock).mockReturnValueOnce(success);
}

function mockFlutterPackage() {
  (readFile as jest.Mock).mockReturnValueOnce(`
name: a
environment:
  flutter: any
`);
}

function mockDartPackage() {
  (readFile as jest.Mock).mockReturnValueOnce(`
name: a
environment:
  sdk: any
`);
}

function testContext({ projectName }: { projectName: string }) {
  return {
    projectName,
    workspace: {
      projects: {
        [projectName]: {
          root: `libs/${projectName}`,
        },
      },
    },
  } as unknown as ExecutorContext;
}
