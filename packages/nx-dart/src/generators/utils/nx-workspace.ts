import { Tree, updateJson } from '@nrwl/devkit';

export function addNxPlugin(tree: Tree, pluginName: string) {
  updateJson(tree, 'nx.json', (nxJson) => {
    const plugins = [...(nxJson.plugins || [])];
    if (!plugins.includes(pluginName)) {
      plugins.push(pluginName);
    }

    return {
      ...nxJson,
      plugins: plugins,
    };
  });
}

export function setDefaultCollection(
  tree: Tree,
  pluginName: string,
  overwrite = false
) {
  updateJson(tree, 'nx.json', (nxJson) => {
    let defaultCollection = nxJson.cli?.defaultCollection;
    if (!defaultCollection || overwrite) {
      defaultCollection = pluginName;
    }

    return {
      ...nxJson,
      cli: {
        ...(nxJson.cli ?? {}),
        defaultCollection: defaultCollection,
      },
    };
  });
}

export function addFileToImplicitDependencies(
  tree: Tree,
  file: string,
  overwrite = false
) {
  updateJson(tree, 'nx.json', (nxJson) => {
    const implicitDependencies = {
      ...(nxJson.implicitDependencies ?? {}),
    };

    if (!(file in implicitDependencies) || overwrite) {
      implicitDependencies[file] = '*';
    }

    return {
      ...nxJson,
      implicitDependencies: implicitDependencies,
    };
  });
}

export function addRuntimeCacheInput(tree: Tree, input: string) {
  updateJson(tree, 'nx.json', (nxJson) => {
    const taskRunnerName = 'default';
    const taskRunnerOptions = nxJson.taskRunnerOptions ?? {};
    const taskRunner = taskRunnerOptions[taskRunnerName];
    if (!taskRunner) {
      return nxJson;
    }

    const options = taskRunner.options ?? {};
    const runtimeCacheInputs = options.runtimeCacheInputs ?? [];
    if (runtimeCacheInputs.includes(input)) {
      return nxJson;
    }
    return {
      ...nxJson,
      taskRunnerOptions: {
        ...taskRunnerOptions,
        [taskRunnerName]: {
          ...taskRunner,
          options: {
            ...options,
            runtimeCacheInputs: [...runtimeCacheInputs, input],
          },
        },
      },
    };
  });
}
