import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { nxDartPackageJson } from '../../utils/misc';
import { expectNxJsonHasPlugin } from '../testing/asserts';
import { LintRules, setupWorkspaceForNxDart } from './setup-workspace';

describe('setup workspace', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should add plugin to package.json', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    const packageJson = readJson(appTree, 'package.json');
    expect(packageJson.devDependencies['@nx-dart/nx-dart']).toEqual(
      nxDartPackageJson().version
    );
  });

  it('should add plugin to nx.json', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    expectNxJsonHasPlugin(appTree);
  });

  it('should make plugin the default collection', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    const nxJson = readJson(appTree, 'nx.json');
    expect(nxJson.cli.defaultCollection).toBe('@nx-dart/nx-dart');
  });

  describe('lints', () => {
    it('it should make analysis_options.yaml a universal implicit dependency', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

      const nxJson = readJson(appTree, 'nx.json');
      expect(nxJson.implicitDependencies['analysis_options.yaml']).toBe('*');
    });

    it('it should enable strict type checks', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

      const analysisOptions = appTree.read('analysis_options.yaml', 'utf8');

      const strictRules = [
        'strict-casts',
        'strict-inference',
        'strict-raw-types',
      ];
      for (const rule of strictRules) {
        expect(analysisOptions).toContain(`${rule}: true`);
      }
    });

    it('it should support core lint rules', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:lints/core.yaml'
      );
    });

    it('it should support recommended lint rules', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.recommended });

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:lints/recommended.yaml'
      );
    });

    it('it should support flutter lint rules', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.flutter });

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:flutter_lints/flutter.yaml'
      );
    });

    it('it should support all lint rules', async () => {
      await setupWorkspaceForNxDart(appTree, { lints: LintRules.all });

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'linter:\n  rules:\n    -'
      );
    });
  });
});
