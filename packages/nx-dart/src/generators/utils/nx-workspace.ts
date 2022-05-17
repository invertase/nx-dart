import { NxJsonConfiguration, Tree, updateJson } from '@nrwl/devkit';

export function updateNxJson(
  tree: Tree,
  updater: (nxJson: NxJsonConfiguration) => NxJsonConfiguration
) {
  updateJson(tree, 'nx.json', (nxJson: NxJsonConfiguration) => updater(nxJson));
}
