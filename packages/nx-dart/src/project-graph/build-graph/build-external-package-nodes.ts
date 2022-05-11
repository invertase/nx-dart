import {
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
} from '@nrwl/devkit';
import { DartPackageNodeResolver } from '../dart-package-node-resolver';

export function buildExternalPackageNodes(
  packageNodeResolver: DartPackageNodeResolver,
  builder: ProjectGraphBuilder,
  context: ProjectGraphProcessorContext
) {
  for (const source of Object.keys(context.filesToProcess)) {
    const nodes = packageNodeResolver.resolveExternalDependencyNodes(source);
    for (const node of nodes) {
      if (
        !builder.graph.externalNodes ||
        !builder.graph.externalNodes[node.name]
      ) {
        builder.addExternalNode(node);
      }
    }
  }
}
