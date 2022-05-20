`@nx-dart/nx-dart` is a [Nx] plugin, that adds support for developing Dart and
Flutter packages in a Nx workspace.

The plugin analyzes packages and their dependencies in the workspace and
contributes to the Nx project graph.

It provides executors to format, analyze, and test Dart packages.

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

# Generators

The `nx-dart` preset and `add-nx-dart-to-monorepo` make `nx-dart` the default
generator collection. The rest of this document assumes that this is the case
and uses the shorthand for generators.

## add-package

Adds an existing Dart package to the workspace.

This command is usually used to integrate a package into the Nx workspace after
creating it with `dart create` or `flutter create`:

```shell
flutter create -t app apps/counter
npx nx g add-package apps/counter
```

### Options

- `--project-type`: The Nx project type of the package. This is optional. If not
  specified, the project type is inferred.

## change-lints

Changes the lint rules in the workspace analysis options.

Lint rules are defined in the `analysis_options.yaml` file at the project root.
These options apply to all packages in the workspace, that don't have a
`analysis_options.yaml` file of their own.

This generator changes the lint rules to on of the following:

- `core`: Core rules from the [`lints`][lints] package.
- `recommended`: Recommended rules from the [`lints`][lints] package.
- `flutter`: Rules from the [`flutter_lints`][flutter_lints] package.
- `all`: All available [lint rules][all_lints]. Requires resolving conflicting
  rules.

```shell
npx nx g change-lints flutter
```

# Executors

## format

Formats Dart files in a package.

```json
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

```json
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

```json
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

- `targets`: The files or directories which contain the tests to run.
- `coverage`: Whether to collect coverage information. The `dart` tool does not
  output lcov.info files by default. The executor converts the Dart coverage
  data into a lcov.info file automatically. The `flutter` tool outputs an
  lcov.info file by default.

All additional options are passed to the Dart or Flutter test tool.
Abbreviations are not supported.

[nx]: https://nx.dev/
[lints]: https://pub.dev/packages/lints
[flutter_lints]: https://pub.dev/packages/flutter_lints
[all_lints]: https://github.com/dart-lang/linter/blob/master/example/all.yaml
