import { ensureNxProject, readJson, uniq } from '@nrwl/nx-plugin/testing';
import {
  addPackageDependency,
  addPluginToNxJson,
  addProjectToWorkspace,
  runCommandAsync,
  runNxCommandAsync,
} from './utils';

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
