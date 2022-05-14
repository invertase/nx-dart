import { formatFiles, Tree } from '@nrwl/devkit';
import fetch from 'node-fetch';
import { setupWorkspaceForNxDart } from '../common/setup-workspace';
import { LintRules, PresetGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: PresetGeneratorSchema,
  { installDependencies }: { installDependencies?: boolean } = {}
) {
  await setupWorkspaceForNxDart(tree, {
    installDependencies: installDependencies ?? true,
    overwrite: true,
  });

  await addAnalysisOptions(tree, options.lints);
  await formatFiles(tree);
}

async function addAnalysisOptions(tree: Tree, lints: LintRules) {
  const parts: string[] = [];

  let include: string | undefined;
  let linterSection: string;
  switch (lints) {
    case LintRules.core:
      include = 'package:lints/core.yaml';
      break;
    case LintRules.recommended:
      include = 'package:lints/recommended.yaml';
      break;
    case LintRules.flutter:
      include = 'package:flutter_lints/flutter.yaml';
      break;
    case LintRules.all:
      linterSection = await downloadAllLintsConfig();
      break;
  }

  if (include) {
    parts.push(`
include: ${include}

`);
  }

  parts.push(`
analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true

`);

  if (linterSection) {
    parts.push(linterSection);
  }

  tree.write('analysis_options.yaml', parts.join(''));
}

async function downloadAllLintsConfig() {
  const url =
    'https://raw.githubusercontent.com/dart-lang/linter/master/example/all.yaml';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not download all lint rules from ${url}: ${response.statusText}`
    );
  }
  const text = await response.text();

  // Remove comments
  return text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
}
