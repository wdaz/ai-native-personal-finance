#!/bin/sh
# Runs the pinned gitleaks release (T-02a, NFR-S5). The binary is downloaded on first use
# into node_modules/.cache/gitleaks/<version>/<platform>/ and its SHA-256 is checked against
# the value pinned below once, when it is downloaded; a cached binary is trusted and run
# without a re-check (CI has no cache and always downloads). The platform is part of the
# key because node_modules can be shared between machines (a container, a mounted
# checkout): on 2026-09-22 a Linux binary in the old version-only slot blocked every commit
# on a Mac. One version everywhere: the hook, the CI `secret scan` job and
# tests/unit/secret-guard.test.ts all run through this file.
#
# To upgrade: change VERSION and the four SHA256 values together, copying them from
# gitleaks_<version>_checksums.txt on https://github.com/gitleaks/gitleaks/releases.
#
# GITLEAKS_CACHE_DIR and GITLEAKS_BASE_URL override the cache and the download location
# (a mirror; the checksum test points the latter at a local file).
set -eu

VERSION=8.30.1

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) PLATFORM=darwin_arm64 SHA256=b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5 ;;
  Darwin-x86_64) PLATFORM=darwin_x64 SHA256=dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709 ;;
  Linux-x86_64) PLATFORM=linux_x64 SHA256=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb ;;
  Linux-aarch64 | Linux-arm64) PLATFORM=linux_arm64 SHA256=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080 ;;
  *)
    echo "gitleaks.sh: no pinned gitleaks $VERSION build for $(uname -s)-$(uname -m)" >&2
    exit 2
    ;;
esac

root="$(cd "$(dirname "$0")/.." && pwd)"
cache="${GITLEAKS_CACHE_DIR:-$root/node_modules/.cache/gitleaks}/$VERSION/$PLATFORM"
bin="$cache/gitleaks"

if [ ! -x "$bin" ]; then
  base_url="${GITLEAKS_BASE_URL:-https://github.com/gitleaks/gitleaks/releases/download/v$VERSION}"
  tarball="gitleaks_${VERSION}_${PLATFORM}.tar.gz"
  mkdir -p "$cache"
  # Download next to the final location so the closing `mv` is a rename on one filesystem:
  # a concurrent run sees either no binary or a whole one.
  work="$(mktemp -d "$cache/.download.XXXXXX")"
  trap 'rm -rf "$work"' EXIT
  echo "gitleaks.sh: downloading gitleaks $VERSION ($PLATFORM)" >&2
  curl -fsSL --retry 3 -o "$work/$tarball" "$base_url/$tarball"
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$work/$tarball" | cut -d ' ' -f 1)"
  else
    actual="$(shasum -a 256 "$work/$tarball" | cut -d ' ' -f 1)"
  fi
  if [ "$actual" != "$SHA256" ]; then
    echo "gitleaks.sh: checksum mismatch for $tarball (expected $SHA256, got $actual)" >&2
    exit 2
  fi
  tar -xzf "$work/$tarball" -C "$work" gitleaks
  chmod +x "$work/gitleaks"
  mv "$work/gitleaks" "$bin"
  rm -rf "$work"
  trap - EXIT
fi

exec "$bin" "$@"
