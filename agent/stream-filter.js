// QuickNode Streams filter for Stableplan on Arc testnet.
//
// Network: arc-testnet. Dataset: logs. Destination: webhook to the agent's
// POST /hooks/quicknode.
//
// Arc produces a block about every 0.5 seconds, so a tip Stream must use a
// dataset_batch_size of at least 5. With that batch size the payload is
// nested three deep: data[block][transaction][log]. Verified against
// arc-testnet with POST /streams/rest/v1/streams/test_filter.
//
// Only our contract's four payment events pass. Everything else, including
// every USDC transfer on the chain, is dropped before delivery, and a batch
// with nothing of ours returns null so it is not delivered at all.

const CONTRACT = "0xbadf08f324d5b4eaac5e33ae30ca57c1096e5dba"; // Stableplan payments, lower case

const EVENTS = {
  "0xdecc9598b2461ba6d53b07b125f717d31f9735b3bea4a6509e1bc1b7eb57a8e7": "Sent",
  "0x5ac91e227f8942626a8ae71fbd4e59490a20f6b1d3e8d75bc3c1fac6f6571ce5": "Proposed",
  "0x3ad93af63cb7967b23e4fb500b7d7d28b07516325dcf341f88bebf959d82c1cb": "Approved",
  "0x94064f919a02d0565c6790e0615fb4ba6cf1be1dd679f0161be914613a1b9bb5": "Rejected",
};

function main(stream) {
  const out = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object" || !node.topics) return;
    if (node.removed) return;
    if (String(node.address).toLowerCase() !== CONTRACT) return;
    const event = EVENTS[String(node.topics[0]).toLowerCase()];
    if (!event) return;
    out.push({
      event,
      address: node.address,
      topics: node.topics,
      data: node.data,
      blockNumber: node.blockNumber,
      blockTimestamp: node.blockTimestamp,
      transactionHash: node.transactionHash,
      logIndex: node.logIndex,
    });
  };
  visit(stream.data);
  return out.length ? out : null;
}
