import {
  checkFilesExist,
  ensureNxProject,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import * as path from 'path';
import { addProjectToWorkspace, runNxCommandAsync } from './utils';

describe('test executor', () => {
  beforeAll(() => ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  afterAll(() => runNxCommandAsync('reset'));

  it('should signal success and failure', async () => {
    const project = uniq('result_');
    const projectPath = addProjectToWorkspace(project, {
      project: {
        targets: {
          test: {
            executor: '@nx-dart/nx-dart:test',
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
dev_dependencies:
  test: any
`
    );
    // lib/a.dart
    const dartFile = `${projectPath}/test/a_test.dart`;
    updateFile(
      dartFile,
      `
import 'package:test/test.dart';

void main() {
  test('a', () {
    fail('');
  });
}
`
    );

    // Run tests with failure.
    await expect(
      runNxCommandAsync(`run ${project}:test`)
    ).rejects.toThrowError();
    let result = await runNxCommandAsync(`run ${project}:test`, {
      silenceError: true,
    });
    expect(result.stdout).toContain(`${path.normalize('test/a_test.dart')}: a`);
    expect(result.stdout).toContain('Some tests failed.');

    updateFile(
      dartFile,
      `
import 'package:test/test.dart';

void main() {
  test('a', () {});
}
`
    );

    // Run tests without failure.
    result = await runNxCommandAsync(`run ${project}:test`);
    expect(result.stdout).toContain(`${path.normalize('test/a_test.dart')}: a`);
    expect(result.stdout).toContain('All tests passed!');
  }, 120000);

  it('should convert coverage data to lcov', async () => {
    const project = uniq('coverage_');
    const projectPath = `libs/${project}`;
    addProjectToWorkspace(project, {
      path: projectPath,
      project: {
        targets: {
          test: {
            executor: '@nx-dart/nx-dart:test',
            outputs: [`${projectPath}/coverage`],
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
dev_dependencies:
  test: any
`
    );
    // lib/a.dart
    const dartFile = `${projectPath}/test/a_test.dart`;
    updateFile(
      dartFile,
      `
import 'package:test/test.dart';

void main() {
  test('a', () {});
}
`
    );

    // Run tests with coverage.
    await runNxCommandAsync(`run ${project}:test --coverage`);
    checkFilesExist(`${projectPath}/coverage/lcov.info`);
  }, 120000);
});
