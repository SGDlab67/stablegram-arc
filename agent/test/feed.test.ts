// The webhook path, checked against a payload QuickNode actually produced.
//
// test/fixtures/stream-payload.json is the response from
// POST /streams/rest/v1/streams/test_filter run with agent/stream-filter.js
// over Arc testnet block 72747338, which holds the first payment the
// deployed contract emitted. That block also holds two native USDC transfer
// logs from Arc's own 0xff..fe address, and the filter dropped both, so what
// the fixture contains is exactly what a Stream would deliver.
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { feed, ingest } from "../src/server.ts";

const payload = JSON.parse(readFileSync(new URL("fixtures/stream-payload.json", import.meta.url), "utf8")).result;

test("a real filtered payload decodes into the feed", () => {
  feed.length = 0;
  assert.equal(ingest(payload), 1);
  const [item] = feed;
  assert.equal(item.event, "Sent");
  assert.equal(item.args.name, "longhorntaps");
  assert.equal(item.args.memo, "first payment on the new contract");
  assert.equal(item.args.value, "10000000000000000");
  assert.equal(item.args.byAgent, "false");
  assert.equal(item.block, "72747338");
});

test("a redelivered payload is not duplicated", () => {
  feed.length = 0;
  assert.equal(ingest(payload), 1);
  assert.equal(ingest(payload), 0);
  assert.equal(feed.length, 1);
});

test("a log from another contract is ignored", () => {
  feed.length = 0;
  const foreign = [{ ...payload[0], address: "0x000000000000000000000000000000000000dead" }];
  assert.equal(ingest(foreign), 0);
  assert.equal(feed.length, 0);
});

test("a nested batch is flattened the way Streams delivers it", () => {
  feed.length = 0;
  // dataset_batch_size 5 nests the logs as data[block][transaction][log].
  assert.equal(ingest({ data: [[payload], []] }), 1);
  assert.equal(feed.length, 1);
});
