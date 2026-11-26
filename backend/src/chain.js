// Chain helpers: blockchain se sawal poochna (RPC ke zariye)
import { JsonRpcProvider, Contract, formatUnits } from "ethers";

const erc20 = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export function createChain(rpcUrl) {
  const provider = new JsonRpcProvider(rpcUrl);

  return {
    // Address pe code hai? -> contract. Code nahi -> aam wallet (EOA)
    async isContract(address) {
      const code = await provider.getCode(address);
      return code !== "0x";
    },

    // Token ka naam aur decimals, taake "1000000000" ko "1000 tUSDC" dikha sakein
    async getTokenInfo(address) {
      try {
        const c = new Contract(address, erc20, provider);
        const [symbol, decimals] = await Promise.all([c.symbol(), c.decimals()]);
        return { symbol, decimals: Number(decimals) };
      } catch {
        return null; // token nahi hai, ya functions nahi hain
      }
    },
  };
}

export function formatAmount(amount, token) {
  if (!token) return amount.toString();
  return `${formatUnits(amount, token.decimals)} ${token.symbol}`;
}
