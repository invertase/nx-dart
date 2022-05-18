import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { nxDartPackageJson } from '../../utils/misc';
import { expectNxJsonHasPlugin } from '../testing/asserts';
import { LintRules } from './analysis-options';
import { setupWorkspaceForNxDart } from './setup-workspace';

describe('workspace setup generation', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should add Dart/Flutter specific ignore rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    const gitignore = appTree.read('.gitignore', 'utf-8');
    expect(gitignore).toContain('.dart_tool/');
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

  it('should add runtime cache input to default runner', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    const nxJson = readJson(appTree, 'nx.json');
    expect(
      nxJson.tasksRunnerOptions.default.options.runtimeCacheInputs
    ).toContain('flutter --version || dart --version');
  });

  it('should add analyze and format as cacheable operations', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    const nxJson = readJson(appTree, 'nx.json');
    const cacheableOperations =
      nxJson.tasksRunnerOptions.default.options.cacheableOperations;
    expect(cacheableOperations).toContain('format');
    expect(cacheableOperations).toContain('analyze');
  });

  it('should make pubspec.yaml and analysis_options.yaml a universal implicit dependency', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    const nxJson = readJson(appTree, 'nx.json');
    expect(nxJson.implicitDependencies['pubspec.yaml']).toBe('*');
    expect(nxJson.implicitDependencies['analysis_options.yaml']).toBe('*');
  });

  it('should add pubspec.yaml', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    const pubspec = appTree.read('pubspec.yaml', 'utf8');
    expect(pubspec).toContain(`name: workspace`);
  });

  it('should add analysis_options.yaml with strict type checks', async () => {
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

  it('should setup lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });
    const analysisOptions = appTree.read('analysis_options.yaml', 'utf8');
    expect(analysisOptions).toContain('include: package:lints/core.yaml');
  });
});
