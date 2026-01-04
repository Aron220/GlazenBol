#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/chrome"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cp -a "$ROOT_DIR/src" "$OUT_DIR/"
cp -a "$ROOT_DIR/images" "$OUT_DIR/"
cp -a "$ROOT_DIR/manifest.chrome.json" "$OUT_DIR/manifest.json"

printf 'Chrome build ready at %s\n' "$OUT_DIR"
