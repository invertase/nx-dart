// Workaround to be able to use `globby` from TypeScript + CommonJS.
// `globby` is only available as ESM, but dynamic imports are converted to `require` by TypeScript.

exports.isGitIgnored = async function (options) {
  return (await import('globby')).isGitIgnored(options);
};
