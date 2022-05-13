import { readJsonFile } from '@nrwl/devkit';
import * as path from 'path';

export function nxDartPackageJson() {
  return readJsonFile(path.join(__dirname, '../../package.json'));
}
