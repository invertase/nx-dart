import { getPackageManagerCommand } from '@nrwl/devkit';
import { tmpProjPath, updateFile } from '@nrwl/nx-plugin/testing';
import { exec } from 'child_process';
import * as YAML from 'yaml';

export function runCommandAsync(
  command: string,
  opts: {
    silenceError: boolean;
  } = { silenceError: false }
): Promise<{
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd: tmpProjPath(),
        env: {
          ...process.env,
          NX_WORKSPACE_ROOT_PATH: tmpProjPath(),
        },
      },
      (err, stdout, stderr) => {
        if (!opts.silenceError && err) {
          reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

export function runNxCommandAsync(
  command: string,
  opts: {
    silenceError: boolean;
  } = { silenceError: false }
): Promise<{
  stdout: string;
  stderr: string;
}> {
  const pmc = getPackageManagerCommand();
  return runCommandAsync(`${pmc.exec} nx ${command}`, opts);
}

export function addPluginToNxJson(plugin: string) {
  updateFile('nx.json', (contents) => {
    const json = JSON.parse(contents);

    const plugins: string[] = (json['plugins'] = json['plugins'] ?? []);
    if (!plugins.includes(plugin)) {
      plugins.push(plugin);
    }

    return JSON.stringify(json, null, 2);
  });
}

export function addProjectToWorkspace(
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

  return projectPath;
}

export function addPackageDependency(
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