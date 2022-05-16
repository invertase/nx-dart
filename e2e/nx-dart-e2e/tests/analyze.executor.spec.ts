import { ensureNxProject, uniq, updateFile } from '@nrwl/nx-plugin/testing';
import * as path from 'path';
import { addProjectToWorkspace, runNxCommandAsync } from './utils';

describe('analyze executor', () => {
  beforeAll(() => ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  afterAll(() => runNxCommandAsync('reset'));

  it('should analyze Dart package in project', async () => {
    const project = uniq('a_');
    const projectPath = addProjectToWorkspace(project, {
      project: {
        targets: {
          analyze: {
            executor: '@nx-dart/nx-dart:analyze',
            outputs: [],
          },
        },
      },
    });
    // pubspec.yaml
    updateFile(
      `${projectPath}/pubspec.yaml`,
      `
name: ${project}
environment:
  sdk: '>=2.17.0 <3.0.0'
`
    );
    // analysis_options.yaml
    updateFile(
      `${projectPath}/analysis_options.yaml`,
      `
linter:
  rules:
    - avoid_print
`
    );
    // lib/a.dart
    const dartFile = `${projectPath}/lib/a.dart`;
    updateFile(dartFile, `void main() { print(''); }`);

    // Analyze package with lint error.
    await expect(
      runNxCommandAsync(`run ${project}:analyze`)
    ).rejects.toThrowError();
    let result = await runNxCommandAsync(`run ${project}:analyze`, {
      silenceError: true,
    });
    expect(result.stdout).toContain(`Analyzing ${project}`);
    expect(result.stdout).toContain(
      `info - ${path.normalize(
        'lib/a.dart'
      )}:1:15 - Avoid \`print\` calls in production code. - avoid_print`
    );

    updateFile(dartFile, `void main() {}`);

    // Analyze package without lint error.
    result = await runNxCommandAsync(`run ${project}:analyze`);
    expect(result.stdout).toContain('No issues found!');
  }, 120000);
});
