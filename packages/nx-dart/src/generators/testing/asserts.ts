import { readJson, Tree } from '@nrwl/devkit';

export function expectNxJsonHasPlugin(tree: Tree) {
  const nxJson = readJson(tree, 'nx.json');
  expect(nxJson.plugins).toContain('@nx-dart/nx-dart');
}
