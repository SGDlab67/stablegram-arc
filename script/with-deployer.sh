#!/bin/bash
# Run a forge or cast command with the arc-deployer keystore unlocked.
#
#   script/with-deployer.sh cast send --account arc-deployer --rpc-url ... <args>
#   script/with-deployer.sh forge script script/Deploy.s.sol:Deploy --account arc-deployer --broadcast --rpc-url ...
#
# The password comes from the macOS Keychain item `arc-deployer-keystore`.
# Foundry only accepts a password file, not a pipe or a FIFO, so it lands in a
# 0600 temp file that is removed when the command exits. It never appears in a
# command argument or in shell history. Set it up once with:
#
#   security add-generic-password -a "$USER" -s arc-deployer-keystore -w
#
set -euo pipefail
umask 077
pw=$(mktemp "${TMPDIR:-/tmp}/.arcpw.XXXXXX")
trap 'rm -f "$pw"' EXIT INT TERM
security find-generic-password -w -s arc-deployer-keystore | tr -d '\n' >"$pw"
ETH_PASSWORD="$pw" "$@"
