`nx-dart` is a [Nx] plugin, that adds support for developing Dart and Flutter
packages in a Nx workspace.

> This plugin is at an early stage of development. Please open an
> [issue][issues] if you find a **bug** or have a **feature request**. Feel free
> to open a [discussion][discussions], if you have a **question**.

# Features

- Surface dependencies between packages to the Nx project graph.
- Executors:
  - format
  - analyze
  - test
- Generators:
  - add-package
  - change-lints

# Getting started

## Create a new Nx workspace with the `nx-dart` preset

Run the following command to create a new Nx workspace including `nx-dart`:

```shell
npx create-nx-workspace <workspace-name> --preset=@nx-dart/nx-dart
```

## Add Nx and `nx-dart` to an existing monorepo

In an existing monorepo, run the following command to add Nx and `nx-dart`:

```shell
npx add-nx-dart-to-monorepo
```

# Nx projects and Dart packages

Every package that should be part of the Nx workspace needs to have a
`project.json` file in the package root and needs to be registered in the
`workspace.json` file at the root of the workspace.

The `add-package` generator takes care of creating an initial `project.json`
file and registering the project in `workspace.json`, under the package's name.

If package B depends on package A and both live in the same workspace, the Nx
project graph will reflect this dependency. Dependencies on local packages are
**not automatically overridden** with path dependency for development, though.
If this is something you need, implement your own mechanism for overriding
dependencies or check out [Melos].

Melos is a Dart/Flutter specific monorepo tool with support for conventional
commit based versioning and publishing, among other features. Melos and Nx
complement each other, and can be used together.

# Generators

## add-package

Adds an existing Dart package to the workspace.

This generator is usually used to integrate a package into the Nx workspace
after creating it with `dart create` or `flutter create`:

```shell
flutter create -t app apps/counter
npx nx generate @nx-dart/nx-dart:add-package apps/counter
```

### Options

- `--project-type`: The Nx project type of the package. This is optional. If not
  specified, the project type is inferred.

## change-lints

Changes the lint rules in the workspace analysis options.

Lint rules are defined in the `analysis_options.yaml` file at the project root.
These options apply to all packages in the workspace, that don't have a
`analysis_options.yaml` file of their own.

This generator changes the lint rules to one of the following:

- `core`: Core rules from the [`lints`][lints] package.
- `recommended`: Recommended rules from the [`lints`][lints] package.
- `flutter`: Rules from the [`flutter_lints`][flutter_lints] package.
- `all`: All available [lint rules][all_lints]. Requires resolving conflicting
  rules.

```shell
npx nx generator @nx-dart/nx-dart:change-lints flutter
```

# Executors

## format

Formats Dart files in a package.

```jsonc
// libs/foo/project.json
{
  "targets": {
    "format": {
      "executor": "@nx-dart/nx-dart:format",
      "outputs": []
    }
  }
}
```

### Options

- `check`: Whether to validate the current formatting instead of fixing it.
  Default is `false`.

## analyze

Analyzes a Dart package.

```jsonc
// libs/foo/project.json
{
  "targets": {
    "analyze": {
      "executor": "@nx-dart/nx-dart:analyze",
      "outputs": []
    }
  }
}
```

### Options

- `fatalInfos`: Treat info level issues as fatal. Default is `true`.
- `fatalWarnings`: Treat warning level issues as fatal. Default is `true`.

## test

Runs Dart or Flutter tests in a package.

```jsonc
// libs/foo/project.json
{
  "targets": {
    "test": {
      "executor": "@nx-dart/nx-dart:test",
      "outputs": ["libs/foo/coverage"]
    },
    "e2e": {
      "executor": "@nx-dart/nx-dart:test",
      "outputs": ["libs/foo/coverage"],
      "options": {
        "targets": ["integration_test"]
      }
    }
  }
}
```

### Options

- `targets`: The files or directories which contain the tests to run. When not
  specified, all tests in the `test` directory are run.
- `coverage`: Whether to collect coverage information. The `dart` tool does not
  output `lcov.info` files by default. The executor converts the Dart coverage
  data into a `lcov.info` file automatically. The `flutter` tool outputs a
  `lcov.info` file by default.

All additional options are passed to the Dart or Flutter test tool.
Abbreviations are not supported.

[nx]: https://nx.dev/
[lints]: https://pub.dev/packages/lints
[flutter_lints]: https://pub.dev/packages/flutter_lints
[all_lints]: https://github.com/dart-lang/linter/blob/master/example/all.yaml
[issues]: https://github.com/invertase/nx-dart/issues
[discussions]: https://github.com/invertase/nx-dart/discussions
[melos]: https://melos.invertase.dev
