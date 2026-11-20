#!/usr/bin/env bash
# Four things the deployed contract will not let the agent do, run against Arc testnet.
#
# Every call here is eth_call: read-only, nothing is signed and no state changes. The
# point is that the refusals come from the contract rather than from the agent's own
# code or its prompt, so they hold even if the agent is compromised or lies.
set -u

SP=0x32d3b9d88168a5f2677a6513cfaa6ab0000920fa
USDC=0x3600000000000000000000000000000000000000
OWNER=0xA87D1A929a93FbC809391F5FF53aaB9bdA54EB46
RPC=${ARC_RPC:-https://rpc.testnet.arc.io}
STRANGER=0x000000000000000000000000000000000000dEaD
SEND="sendAsAgent(address,address,string,uint256,string)"

AGENT=$(cast call $SP "agentOf(address)(address)" $OWNER --rpc-url $RPC)
read -r PER_SEND PER_DAY < <(cast call $SP "limitOf(address,address)(uint256,uint256)" $OWNER $USDC --rpc-url $RPC | sed 's/ \[.*\]//' | tr '\n' ' ')

echo
echo "Stableplan refusals, on the contract deployed at $SP"
echo "  agent        $AGENT"
echo "  per-send cap $((PER_SEND / 1000000)) USDC      per-day cap $((PER_DAY / 1000000)) USDC"
echo "  every call below is eth_call: read-only, nothing signed"
echo

# $1 what was attempted, $2 the error signature expected, rest: the cast call
try() {
  local what=$1 sig=$2
  shift 2
  local out data
  out=$("$@" --rpc-url "$RPC" 2>&1)
  data=$(printf '%s' "$out" | grep -oE '0x[0-9a-fA-F]{8,}' | tail -1)
  if [ -z "$data" ]; then
    printf '  %-46s ALLOWED, no revert: %s\n' "$what" "$out"
    return 1
  fi
  local args
  args=$(cast decode-error --sig "$sig" "$data" 2>/dev/null | sed 's/ \[.*\]//' | paste -sd, - | sed 's/,/, /g')
  printf '  %-46s reverts %s%s\n' "$what" "${sig%%(*}" "${args:+  ($args)}"
}

try "agent sends 45 USDC, over the per-send cap" "OverPerSendLimit(uint256,uint256)" \
  cast call $SP "$SEND" $OWNER $USDC maria 45000000 "over the cap" --from "$AGENT"

try "agent approves its own proposal" "NotYourProposal()" \
  cast call $SP "approve(uint256)" 0 --from "$AGENT"

try "a stranger sends as the owner's agent" "NotAgent()" \
  cast call $SP "$SEND" $OWNER $USDC maria 25000000 "not the agent" --from $STRANGER

try "agent pays a username nobody has claimed" "NoSuchName()" \
  cast call $SP "$SEND" $OWNER $USDC charlie 25000000 "unclaimed" --from "$AGENT"

echo
echo "Revocation is one transaction, authorizeAgent(address(0)), and it takes effect for"
echo "every token at once. It is not run here because it would end the demo; the test"
echo "test_revokingTheAgentIsImmediate in test/Flow.t.sol covers it."
echo
