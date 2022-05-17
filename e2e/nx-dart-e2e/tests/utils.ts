import { getPackageManagerCommand } from '@nrwl/devkit';
import { readFile, tmpProjPath, updateFile } from '@nrwl/nx-plugin/testing';
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

export function writePubspec(
  packageRoot: string,
  content: Record<string, unknown>
) {
  updateFile(
    `${packageRoot}/pubspec.yaml`,
    YAML.stringify({
      environment: {
        sdk: '>=2.17.0 <3.0.0',
      },
      ...content,
    })
  );
}

export function writeAnalysisOptions(
  packageRoot: string,
  content: Record<string, unknown>
) {
  updateFile(`${packageRoot}/analysis_options.yaml`, YAML.stringify(content));
}

export function readPubspec(packageRoot: string) {
  const content = readFile(`${packageRoot}/pubspec.yaml`);
  return content ? YAML.parse(content) : undefined;
}

export function readAnalysisOptions(packageRoot: string) {
  const content = readFile(`${packageRoot}/analysis_options.yaml`);
  return content ? YAML.parse(content) : undefined;
}
