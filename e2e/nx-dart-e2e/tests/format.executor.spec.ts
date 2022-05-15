import {
  ensureNxProject,
  readFile,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { addProjectToWorkspace, runNxCommandAsync } from './utils';

describe('format executor', () => {
  beforeAll(() => ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  afterAll(() => runNxCommandAsync('reset'));

  it('should format code in project', async () => {
    const project = uniq('a_');
    const projectPath = addProjectToWorkspace(project, {
      project: {
        targets: {
          format: {
            executor: '@nx-dart/nx-dart:format',
            outputs: [],
          },
        },
      },
    });
    const dartFile = `${projectPath}/a.dart`;
    updateFile(dartFile, ' const a = 1;');

    // Check formatting with incorrectly formatted file.
    await expect(
      runNxCommandAsync(`run ${project}:format --check`)
    ).rejects.toThrowError();
    let result = await runNxCommandAsync(`run ${project}:format --check`, {
      silenceError: true,
    });
    expect(result.stdout).toContain('Changed a.dart');
    expect(readFile(dartFile)).toBe(' const a = 1;');

    // Format Dart file.
    result = await runNxCommandAsync(`run ${project}:format`);
    expect(result.stdout).toContain('Formatted a.dart');
    expect(readFile(dartFile)).toBe('const a = 1;\n');

    // Check file after formatting.
    result = await runNxCommandAsync(`run ${project}:format --check`);
    expect(result.stdout).toContain('Unchanged a.dart');

    // Format file again, when it is correctly formatted.
    result = await runNxCommandAsync(`run ${project}:format`);
    expect(result.stdout).toContain('Unchanged a.dart');
  }, 120000);
});
