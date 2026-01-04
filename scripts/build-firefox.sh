#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/firefox"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cp -a "$ROOT_DIR/src" "$OUT_DIR/"
cp -a "$ROOT_DIR/images" "$OUT_DIR/"
cp -a "$ROOT_DIR/manifest.json" "$OUT_DIR/"

printf 'Firefox build ready at %s\n' "$OUT_DIR"
