import { Generator } from '@nrwl/devkit';
import { LintRules } from '../workspace/analysis-options';
import { setupWorkspaceForNxDart } from '../workspace/setup-workspace';
import { PresetGeneratorSchema } from './schema';

const presetGenerator: Generator<PresetGeneratorSchema> = (tree, options) =>
  setupWorkspaceForNxDart(tree, {
    lints: !options.lints ? undefined : LintRules.recommended,
  });

export default presetGenerator;
