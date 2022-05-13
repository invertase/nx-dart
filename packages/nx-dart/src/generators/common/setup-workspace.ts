import {
  addDependenciesToPackageJson,
  formatFiles,
  removeDependenciesFromPackageJson,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { nxDartPackageJson } from '../../utils/misc';

export async function setupWorkspaceForNxDart(
  tree: Tree,
  {
    installDependencies,
    overwrite,
  }: { installDependencies?: boolean; overwrite?: boolean } = {}
) {
  await addDependenciesToWorkspace(tree, {
    install: installDependencies ?? false,
  });
  updateNxJson(tree, { overwrite: overwrite ?? false });
  await formatFiles(tree);
}

async function addDependenciesToWorkspace(
  tree: Tree,
  {
    install
  }: {
    install: boolean
  }
) {
  // When a workspace is created with a preset, that preset will be added to the dependencies
  // but we want to add the plugin to the devDependencies. So we remove it from the dependencies
  // first.
  const uninstallCallback = removeDependenciesFromPackageJson(
    tree,
    ['@nx-dart/nx-dart'],
    []
  );
  if (install && uninstallCallback) {
    await uninstallCallback();
  }

  const installCallback = addDependenciesToPackageJson(
    tree,
    {},
    { '@nx-dart/nx-dart': nxDartPackageJson().version }
  );
  if (install && installCallback) {
    await installCallback();
  }
}

function updateNxJson(tree: Tree, { overwrite }: { overwrite: boolean }) {
  updateJson(tree, 'nx.json', (nxJson) => {
    const plugins = [...(nxJson.plugins || [])];
    if (!plugins.includes('@nx-dart/nx-dart')) {
      plugins.push('@nx-dart/nx-dart');
    }

    let defaultCollection = nxJson.cli?.defaultCollection;
    if (!defaultCollection || overwrite) {
      defaultCollection = '@nx-dart/nx-dart';
    }

    return {
      ...nxJson,
      cli: {
        ...(nxJson.cli ?? {}),
        defaultCollection: defaultCollection,
      },
      plugins: plugins,
    };
  });
}
