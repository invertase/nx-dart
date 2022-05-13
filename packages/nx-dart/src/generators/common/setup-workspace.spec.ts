import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { nxDartPackageJson } from '../../utils/misc';
import { expectNxJsonHasPlugin } from '../testing/asserts';
import { setupWorkspaceForNxDart } from './setup-workspace';

describe('setup workspace', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should add plugin to package.json', async () => {
    await setupWorkspaceForNxDart(appTree);

    const packageJson = readJson(appTree, 'package.json');
    expect(packageJson.devDependencies['@nx-dart/nx-dart']).toEqual(
      nxDartPackageJson().version
    );
  });

  it('should add plugin to nx.json', async () => {
    await setupWorkspaceForNxDart(appTree);
    expectNxJsonHasPlugin(appTree);
  });

  it('should make plugin the default collection', async () => {
    await setupWorkspaceForNxDart(appTree);
    const nxJson = readJson(appTree, 'nx.json');
    expect(nxJson.cli.defaultCollection).toBe('@nx-dart/nx-dart');
  });
});
