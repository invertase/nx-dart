import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:analyzer/dart/ast/ast.dart';

List<String> parseImports(String fileContents) {
  try {
    return parseString(content: fileContents)
        .unit
        .directives
        .whereType<ImportDirective>()
        .map((import) => import.uri.stringValue)
        .whereType<String>()
        .toList();
  } on ArgumentError {
    return [];
  }
}
