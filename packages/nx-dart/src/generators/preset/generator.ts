import { Tree } from '@nrwl/devkit';
import { setupWorkspaceForNxDart } from '../common/setup-workspace';

export default async function (
  tree: Tree,
  schemaOptions: unknown,
  { installDependencies }: { installDependencies?: boolean } = {}
) {
  await setupWorkspaceForNxDart(tree, {
    installDependencies: installDependencies ?? true,
    overwrite: true,
  });
}
