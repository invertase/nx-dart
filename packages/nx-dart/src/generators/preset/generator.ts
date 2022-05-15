import { Generator } from '@nrwl/devkit';
import { setupWorkspaceForNxDart } from '../common/setup-workspace';
import { PresetGeneratorSchema } from './schema';

const presetGenerator: Generator<PresetGeneratorSchema> = (tree, options) =>
  setupWorkspaceForNxDart(tree, {
    overwrite: true,
    lints: options.lints,
  });

export default presetGenerator;
