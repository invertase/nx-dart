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
import {
  DartPackageNodeResolver,
  PackageResolutionMode,
} from './dart-package-node-resolver';

// It's not clear yet what resolution mode is best and whether it should be configurable.
const resolutionMode = PackageResolutionMode.Declared;

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
): Promise<ProjectGraph> {
  const packageNodeResolver = new DartPackageNodeResolver(
    resolutionMode,
    graph.nodes
  );
  const builder = new ProjectGraphBuilder(graph);

  buildExternalPackageNodes(packageNodeResolver, builder, context);
  buildExplicitDependencies(
    packageNodeResolver,
    builder,
    context,
    resolutionMode
  );

  return builder.getUpdatedProjectGraph();
}

function buildExplicitDependencies(
  packageNodeResolver: DartPackageNodeResolver,
  builder: ProjectGraphBuilder,
  context: ProjectGraphProcessorContext,
  resolutionMode: PackageResolutionMode
) {
  buildExplicitDartAndPubspecDependencies(
    packageNodeResolver,
    builder.graph,
    context.filesToProcess
  ).forEach((dependency) => {
    switch (resolutionMode) {
      case PackageResolutionMode.Declared:
        builder.addExplicitDependency(
          dependency.sourceNodeName,
          dependency.sourceFilePath,
          dependency.targetNodeName
        );
        break;
      case PackageResolutionMode.Resolved:
        // The dependencies must be implicit because the source of the resolved dependencies is not
        // under source control and therefore changes do not trigger a recalculation of the project
        // graph.
        builder.addImplicitDependency(
          dependency.sourceNodeName,
          dependency.targetNodeName
        );
        break;
    }
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
