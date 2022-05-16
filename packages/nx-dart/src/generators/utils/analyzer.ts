import { Tree } from '@nrwl/devkit';
import * as YAML from 'yaml';
import { AnalysisOptions } from '../../utils/analyzer';

export function readAnalysisOptions(
  tree: Tree,
  directory: string
): AnalysisOptions | undefined {
  if (tree.exists(`${directory}/analysis_options.yaml`)) {
    return (
      YAML.parse(tree.read(`${directory}/analysis_options.yaml`, 'utf-8')) ?? {}
    );
  }
}
