@JS()
library import_parser;

import 'package:js/js.dart';
import 'package:js/js_util.dart';

import 'src/parse_imports.dart';

@JS()
external Object get exports;

void main() {
  setProperty(exports, 'parseImports', allowInterop(parseImports));
}
