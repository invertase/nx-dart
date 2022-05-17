import { Generator } from '@nrwl/devkit';
import { LintRules, setupWorkspaceForNxDart } from '../common/setup-workspace';
import { PresetGeneratorSchema } from './schema';

const presetGenerator: Generator<PresetGeneratorSchema> = (tree) =>
  setupWorkspaceForNxDart(tree, {
    overwrite: true,
    lints: LintRules.core,
  });

export default presetGenerator;
