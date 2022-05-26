// Adapted from add-nx-to-monorepo
// https://github.com/nrwl/nx/blob/master/packages/add-nx-to-monorepo/src/add-nx-to-monorepo.ts

import { output, readJsonFile, writeJsonFile } from '@nrwl/devkit';
import { execSync } from 'child_process';
import * as enquirer from 'enquirer';
import * as fs from 'fs';
import { isGitIgnoredSync } from 'globby';
import * as path from 'path';
import * as yargsParser from 'yargs-parser';

const parsedArgs = yargsParser(process.argv, {
  boolean: ['nxCloud'],
  string: ['lints'],
  configuration: {
    'strip-dashed': true,
    'strip-aliased': true,
  },
});

async function addNxDartToMonorepo() {
  const repoRoot = process.cwd();

  output.log({
    title: `🐳 Nx initialization`,
  });

  const useCloud = parsedArgs['nxCloud'] ?? (await askAboutNxCloud());
  const lintRules =
    parsedArgs['lints'] ?? (await askAboutAnalysisOptionsMigration());

  if (
    lintRules &&
    !['core', 'recommended', 'flutter', 'all', 'none'].includes(lintRules)
  ) {
    output.error({ title: `Invalid lint rules: ${lintRules}` });
    process.exit(1);
  }

  output.log({
    title: `🧑‍🔧 Analyzing the source code`,
  });

  const packageRoots = projectPubspecs(repoRoot).map(path.dirname);

  if (packageRoots.length === 0) {
    output.error({ title: `Cannot find any projects in this monorepo` });
    process.exit(1);
  }

  output.log({ title: `📦 Installing dependencies` });
  ensureWorkspacePackageJson(repoRoot);
  addDepsToPackageJson(repoRoot, useCloud);
  runInstall(repoRoot);

  output.log({ title: `✨ Setting up workspace` });
  createNxJson(repoRoot);
  createWorkspaceJson(repoRoot);
  setupNxDartWorkspace(repoRoot);

  if (lintRules !== 'none') {
    setupLintRules(repoRoot, lintRules);
  }

  for (const packageRoot of packageRoots) {
    setupPackage(repoRoot, packageRoot);
  }

  if (useCloud) {
    initCloud(repoRoot);
  }

  printFinalMessage(repoRoot);
}

async function askAboutNxCloud() {
  return enquirer
    .prompt<{ NxCloud: 'Yes' | 'No' }>([
      {
        name: 'NxCloud',
        message: `Use Nx Cloud? (It's free and doesn't require registration.)`,
        type: 'select',
        choices: [
          {
            name: 'Yes',
            hint: 'Faster builds, run details, GitHub integration. Learn more at https://nx.app',
          },

          {
            name: 'No',
          },
        ],
        initial: 0,
      },
    ])
    .then((a) => a.NxCloud === 'Yes');
}

async function askAboutAnalysisOptionsMigration(): Promise<string | undefined> {
  return enquirer
    .prompt<{ AnalysisOptionsMigration: string | undefined }>([
      {
        name: 'AnalysisOptionsMigration',
        message:
          'Migrate to a single workspace-wide analysis_options.yaml file?',
        type: 'select',
        choices: [
          {
            name: 'core',
            message: 'Use the core lint rules from the lints package.',
          },
          {
            name: 'recommended',
            message: 'Use the recommended lint rules from the lints package.',
          },
          {
            name: 'flutter',
            message: 'Use the lint rules from the flutter_lints package.',
          },
          {
            name: 'all',
            message:
              'Enable all available lint rules. Requires resolving conflicting rules.',
          },
          {
            name: 'No',
            value: undefined,
          },
        ],
        initial: 0,
      },
    ])
    .then((a) =>
      a.AnalysisOptionsMigration === 'No' ? 'none' : a.AnalysisOptionsMigration
    );
}

function projectPubspecs(repoRoot: string): string[] {
  return allPubspecs(repoRoot).filter((p) => p !== 'pubspec.yaml');
}

function allPubspecs(repoRoot: string) {
  const isIgnored = isGitIgnoredSync({ cwd: repoRoot });

  function inner(dirPath: string) {
    const relativeDirPath = path.relative(repoRoot, dirPath);
    if (
      relativeDirPath &&
      (isIgnored(relativeDirPath) ||
        relativeDirPath.indexOf(`node_modules`) > -1)
    ) {
      return [];
    }

    const pubspecPaths: string[] = [];
    try {
      fs.readdirSync(dirPath).forEach((child) => {
        const childPath = path.join(dirPath, child);
        const relativeChildPath = path.relative(repoRoot, childPath);

        if (isIgnored(relativeChildPath)) {
          return;
        }

        try {
          const stat = fs.statSync(childPath);
          if (stat.isDirectory()) {
            if (child !== 'example') {
              pubspecPaths.push(...inner(childPath));
            }
          } else {
            if (child === 'pubspec.yaml') {
              pubspecPaths.push(childPath);
            }
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    return pubspecPaths;
  }

  return inner(repoRoot);
}

const defaultPackageJson = `
{
  "private": true
}
`;

function ensureWorkspacePackageJson(repoRoot: string) {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(packageJsonPath, defaultPackageJson);
  }
}

function addDepsToPackageJson(repoRoot: string, useCloud: boolean) {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const json = readJsonFile(packageJsonPath);
  if (!json.devDependencies) json.devDependencies = {};
  json.devDependencies['nx'] = 'NX_VERSION';
  json.devDependencies['@nrwl/cli'] = 'NX_VERSION';
  json.devDependencies['@nrwl/workspace'] = 'NX_VERSION';
  if (!json.devDependencies['prettier']) {
    json.devDependencies['prettier'] = 'PRETTIER_VERSION';
  }
  if (!json.devDependencies['typescript']) {
    json.devDependencies['typescript'] = 'TYPESCRIPT_VERSION';
  }
  json.devDependencies['@nx-dart/nx-dart'] =
    process.env['NX_DART_E2E_VERSION'] ?? 'NX_DART_VERSION';
  if (useCloud) {
    json.devDependencies['@nrwl/nx-cloud'] = 'latest';
  }
  writeJsonFile(packageJsonPath, json);
}

function createNxJson(repoRoot: string) {
  writeJsonFile(path.join(repoRoot, 'nx.json'), {
    $schema: './node_modules/nx/schemas/nx-schema.json',
    affected: {
      defaultBase: deduceDefaultBase(),
    },
    implicitDependencies: {
      'package.json': {
        dependencies: '*',
        devDependencies: '*',
      },
    },
    tasksRunnerOptions: {
      default: {
        runner: 'nx/tasks-runners/default',
        options: {
          cacheableOperations: ['build', 'lint', 'test', 'e2e'],
        },
      },
    },
    targetDependencies: {
      build: [
        {
          target: 'build',
          projects: 'dependencies',
        },
      ],
    },
  });
}

function deduceDefaultBase() {
  try {
    execSync(`git rev-parse --verify main`, {
      stdio: 'ignore',
    });
    return 'main';
  } catch (e) {
    try {
      execSync(`git rev-parse --verify dev`, {
        stdio: 'ignore',
      });
      return 'dev';
    } catch (e) {
      try {
        execSync(`git rev-parse --verify develop`, {
          stdio: 'ignore',
        });
        return 'develop';
      } catch (e) {
        try {
          execSync(`git rev-parse --verify next`, {
            stdio: 'ignore',
          });
          return 'next';
        } catch (e) {
          return 'master';
        }
      }
    }
  }
}

function createWorkspaceJson(repoRoot: string) {
  writeJsonFile(path.join(repoRoot, 'workspace.json'), {
    $schema: './node_modules/nx/schemas/workspace-schema.json',
    version: 2,
    projects: {},
  });
}

function setupNxDartWorkspace(repoRoot: string) {
  execSync(
    `${
      getPackageManagerCommand(repoRoot).exec
    } nx g @nx-dart/nx-dart:preset --lints false`,
    {
      stdio: 'inherit',
    }
  );
}

function setupLintRules(repoRoot: string, lints: string) {
  execSync(
    `${
      getPackageManagerCommand(repoRoot).exec
    } nx g @nx-dart/nx-dart:change-lints ${lints}`,
    {
      stdio: 'inherit',
    }
  );
}

function setupPackage(repoRoot: string, packageRoot: string) {
  const command = `${
    getPackageManagerCommand(repoRoot).exec
  } nx g @nx-dart/nx-dart:add-package ${packageRoot}`;

  try {
    execSync(command, {
      stdio: 'inherit',
    });
  } catch (e) {
    output.error({
      title: `Could not add package at ${packageRoot}`,
      bodyLines: [
        'After resolving the issue, run the following command to add the package:',
        command,
      ],
    });
  }
}

function initCloud(repoRoot: string) {
  execSync(
    `${getPackageManagerCommand(repoRoot).exec} nx g @nrwl/nx-cloud:init`,
    {
      stdio: 'inherit',
    }
  );
}

function getPackageManagerCommand(repoRoot: string): {
  install: string;
  exec: string;
} {
  const packageManager = fs.existsSync(path.join(repoRoot, 'yarn.lock'))
    ? 'yarn'
    : fs.existsSync(path.join(repoRoot, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : 'npm';

  switch (packageManager) {
    case 'yarn':
      return {
        install: 'yarn',
        exec: 'yarn',
      };

    case 'pnpm':
      return {
        install: 'pnpm install --no-frozen-lockfile', // explicitly disable in case of CI
        exec: 'pnpx',
      };

    case 'npm':
      return {
        install: 'npm install --legacy-peer-deps',
        exec: 'npx',
      };
  }
}

function runInstall(repoRoot: string) {
  execSync(getPackageManagerCommand(repoRoot).install, { stdio: 'inherit' });
}

function printFinalMessage(repoRoot: string) {
  output.success({
    title: `🎉 Done!`,
    bodyLines: [
      `- Enabled Computation caching!`,
      `- Run "${
        getPackageManagerCommand(repoRoot).exec
      } nx run-many --target=analyze --all" to analyze every project in the monorepo.`,
      `- Run it again to replay the cached computation.`,
      `- Run "${
        getPackageManagerCommand(repoRoot).exec
      } nx graph" to see the structure of the monorepo.`,
      `- Learn more at https://github.com/invertase/nx-dart/tree/main/packages/nx-dart`,
    ],
  });
}

addNxDartToMonorepo().catch((e) => console.error(e));
