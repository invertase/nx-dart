import { Tree } from '@nrwl/devkit';
import * as YAML from 'yaml';
import { Pubspec } from '../../utils/pub';

export function readPubspec(
  tree: Tree,
  packageRoot: string
): Pubspec | undefined {
  if (tree.exists(`${packageRoot}/pubspec.yaml`)) {
    return YAML.parse(tree.read(`${packageRoot}/pubspec.yaml`, 'utf-8'));
  }
}
