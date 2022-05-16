import {
  FileData,
  normalizePath,
  ProjectGraphExternalNode,
  ProjectGraphProjectNode,
} from '@nrwl/devkit';
import * as crypto from 'crypto';
import * as pub from '../utils/pub';

export class DartPackageNodeResolver {
  constructor(
    private readonly nodes: Record<string, ProjectGraphProjectNode<unknown>>
  ) {
    this.loadDartPackageProjects();

    for (const packageName of Object.keys(this.packageToProject)) {
      this.buildDependencyNodes(packageName);
    }
  }

  /**
   * For each package, its project name.
   */
  private packageToProject: Record<string, string> = {};

  /**
   * For each project name that is a Dart package, the package name.
   */
  private projectToPackage: Record<string, string> = {};

  /**
   * For ech package, its parsed pubspec.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pubspecs: Record<string, pub.Pubspec> = {};

  /**
   * For each package, a map from packages they depend on, to the name of the corresponding graph
   * node.
   */
  private dependencyToNode: Record<string, Record<string, string>> = {};

  /**
   * For each package, the list of nodes of external dependencies.
   */
  private externalDependencyNodes: Record<string, ProjectGraphExternalNode[]> =
    {};

  resolveExternalDependencyNodes(
    sourceProject: string
  ): ProjectGraphExternalNode[] {
    // Find the package for the source project.
    const pkg = this.projectToPackage[sourceProject];
    if (!pkg) {
      // The project is not a Dart package.
      return [];
    }

    return this.externalDependencyNodes[pkg];
  }

  resolveDependencyNodeName(
    sourceProject: string,
    targetPackage: string
  ): string | undefined {
    return this.dependencyToNode[sourceProject]?.[targetPackage];
  }

  private loadDartPackageProjects() {
    for (const [project, node] of Object.entries(this.nodes)) {
      const pubspecPath = normalizePath(pub.pubspecPath(node.data.root));
      const hasPubspec = node.data.files.some(
        (file: FileData) => file.file === pubspecPath
      );
      if (hasPubspec) {
        const pubspec = pub.loadPubspec(node.data.root);
        const packageName = pubspec.name;
        if (packageName) {
          this.packageToProject[packageName] = project;
          this.projectToPackage[project] = packageName;
          this.pubspecs[packageName] = pubspec;
          this.dependencyToNode[packageName] = {};
          this.externalDependencyNodes[packageName] = [];
        }
      }
    }
  }

  private buildDependencyNodes(packageName: string) {
    const pubspec = this.pubspecs[packageName];
    const dependencies = pubspec.dependencies ?? {};
    const devDependencies = pubspec.dev_dependencies ?? {};
    const allDependencies = {
      ...dependencies,
      ...devDependencies,
    };

    for (const dependency of Object.keys(allDependencies)) {
      const project = this.packageToProject[dependency];
      if (project) {
        // For dependencies on packages in the workspace, we use the corresponding project.
        this.addProjectDependency(packageName, dependency, project);
        continue;
      } else {
        // For dependencies on external packages, we create an external node.
        const spec = allDependencies[dependency];
        const specJson = JSON.stringify(spec);
        this.addExternalDependency(packageName, dependency, specJson);
      }
    }
  }

  private addProjectDependency(
    packageName: string,
    dependency: string,
    project: string
  ) {
    this.dependencyToNode[packageName][dependency] = project;
  }

  private addExternalDependency(
    packageName: string,
    dependency: string,
    dependencySpecString: string
  ) {
    const dependencyNodes: Record<string, string> =
      this.dependencyToNode[packageName];
    const externalNodes: ProjectGraphExternalNode[] =
      this.externalDependencyNodes[packageName];

    const specHash = crypto
      .createHash('sha256')
      .update(dependencySpecString)
      .digest('hex');

    const externalNode: ProjectGraphExternalNode = {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      type: 'pub' as any,
      name: `pub:${dependency}:${specHash}` as any,
      /* eslint-enable */
      data: {
        packageName: dependency,
        // TODO: Provide actual version number, if available.
        version: specHash,
      },
    };

    dependencyNodes[dependency] = externalNode.name;
    externalNodes.push(externalNode);
  }
}
