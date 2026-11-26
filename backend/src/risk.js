// Risk engine: decode + blockchain checks -> SAFE / WARNING / DANGER
import { decodeCall } from "./decoder.js";
import { formatAmount } from "./chain.js";

const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

/**
 * @param {{ from?: string, to: string, data?: string, value?: string }} tx
 * @param {{ isContract: (a:string)=>Promise<boolean>, getTokenInfo: (a:string)=>Promise<any> }} chain
 */
export async function analyzeTransaction(tx, chain) {
  const call = decodeCall(tx.data);
  const findings = [];
  const add = (severity, code, message) => findings.push({ severity, code, message });

  let summary = "Unknown action";

  if (call.type === "approve" || call.type === "increaseAllowance") {
    const token = await chain.getTokenInfo(tx.to);
    const tokenName = token?.symbol ?? short(tx.to);
    const spenderIsContract = await chain.isContract(call.spender);

    if (call.amount === 0n) {
      summary = `Revoke ${tokenName} approval for ${short(call.spender)}`;
      add("info", "REVOKE", "This removes an approval. This is safe.");
    } else {
      const amountText = call.unlimited ? "UNLIMITED" : formatAmount(call.amount, token);
      summary = call.unlimited
        ? `Allow ${short(call.spender)} to spend UNLIMITED ${tokenName}`
        : `Allow ${short(call.spender)} to spend ${amountText}`;

      if (call.unlimited) {
        add("high", "UNLIMITED_APPROVAL",
          `You are giving ${short(call.spender)} permission to take ALL your ${tokenName}, now and in the future.`);
      } else {
        add("low", "LIMITED_APPROVAL", `Spender can take up to ${amountText}.`);
      }

      if (!spenderIsContract) {
        add("high", "APPROVAL_TO_EOA",
          "The spender is a personal wallet, not a contract. Real apps almost never ask this. Likely a scam.");
      }
    }
  } else if (call.type === "setApprovalForAll") {
    const spenderIsContract = await chain.isContract(call.spender);
    if (call.approved) {
      summary = `Give ${short(call.spender)} control of ALL your NFTs in this collection`;
      add("high", "NFT_APPROVAL_FOR_ALL",
        "This gives full control of every NFT in this collection. Common in NFT drainer scams.");
      if (!spenderIsContract) {
        add("high", "APPROVAL_TO_EOA", "The operator is a personal wallet, not a marketplace contract.");
      }
    } else {
      summary = `Revoke NFT approval for ${short(call.spender)}`;
      add("info", "REVOKE", "This removes an approval. This is safe.");
    }
  } else if (call.type === "transfer") {
    const token = await chain.getTokenInfo(tx.to);
    summary = `Send ${formatAmount(call.amount, token)} to ${short(call.to)}`;
    add("info", "TOKEN_TRANSFER", "Direct token transfer. Double-check the recipient address.");
  } else if (call.type === "transferFrom") {
    summary = `Move tokens from ${short(call.from)} to ${short(call.to)}`;
    if (tx.from && call.from.toLowerCase() === tx.from.toLowerCase() && call.to.toLowerCase() !== tx.from.toLowerCase()) {
      add("medium", "TRANSFER_FROM_SELF", "Tokens leave your wallet through transferFrom.");
    }
  } else if (call.type === "native") {
    summary = `Send ${tx.value ?? "0"} wei of ETH to ${short(tx.to)}`;
    add("info", "NATIVE_TRANSFER", "Plain ETH transfer.");
  } else {
    summary = `Call unknown function ${call.selector} on ${short(tx.to)}`;
    add("medium", "UNKNOWN_FUNCTION",
      "We could not recognise this action. Only continue if you trust this website.");
  }

  return { level: levelOf(findings), summary, decoded: serialise(call), findings };
}

function levelOf(findings) {
  if (findings.some((f) => f.severity === "high")) return "DANGER";
  if (findings.some((f) => f.severity === "medium")) return "WARNING";
  return "SAFE";
}

// BigInt JSON mein nahi jata, is liye string bana do
function serialise(call) {
  return Object.fromEntries(Object.entries(call).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]));
}
