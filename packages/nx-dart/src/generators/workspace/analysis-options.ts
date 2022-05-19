import { GeneratorCallback, Tree } from '@nrwl/devkit';
import fetch from 'node-fetch';
import * as YAML from 'yaml';
import { packageNameFromUri } from '../../utils/dart-source';
import {
  addHostedDependencyToPackage,
  removeDependencyFromPackage,
} from '../../utils/package';
import { runAllTasks } from '../utils/generator';
import { updateNxJson } from '../utils/nx-workspace';

const workspaceAnalysisOptions = `
analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
`;

export function ensureWorkspaceAnalysisOptions(tree: Tree) {
  if (!tree.exists('analysis_options.yaml')) {
    tree.write('analysis_options.yaml', workspaceAnalysisOptions);
  }

  updateNxJson(tree, (nxJson) => {
    // Make the analysis_options.yaml file at the workspace root an implicit dependencies.
    const implicitDependencies = (nxJson.implicitDependencies =
      nxJson.implicitDependencies ?? {});
    if (!('analysis_options.yaml' in implicitDependencies)) {
      implicitDependencies['analysis_options.yaml'] = '*';
    }

    return nxJson;
  });
}

export enum LintRules {
  core = 'core',
  recommended = 'recommended',
  flutter = 'flutter',
  all = 'all',
}

export async function updateWorkspaceAnalysisOptions(
  tree: Tree,
  lints: LintRules
): Promise<GeneratorCallback | undefined> {
  const analysisOptions = tree.read('analysis_options.yaml', 'utf-8');
  const doc = YAML.parseDocument(analysisOptions);

  let contents: YAML.YAMLMap;
  if (doc.contents instanceof YAML.YAMLMap) {
    contents = doc.contents;
  } else {
    contents = new YAML.YAMLMap();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.contents = contents as any;
  }

  // Exclude node_modules from analysis.
  let analyzer = contents.get('analyzer') as YAML.YAMLMap;
  if (!(analyzer instanceof YAML.YAMLMap)) {
    analyzer = new YAML.YAMLMap();
    contents.set(doc.createNode('analyzer'), analyzer);
  }
  let exclude = analyzer.get('exclude') as YAML.YAMLSeq;
  if (!(exclude instanceof YAML.YAMLSeq)) {
    exclude = new YAML.YAMLSeq();
    analyzer.items.splice(0, 0, doc.createPair('exclude', exclude));
  }
  if (!exclude.toJSON().includes('node_modules/**')) {
    exclude.add(doc.createNode('node_modules/**'));
  }

  // Include analysis options from package or inline lint rules.
  const currentInclude = contents.get('include') as string | undefined;
  let include: string | undefined;
  let lintRules: string[];
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
      lintRules = await downloadAllLintRules();
      break;
  }

  if (contents.get('include') !== include) {
    contents.delete('include');
    if (include) {
      contents.items.splice(0, 0, doc.createPair('include', include));
    }
  }

  if (lintRules) {
    let linter = contents.get('linter') as YAML.YAMLMap;
    if (!(linter instanceof YAML.YAMLMap)) {
      linter = new YAML.YAMLMap();
      contents.items.push(doc.createPair('linter', linter));
    }
    let rules = linter.get('rules') as YAML.YAMLSeq;
    if (!(rules instanceof YAML.YAMLMap)) {
      rules = new YAML.YAMLSeq();
      linter.items.push(doc.createPair('rules', rules));
    }
    const currentRules = rules.toJSON();
    for (const rule of lintRules) {
      if (!currentRules.includes(rule)) {
        rules.add(doc.createNode(rule));
      }
    }
  }

  tree.write('analysis_options.yaml', doc.toString());

  // Change included package in pubspec.yaml if necessary.
  const tasks: GeneratorCallback[] = [];
  const includedPackage = include ? packageNameFromUri(include) : undefined;
  const currentIncludedPackage = currentInclude
    ? packageNameFromUri(currentInclude)
    : undefined;
  if (currentIncludedPackage !== includedPackage) {
    if (currentIncludedPackage) {
      tasks.push(() =>
        removeDependencyFromPackage('.', currentIncludedPackage)
      );
    }

    if (includedPackage) {
      tasks.push(() =>
        addHostedDependencyToPackage('.', includedPackage, { dev: true })
      );
    }
  }

  return runAllTasks(tasks);
}

async function downloadAllLintRules(): Promise<string[]> {
  const analysisOptionsUrl =
    'https://raw.githubusercontent.com/dart-lang/linter/master/example/all.yaml';

  const response = await fetch(analysisOptionsUrl);
  if (!response.ok) {
    throw new Error(
      `Could not download all lint rules from ${analysisOptionsUrl}: ${response.statusText}`
    );
  }

  return YAML.parse(await response.text()).linter.rules;
}
