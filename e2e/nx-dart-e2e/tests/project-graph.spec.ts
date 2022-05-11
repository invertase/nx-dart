import {
  ensureNxProject,
  readJson,
  runCommandAsync,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import * as YAML from 'yaml';

describe('Project graph', () => {
  beforeAll(() => {
    ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart');
    addPluginToNxJson('@nx-dart/nx-dart');
  });

  afterAll(() => runNxCommandAsync('reset'));

  it('adds dependency for package in same workspace', async () => {
    const projectA = uniq('a_');
    const projectB = uniq('b_');
    await runCommandAsync(`dart create -t package libs/${projectA}`);
    await runCommandAsync(`dart create -t package libs/${projectB}`);
    addProjectToWorkspace(projectA);
    addProjectToWorkspace(projectB);
    addPackageDependency(`libs/${projectB}`, projectA, 'any');

    await runNxCommandAsync('graph --file graph.json');
    const graph = await readJson('graph.json');
    expect(graph.graph.dependencies[projectB]).toEqual([
      {
        source: projectB,
        target: projectA,
        type: 'static',
      },
    ]);
  }, 120000);
});

function addPluginToNxJson(plugin: string) {
  updateFile('nx.json', (contents) => {
    const json = JSON.parse(contents);

    const plugins: string[] = (json['plugins'] = json['plugins'] ?? []);
    if (!plugins.includes(plugin)) {
      plugins.push(plugin);
    }

    return JSON.stringify(json, null, 2);
  });
}

function addProjectToWorkspace(
  name: string,
  { path, project }: { path?: string; project?: object } = {}
) {
  const projectPath = path ?? `libs/${name}`;

  updateFile(`workspace.json`, (content) => {
    const json = JSON.parse(content);

    const projects = (json['projects'] = json['projects'] ?? {});
    projects[name] = projectPath;

    return JSON.stringify(json, null, 2);
  });

  updateFile(
    `${projectPath}/project.json`,
    JSON.stringify(project ?? {}, null, 2)
  );
}

function addPackageDependency(
  packageRoot: string,
  name: string,
  spec: unknown
) {
  updateFile(`${packageRoot}/pubspec.yaml`, (content) => {
    const yaml = YAML.parse(content);

    const dependencies = (yaml['dependencies'] = yaml['dependencies'] ?? {});
    dependencies[name] = spec;

    return YAML.stringify(yaml, {
      indent: 2,
    });
  });
}
