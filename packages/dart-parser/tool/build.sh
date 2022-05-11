#!/usr/bin/env bash

set -e

DIST_DIR=./dist

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

dart compile js -o build/index.js lib/index.dart

cat lib/node_preamble.js >"$DIST_DIR/index.js"
cat build/index.js >>"$DIST_DIR/index.js"

rm -rf ./build
