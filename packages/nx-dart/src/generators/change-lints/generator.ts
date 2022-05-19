import { formatFiles, Tree } from '@nrwl/devkit';
import {
  ensureWorkspaceAnalysisOptions,
  excludeNodeModulesFromAnalysisOptions,
  updateLintRulesInAnalysisOptions,
} from '../workspace/analysis-options';
import { ensureWorkspacePubspec } from '../workspace/setup-workspace';
import { ChangeLintsGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: ChangeLintsGeneratorSchema
) {
  ensureWorkspacePubspec(tree);
  ensureWorkspaceAnalysisOptions(tree);
  excludeNodeModulesFromAnalysisOptions(tree);
  const task = await updateLintRulesInAnalysisOptions(tree, options.lints);
  await formatFiles(tree);
  return task;
}
