import { workspaceRoot } from '@nrwl/devkit';
import {
  checkFilesExist,
  ensureNxProject,
  fileExists,
  readFile,
  readJson,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import * as path from 'path';
import {
  addPluginToNxJson,
  addProjectToWorkspace,
  readPubspec,
  runNxCommandAsync,
  writeAnalysisOptions,
  writePubspec,
} from './utils';

describe('nx-dart', () => {
  beforeAll(() => {
    ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart');
    addPluginToNxJson('@nx-dart/nx-dart');
  });

  afterAll(() => runNxCommandAsync('reset'));

  describe('project graph', () => {
    it('adds dependency for package in same workspace', async () => {
      const projectA = uniq('graph_a_');
      const projectARoot = `libs/${projectA}`;
      const projectB = uniq('graph_b_');
      const projectBRoot = `libs/${projectB}`;
      writePubspec(projectARoot, {
        name: projectA,
      });
      writePubspec(projectBRoot, {
        name: projectB,
        dependencies: {
          [projectA]: 'any',
        },
      });
      addProjectToWorkspace(projectA);
      addProjectToWorkspace(projectB);

      await runNxCommandAsync('graph --file graph.json');
      const graph = await readJson('graph.json');
      expect(graph.graph.dependencies[projectB]).toEqual([
        {
          source: projectB,
          target: projectA,
          type: 'static',
        },
      ]);
    }, 120000);
  });

  describe('format executor', () => {
    it('should format code in project', async () => {
      const project = uniq('format_');
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

  describe('analyze executor', () => {
    it('should analyze Dart package in project', async () => {
      const project = uniq('analyze_');
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
      writePubspec(projectPath, { name: project });
      // analysis_options.yaml
      writeAnalysisOptions(projectPath, {
        linter: {
          rules: ['avoid_print'],
        },
      });
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

  describe('test executor', () => {
    it('should signal success and failure', async () => {
      const project = uniq('test_result_');
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
      writePubspec(projectPath, {
        name: project,
        dev_dependencies: { test: 'any' },
      });
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
      expect(result.stdout).toContain(
        `${path.normalize('test/a_test.dart')}: a`
      );
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
      expect(result.stdout).toContain(
        `${path.normalize('test/a_test.dart')}: a`
      );
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
      writePubspec(projectPath, {
        name: project,
        dev_dependencies: { test: 'any' },
      });
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

  describe('add-package', () => {
    it('should add package to workspace', async () => {
      const project = uniq('add_package_');
      const projectRoot = `libs/${project}`;
      writePubspec(projectRoot, {
        name: project,
      });
      await runNxCommandAsync(`g @nx-dart/nx-dart:add-package ${projectRoot}`);
      checkFilesExist(`${projectRoot}/project.json`);
    }, 12000);

    it('should migrate to workspace wide analysis_options.yaml', async () => {
      const project = uniq('add_package_');
      const projectRoot = `libs/${project}`;
      writeAnalysisOptions('.', {
        include: 'package:flutter_lints/flutter.yaml',
      });
      writeAnalysisOptions(projectRoot, {
        include: 'package:lints/core.yaml',
      });
      writePubspec(projectRoot, {
        name: project,
        dev_dependencies: {
          lints: 'any',
        },
      });
      await runNxCommandAsync(`g @nx-dart/nx-dart:add-package ${projectRoot}`);
      expect(
        fileExists(
          path.join(workspaceRoot, projectRoot, 'analysis_options.yaml')
        )
      ).toBe(false);
      const pubspec = readPubspec(projectRoot);
      expect(pubspec.dev_dependencies?.lints).toBeUndefined();
    }, 12000);
  });
});
