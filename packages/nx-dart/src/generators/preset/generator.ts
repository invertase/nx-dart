import { Tree } from '@nrwl/devkit';
import { setupWorkspaceForNxDart } from '../common/setup-workspace';
import { PresetGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: PresetGeneratorSchema,
  { installDependencies }: { installDependencies?: boolean } = {}
) {
  await setupWorkspaceForNxDart(tree, {
    installDependencies: installDependencies ?? true,
    overwrite: true,
    lints: options.lints,
  });
}
