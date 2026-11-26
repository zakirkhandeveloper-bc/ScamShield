// Decoder: transaction ka "data" khol ke batata hai ke yeh KYA kar raha hai.
// [Blockchain] data ke pehle 4 bytes = function selector (e.g. 0x095ea7b3 = approve)
import { Interface, MaxUint256 } from "ethers";

const iface = new Interface([
  "function approve(address spender, uint256 amount)",
  "function increaseAllowance(address spender, uint256 addedValue)",
  "function setApprovalForAll(address operator, bool approved)",
  "function transfer(address to, uint256 amount)",
  "function transferFrom(address from, address to, uint256 amount)",
]);

// Itna bada amount = asal mein "unlimited". Drainers kabhi kabhi MaxUint256 se
// thoda kam number bhejte hain taake simple "== MaxUint256" check bach jaye.
export const UNLIMITED_THRESHOLD = MaxUint256 / 2n;

/**
 * @param {string} data  transaction ka data field (hex)
 * @returns {{ type: string, selector?: string, spender?: string, amount?: bigint,
 *             unlimited?: boolean, approved?: boolean, to?: string, from?: string }}
 */
export function decodeCall(data) {
  if (!data || data === "0x") return { type: "native" }; // sirf ETH bhejna, koi function nahi

  const selector = data.slice(0, 10).toLowerCase();
  let parsed;
  try {
    parsed = iface.parseTransaction({ data });
  } catch {
    parsed = null;
  }
  if (!parsed) return { type: "unknown", selector };

  const a = parsed.args;
  switch (parsed.name) {
    case "approve":
    case "increaseAllowance":
      return {
        type: parsed.name,
        selector,
        spender: a[0],
        amount: a[1],
        unlimited: a[1] >= UNLIMITED_THRESHOLD,
      };
    case "setApprovalForAll":
      return { type: "setApprovalForAll", selector, spender: a[0], approved: a[1] };
    case "transfer":
      return { type: "transfer", selector, to: a[0], amount: a[1] };
    case "transferFrom":
      return { type: "transferFrom", selector, from: a[0], to: a[1], amount: a[2] };
    default:
      return { type: "unknown", selector };
  }
}
