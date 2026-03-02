#!/bin/bash
set -e

OUT="snowgrab.xpi"

zip -r "$OUT" manifest.json background.js content.js icons/

echo "Built $OUT"
