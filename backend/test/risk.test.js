import { test } from "node:test";
import assert from "node:assert/strict";
import { Interface, MaxUint256 } from "ethers";
import { decodeCall } from "../src/decoder.js";
import { analyzeTransaction } from "../src/risk.js";

const iface = new Interface([
  "function approve(address,uint256)",
  "function setApprovalForAll(address,bool)",
  "function transfer(address,uint256)",
]);

const TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const DRAINER = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // contract
const WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // aam wallet

// Naqli blockchain: asli node ke baghair test
const fakeChain = {
  isContract: async (a) => a.toLowerCase() === DRAINER.toLowerCase(),
  getTokenInfo: async () => ({ symbol: "tUSDC", decimals: 6 }),
};

test("decoder pehchanta hai unlimited approve", () => {
  const d = decodeCall(iface.encodeFunctionData("approve", [DRAINER, MaxUint256]));
  assert.equal(d.type, "approve");
  assert.equal(d.unlimited, true);
});

test("decoder: MaxUint256 se thoda kam bhi unlimited hai", () => {
  const d = decodeCall(iface.encodeFunctionData("approve", [DRAINER, MaxUint256 - 12345n]));
  assert.equal(d.unlimited, true);
});

test("unlimited approve -> DANGER", async () => {
  const r = await analyzeTransaction({ to: TOKEN, data: iface.encodeFunctionData("approve", [DRAINER, MaxUint256]) }, fakeChain);
  assert.equal(r.level, "DANGER");
  assert.ok(r.findings.some((f) => f.code === "UNLIMITED_APPROVAL"));
});

test("chhota approve contract ko -> SAFE", async () => {
  const r = await analyzeTransaction({ to: TOKEN, data: iface.encodeFunctionData("approve", [DRAINER, 10_000_000n]) }, fakeChain);
  assert.equal(r.level, "SAFE");
  assert.match(r.summary, /10\.0 tUSDC/);
});

test("aam wallet ko approve -> DANGER (chhota amount bhi)", async () => {
  const r = await analyzeTransaction({ to: TOKEN, data: iface.encodeFunctionData("approve", [WALLET, 1n]) }, fakeChain);
  assert.equal(r.level, "DANGER");
  assert.ok(r.findings.some((f) => f.code === "APPROVAL_TO_EOA"));
});

test("revoke (approve 0) -> SAFE", async () => {
  const r = await analyzeTransaction({ to: TOKEN, data: iface.encodeFunctionData("approve", [DRAINER, 0n]) }, fakeChain);
  assert.equal(r.level, "SAFE");
  assert.ok(r.findings.some((f) => f.code === "REVOKE"));
});

test("setApprovalForAll true -> DANGER", async () => {
  const r = await analyzeTransaction({ to: TOKEN, data: iface.encodeFunctionData("setApprovalForAll", [DRAINER, true]) }, fakeChain);
  assert.equal(r.level, "DANGER");
});

test("anjaan function -> WARNING", async () => {
  const r = await analyzeTransaction({ to: DRAINER, data: "0x4e71d92d" }, fakeChain); // claim()
  assert.equal(r.level, "WARNING");
});
