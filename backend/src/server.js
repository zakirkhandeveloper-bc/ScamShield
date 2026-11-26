import express from "express";
import { fileURLToPath } from "node:url";
import { isAddress } from "ethers";
import { createChain } from "./chain.js";
import { analyzeTransaction } from "./risk.js";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const PORT = Number(process.env.PORT ?? 3001);

const chain = createChain(RPC_URL);
const app = express();
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));

app.get("/health", (_req, res) => res.json({ ok: true, rpc: RPC_URL }));

app.post("/api/analyze", async (req, res) => {
  const { from, to, data, value } = req.body ?? {};

  if (!isAddress(to)) return res.status(400).json({ error: "'to' must be a valid address" });
  if (from !== undefined && !isAddress(from)) return res.status(400).json({ error: "'from' must be a valid address" });
  if (data !== undefined && !/^0x([0-9a-fA-F]{2})*$/.test(data)) {
    return res.status(400).json({ error: "'data' must be hex" });
  }

  try {
    res.json(await analyzeTransaction({ from, to, data, value }, chain));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach the blockchain node" });
  }
});

app.listen(PORT, () => console.log(`ScamShield backend on http://localhost:${PORT} (RPC ${RPC_URL})`));
