## Pull Requests

PRs are welcome! For larger changes, please create a new issue first.

PRs should have a title that conforms to the
[conventional commit spec](https://www.conventionalcommits.org/en/v1.0.0/).

Mention related issues in the PR description.

## Development environment

You need to have NodeJS and Dart installed and on your path.

After cloning the repository, run the following command to install the
dependencies:

```shell
npm ci
npm run install-workspace-packages
```

## Updating dependencies

After upgrading or adding dependencies, you need to run
`npm run update-workspace-packages-deps` to update the lock file, so that it is
in sync with linked packages in the workspace.
