import { ProjectFileMap } from '@nrwl/devkit';
import {
  importsForFile,
  isDartFile,
  packageNameFromUri,
} from '../../utils/dart-source';
import { DartPackageNodeResolver } from '../dart-package-node-resolver';
import { ExplicityDependency } from './explicity-dependency';

export function buildExplicitDartDependencies(
  filesToProcess: ProjectFileMap,
  packageNodeResolver: DartPackageNodeResolver
): ExplicityDependency[] {
  const result: ExplicityDependency[] = [];
  for (const [source, files] of Object.entries(filesToProcess)) {
    for (const file of files) {
      if (isDartFile(file.file)) {
        for (const importUri of importsForFile(file.file)) {
          const packageName = packageNameFromUri(importUri);
          if (packageName) {
            const target = packageNodeResolver.resolveDependencyNodeName(
              source,
              packageName
            );
            if (target) {
              result.push({
                sourceNodeName: source,
                sourceFilePath: file.file,
                targetNodeName: target,
              });
            }
          }
        }
      }
    }
  }
  return result;
}
