import { workspaceRoot } from '@nrwl/devkit';
import {
  checkFilesExist,
  ensureNxProject,
  fileExists,
  newNxProject,
  readFile,
  readJson,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import * as path from 'path';
import { runNxCommandAsync } from './utils';

describe('preset generator', () => {
  beforeAll(() => ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  afterAll(() => runNxCommandAsync('reset'));

  describe('preset', () => {
    beforeEach(() => newNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

    it('smoke test', async () => {
      await runNxCommandAsync('generate @nx-dart/nx-dart:preset --lints core');
      const nxJson = readJson('nx.json');
      expect(nxJson.cli?.defaultCollection).toBe('@nx-dart/nx-dart');
      expect(nxJson.plugins).toContain('@nx-dart/nx-dart');
    }, 120000);
  });

  describe('add-package', () => {
    it('should add package to workspace', async () => {
      const project = uniq('add_package_');
      updateFile(
        `libs/${project}/pubspec.yaml`,
        `
name: ${project}
environment:
  sdk: '>=2.17.0 <3.0.0'
      `
      );
      await runNxCommandAsync(
        `g @nx-dart/nx-dart:add-package libs/${project} --project-type library`
      );
      checkFilesExist(`libs/${project}/project.json`);
    }, 12000);

    it('should migrate analysis_options.yaml', async () => {
      const project = uniq('add_package_');
      const projectRoot = `libs/${project}`;
      updateFile(
        'analysis_options.yaml',
        'include: package:flutter_lints/flutter.yaml'
      );
      updateFile(
        `${projectRoot}/analysis_options.yaml`,
        'include: package:lint/core.yaml'
      );
      updateFile(
        `${projectRoot}/pubspec.yaml`,
        `
name: ${project}
environment:
  sdk: '>=2.17.0 <3.0.0'
dev_dependencies:
  lint: any
      `
      );
      await runNxCommandAsync(
        `g @nx-dart/nx-dart:add-package ${projectRoot} --project-type library`
      );
      expect(
        fileExists(
          path.join(workspaceRoot, projectRoot, 'analysis_options.yaml')
        )
      ).toBe(false);
      const pubspecYaml = readFile(`${projectRoot}/pubspec.yaml`);
      expect(pubspecYaml).not.toContain('lint: any');
      expect(pubspecYaml).toContain('flutter_lints');
    }, 12000);
  });
});
