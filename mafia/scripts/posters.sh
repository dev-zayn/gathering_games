#!/bin/sh
# Game posters: the artwork in art/*.png is ~2MB a sheet — far too heavy for
# a game frame. This writes the WebP copies the games actually load, under
# ASCII names (the Arabic file names stay as the source of truth):
#
#   public/images/games/<id>.webp        720w  — the game's loading screen
#
# Re-run after replacing a poster:  bun run posters   (needs `cwebp`)
set -eu
cd "$(dirname "$0")/../art"
mkdir -p ../public/images/games

poster() {
  cwebp -quiet -q 78 -resize 720 0 "$1" -o "../public/images/games/$2.webp"
  echo "  $2 ← $1"
}

poster "مافيا.png" mafia
ls -l games | awk 'NR>1 {print "  " $5 "\t" $9}'
