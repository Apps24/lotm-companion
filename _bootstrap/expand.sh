#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SHA='74de63fed3ee990614b0dcc1105da98a501b06e59b88f0f4f548c240ee0894a8'
PART_COUNT="$(find _bootstrap -maxdepth 1 -name 'release.part.*' | wc -l | tr -d ' ')"
test "$PART_COUNT" = "10"

cat _bootstrap/release.part.* > /tmp/book1-release.b64
base64 -d /tmp/book1-release.b64 > /tmp/book1-release.tar.xz
echo "$EXPECTED_SHA  /tmp/book1-release.tar.xz" | sha256sum -c -

rm -rf /tmp/book1-release
mkdir -p /tmp/book1-release
tar -xJf /tmp/book1-release.tar.xz -C /tmp/book1-release

git fetch origin phase/3-7-book1-complete
git checkout -B phase/3-7-book1-complete origin/phase/3-7-book1-complete
cp -a /tmp/book1-release/. ./

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add -A
if git diff --cached --quiet; then
  echo 'No Phase 3-7 changes to commit.'
else
  git commit -m 'feat: complete Book 1 companion through Phase 7'
  git push origin phase/3-7-book1-complete
fi
