## Development environment

You need to have NodeJS and Dart installed and on your path.

After cloning the repository, run the following command to install the dependencies:

```shell
npm ci
npm run install-workspace-packages
```

## Updating dependencies

After upgrading or adding dependencies, you need to run `npm run update-workspace-packages-deps`
to update the lock file, accounting for linked packages in the workspace.
