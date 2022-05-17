import { Generator } from '@nrwl/devkit';
import { setupWorkspaceForNxDart } from '../workspace/setup-workspace';
import { LintRules } from '../workspace/analysis-options';
import { PresetGeneratorSchema } from './schema';

const presetGenerator: Generator<PresetGeneratorSchema> = (tree) =>
  setupWorkspaceForNxDart(tree, {
    overwrite: true,
    lints: LintRules.recommended,
  });

export default presetGenerator;
