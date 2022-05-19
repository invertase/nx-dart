#!/usr/bin/env node

// Adapted from add-nx-to-monorepo
// https://github.com/nrwl/nx/blob/master/packages/add-nx-to-monorepo/src/add-nx-to-monorepo.ts

import { output } from '@nrwl/devkit';
import { execSync } from 'child_process';
import * as enquirer from 'enquirer';
import * as fs from 'fs';
import ignore from 'ignore';
import * as path from 'path';
import * as stripJsonComments from 'strip-json-comments';
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
  return allPubspecs(repoRoot, repoRoot).filter((p) => p !== 'pubspec.yaml');
}

function allPubspecs(repoRoot: string, dirName: string) {
  const ignoredGlobs = getIgnoredGlobs(repoRoot);
  const relDirName = path.relative(repoRoot, dirName);
  if (
    relDirName &&
    (ignoredGlobs.ignores(relDirName) ||
      relDirName.indexOf(`node_modules`) > -1)
  ) {
    return [];
  }

  let res: string[] = [];
  try {
    fs.readdirSync(dirName).forEach((c) => {
      const child = path.join(dirName, c);
      if (ignoredGlobs.ignores(path.relative(repoRoot, child))) {
        return;
      }
      try {
        const s = fs.statSync(child);
        if (!s.isDirectory() && c === 'pubspec.yaml') {
          res.push(path.relative(repoRoot, child));
        } else if (s.isDirectory() && c !== 'example') {
          res = [...res, ...allPubspecs(repoRoot, child)];
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    });
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return res;
}

function getIgnoredGlobs(repoRoot: string) {
  const ig = ignore();
  try {
    ig.add(fs.readFileSync(`${repoRoot}/.gitignore`).toString());
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return ig;
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
  const json = readJsonFile(repoRoot, 'package.json');
  if (!json.devDependencies) json.devDependencies = {};
  json.devDependencies['typescript'] = 'TYPESCRIPT_VERSION';
  json.devDependencies['nx'] = 'NX_VERSION';
  json.devDependencies['@nx-dart/nx-dart'] =
    process.env['NX_DART_E2E_VERSION'] ?? 'NX_DART_VERSION';
  if (useCloud) {
    json.devDependencies['@nrwl/nx-cloud'] = 'latest';
  }
  writeJsonFile(repoRoot, 'package.json', json);
}

function readJsonFile(repoRoot: string, file: string) {
  return JSON.parse(
    stripJsonComments(fs.readFileSync(path.join(repoRoot, file), 'utf-8'))
  );
}

function writeJsonFile(repoRoot: string, file: string, json: unknown) {
  fs.writeFileSync(path.join(repoRoot, file), JSON.stringify(json, null, 2));
}

function createNxJson(repoRoot: string) {
  writeJsonFile(repoRoot, 'nx.json', {
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
  writeJsonFile(repoRoot, 'workspace.json', {
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
  execSync(
    `${
      getPackageManagerCommand(repoRoot).exec
    } nx g @nx-dart/nx-dart:add-package ${packageRoot}`,
    {
      stdio: 'inherit',
    }
  );
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
      `- Learn more at https://github.com/blaugold/nx-dart/tree/main/packages/nx-dart`,
    ],
  });
}

addNxDartToMonorepo().catch((e) => console.error(e));
