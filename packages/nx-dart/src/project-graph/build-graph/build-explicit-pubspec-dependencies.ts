import { normalizePath, ProjectFileMap, ProjectGraph } from '@nrwl/devkit';
import * as pub from '../../utils/pub';
import { DartPackageNodeResolver } from '../dart-package-node-resolver';
import { ExplicityDependency } from './explicity-dependency';

export function buildExplicitPubspecDependencies(
  graph: ProjectGraph<unknown>,
  filesToProcess: ProjectFileMap,
  packageNodeResolver: DartPackageNodeResolver
): ExplicityDependency[] {
  const result: ExplicityDependency[] = [];

  for (const [source, files] of Object.entries(filesToProcess)) {
    const root = graph.nodes[source].data.root;
    const pubspecPath = normalizePath(pub.pubspecPath(root));

    for (const file of files) {
      if (file.file !== pubspecPath) {
        continue;
      }

      const pubspec = pub.loadPubspec(root);

      const allDependencies: string[] = [];
      const dependencies = pubspec.dependencies;
      if (dependencies) {
        allDependencies.push(...Object.keys(dependencies));
      }
      const devDependencies = pubspec.dev_dependencies;
      if (devDependencies) {
        allDependencies.push(...Object.keys(devDependencies));
      }

      for (const dependency of allDependencies) {
        const targetNode = packageNodeResolver.resolveDependencyNodeName(
          source,
          dependency
        );
        if (targetNode) {
          result.push({
            sourceNodeName: source,
            sourceFilePath: file.file,
            targetNodeName: targetNode,
          });
        }
      }
    }
  }

  return result;
}
