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

export function addRuntimeCacheInput(
  tree: Tree,
  taskRunnerName: string,
  input: string
) {
  updateJson(tree, 'nx.json', (nxJson) => {
    const tasksRunnerOptions = nxJson.tasksRunnerOptions ?? {};
    const taskRunner = tasksRunnerOptions[taskRunnerName];
    if (!taskRunner) {
      throw new Error(
        `Could not find task runner ${taskRunnerName} in nx.json.`
      );
    }
    const options = taskRunner.options ?? {};
    const runtimeCacheInputs = options.runtimeCacheInputs ?? [];
    if (runtimeCacheInputs.includes(input)) {
      return nxJson;
    }
    return {
      ...nxJson,
      tasksRunnerOptions: {
        ...tasksRunnerOptions,
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
