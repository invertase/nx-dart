import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import generator from './generator';

describe('add-package generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should add project for package', async () => {
    appTree.write('test/pubspec.yaml', 'name: test');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
    expect(config.projectType).toBe('application');
  });

  it('should add format target for package', async () => {
    appTree.write('test/pubspec.yaml', 'name: test');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    const config = readProjectConfiguration(appTree, 'test');
    expect(config.targets.format).toEqual({
      executor: '@nx-dart/nx-dart:format',
      outputs: [],
    });
  });

  it('should add analyze target for package', async () => {
    appTree.write('test/pubspec.yaml', 'name: test');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    const config = readProjectConfiguration(appTree, 'test');
    expect(config.targets.analyze).toEqual({
      executor: '@nx-dart/nx-dart:analyze',
      outputs: [],
    });
  });

  it('should add test target for package with test dir', async () => {
    appTree.write('test/pubspec.yaml', 'name: test');
    appTree.write('test/test/a_test.dart', '');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    const config = readProjectConfiguration(appTree, 'test');
    expect(config.targets.test).toEqual({
      executor: '@nx-dart/nx-dart:test',
      outputs: ['test/coverage'],
    });
  });

  it('should add e2e target for package with integration_test dir', async () => {
    appTree.write('test/pubspec.yaml', 'name: test');
    appTree.write('test/integration_test/a_test.dart', '');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    const config = readProjectConfiguration(appTree, 'test');
    expect(config.targets.e2e).toEqual({
      executor: '@nx-dart/nx-dart:test',
      outputs: ['test/coverage'],
      options: {
        targets: ['integration_test'],
      },
    });
  });

  it('should remove analysis_options.yaml if workspace has one', async () => {
    appTree.write('analysis_options.yaml', '');
    appTree.write('test/pubspec.yaml', 'name: test');
    appTree.write('test/analysis_options.yaml', '');
    await generator(appTree, {
      directory: 'test',
      projectType: 'application',
    });
    expect(appTree.exists('test/analysis_options.yaml')).toBe(false);
  });
});
