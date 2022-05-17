import { formatFiles, Tree } from '@nrwl/devkit';
import {
  ensureWorkspaceAnalysisOptions,
  updateWorkspaceAnalysisOptions,
} from '../workspace/analysis-options';
import { ensureWorkspacePubspec } from '../workspace/setup-workspace';
import { ChangeLintsGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: ChangeLintsGeneratorSchema
) {
  ensureWorkspacePubspec(tree);
  ensureWorkspaceAnalysisOptions(tree);
  const task = await updateWorkspaceAnalysisOptions(tree, options.lints);
  await formatFiles(tree);
  return task;
}
