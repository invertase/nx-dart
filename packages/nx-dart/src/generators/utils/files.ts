import { Tree } from '@nrwl/devkit';
import * as YAML from 'yaml';

export function readYaml(tree: Tree, path: string) {
  return YAML.parse(tree.read(path, 'utf-8'));
}
