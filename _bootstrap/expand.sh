#!/usr/bin/env bash
set -euo pipefail
cat _bootstrap/payload.part.* > /tmp/payload.b64
base64 -d /tmp/payload.b64 > /tmp/payload.tar.gz
sha256sum /tmp/payload.tar.gz
mkdir -p /tmp/release
rm -rf /tmp/release/*
tar -xzf /tmp/payload.tar.gz -C /tmp/release
cp -a /tmp/release/. ./
rm -rf _bootstrap
rm -f .github/workflows/expand-book1-release.yml
git add -A
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git commit -m 'feat: complete Book 1 companion through Phase 7'
git push origin HEAD:phase/3-7-book1-complete --force-with-lease
