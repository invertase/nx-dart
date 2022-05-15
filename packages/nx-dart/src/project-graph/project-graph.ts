import {
  ProjectFileMap,
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
} from '@nrwl/devkit';
import { buildExplicitDartDependencies } from './build-graph/build-explicit-dart-dependencies';
import { buildExplicitPubspecDependencies } from './build-graph/build-explicit-pubspec-dependencies';
import { buildExternalPackageNodes } from './build-graph/build-external-package-nodes';
import { ExplicityDependency } from './build-graph/explicity-dependency';
import { DartPackageNodeResolver } from './dart-package-node-resolver';

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
): Promise<ProjectGraph> {
  const packageNodeResolver = new DartPackageNodeResolver(graph.nodes);
  const builder = new ProjectGraphBuilder(graph);

  buildExternalPackageNodes(packageNodeResolver, builder, context);
  buildExplicitDependencies(packageNodeResolver, builder, context);

  return builder.getUpdatedProjectGraph();
}

function buildExplicitDependencies(
  packageNodeResolver: DartPackageNodeResolver,
  builder: ProjectGraphBuilder,
  context: ProjectGraphProcessorContext
) {
  buildExplicitDartAndPubspecDependencies(
    packageNodeResolver,
    builder.graph,
    context.filesToProcess
  ).forEach((dependency) => {
    builder.addExplicitDependency(
      dependency.sourceNodeName,
      dependency.sourceFilePath,
      dependency.targetNodeName
    );
  });
}

function buildExplicitDartAndPubspecDependencies(
  packageNodeResolver: DartPackageNodeResolver,
  graph: ProjectGraph,
  filesToProcess: ProjectFileMap
): ExplicityDependency[] {
  return [
    ...buildExplicitDartDependencies(filesToProcess, packageNodeResolver),
    ...buildExplicitPubspecDependencies(
      graph,
      filesToProcess,
      packageNodeResolver
    ),
  ];
}
