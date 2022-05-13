import { Tree } from '@nrwl/devkit';
import { setupWorkspaceForNxDart } from '../common/setup-workspace';

export default async function (tree: Tree) {
  await setupWorkspaceForNxDart(tree, {
    installDependencies: true,
    overwrite: true,
  });
}
