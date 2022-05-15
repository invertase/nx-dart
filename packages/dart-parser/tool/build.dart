import 'dart:io';

void main() {
  final distDir = Directory('dist');
  final buildDir = Directory('build');
  final nodePreamble = File('lib/node_preamble.js');
  final buildIndexJs = File('${buildDir.path}/index.js');
  final distIndexJs = File('${distDir.path}/index.js');

  if (distDir.existsSync()) {
    distDir.deleteSync(recursive: true);
  }
  distDir.createSync(recursive: true);

  execSync([
    'dart',
    'compile',
    'js',
    '-o',
    buildIndexJs.path,
    'lib/index.dart',
  ]);

  distIndexJs.writeAsBytesSync(nodePreamble.readAsBytesSync());
  distIndexJs.writeAsBytesSync(
    buildIndexJs.readAsBytesSync(),
    mode: FileMode.append,
  );

  buildDir.deleteSync(recursive: true);
}

void execSync(List<String> command) {
  final result = Process.runSync(command[0], command.sublist(1));
  if (result.exitCode != 0) {
    throw Exception(
      'Failed to execute command: ${command.join(' ')}\n'
      'Exit code: ${result.exitCode}\n'
      'Stdout:\n${result.stdout}\n'
      'Stderr:\n${result.stderr}',
    );
  }
}
