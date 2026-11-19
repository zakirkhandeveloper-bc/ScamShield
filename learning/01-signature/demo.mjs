import { Wallet, verifyMessage, Interface, MaxUint256, parseUnits, Mnemonic, HDNodeWallet, sha256, wordlists } from "ethers";

const line = (title) => console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);

// ------------------------------------------------------------
line("QADAM 1: Private key banana  [Cyber Security - Cryptography]");
// Private key = ek bahut bada RANDOM number. Bas itna hi.
const meraWallet = Wallet.createRandom();
console.log("Private key (SECRET!):", meraWallet.privateKey);
console.log("Private key length : ", meraWallet.privateKey.length);
console.log("Lambai:", (meraWallet.privateKey.length - 2) / 2, "bytes =", (meraWallet.privateKey.length - 2) * 4, "bits");
console.log("12 words (secret phrase):", meraWallet.mnemonic.phrase);
console.log("NOTE: Yeh sirf demo ki key hai. Asli key KABHI kisi ko mat dikhana.");

// ------------------------------------------------------------
line("QADAM 2: Private key -> Public key -> Address  [Cyber Security]");
console.log("Public key:", meraWallet.signingKey.publicKey.slice(0, 40) + "...");
console.log("Address   :", meraWallet.address);

// Same private key se HAMESHA same address banta hai
const dobara = new Wallet(meraWallet.privateKey);
console.log("\nWahi private key dobara use ki. Address same hai?", dobara.address === meraWallet.address ? "HAAN" : "NAHI");
console.log("Lekin address se private key wapas nikalna? NA-MUMKIN (one-way, rang milane jaisa)");

// ------------------------------------------------------------
line("QADAM 3: Message sign karna  [Cyber Security]");
const paigham1 = "Bob ko 1 ETH bhejo";
const paigham2 = "Bob ko 2 ETH bhejo";
const sig1 = await meraWallet.signMessage(paigham1);
const sig2 = await meraWallet.signMessage(paigham2);
console.log(`Paigham: "${paigham1}"\nSignature: ${sig1}\n`);
console.log(`Paigham: "${paigham2}"\nSignature: ${sig2}\n`);
console.log("Sirf 1 ki jagah 2 likha, aur signature POORA badal gaya!");

// ------------------------------------------------------------
line("QADAM 4: Signature se address wapas nikalna (ecrecover)  [Blockchain Security]");
const nikla = verifyMessage(paigham1, sig1);
console.log("Signature se nikla address:", nikla);
console.log("Asli address              :", meraWallet.address);
console.log("Match?", nikla === meraWallet.address ? "HAAN - yeh asli maalik ka signature hai" : "NAHI");
console.log("Dhyan do: address mila, private key NAHI mili.");

// ------------------------------------------------------------
line("QADAM 5: Chor paigham badal de to?  [Cyber Security - Integrity]");
const badlaHua = "Bob ko 100 ETH bhejo";
const naqli = verifyMessage(badlaHua, sig1); // purana signature, naya paigham
console.log(`Chor ne paigham badla: "${badlaHua}" (signature wahi purana)`);
console.log("Ab nikla address:", naqli);
console.log("Asli maalik se match?", naqli === meraWallet.address ? "HAAN" : "NAHI - pakda gaya! Signature kisi aur paigham ka hai");

// ------------------------------------------------------------
line("QADAM 6: Chor apni key se sign kare to?  [Cyber Security]");
const chor = Wallet.createRandom();
const chorSig = await chor.signMessage(paigham1);
const chorKaNikla = verifyMessage(paigham1, chorSig);
console.log("Chor ka signature se nikla address:", chorKaNikla);
console.log("Kya yeh meraWallet hai?", chorKaNikla === meraWallet.address ? "HAAN" : "NAHI - chor meri jagah sign nahi kar sakta");

// ------------------------------------------------------------
line("QADAM 7: Asli khatra - 'Claim' button ke peeche kya chhupa hai  [Blockchain Security]");
// Chor ko aapki key nahi chahiye. Woh aapse yeh SIGN karwata hai:
const erc20 = new Interface([
  "function approve(address spender, uint256 amount)",
  "function transfer(address to, uint256 amount)",
]);
const data = erc20.encodeFunctionData("approve", [chor.address, MaxUint256]);
console.log('Site kehti hai: "Free Airdrop Claim karo!"');
console.log("Lekin wallet ko jo data jata hai:\n" + data);
console.log("\nAam insaan ko yeh bas ulti seedhi likhai lagti hai. ScamShield isay DECODE karega:");

const decoded = erc20.parseTransaction({ data });
console.log("  Function :", decoded.name, `(selector ${decoded.selector})`);
console.log("  Kisko    :", decoded.args[0], "(chor!)");
console.log("  Kitna    :", decoded.args[1] === MaxUint256 ? "UNLIMITED (saare tokens!)" : decoded.args[1].toString());
console.log("\n  >>> DANGER: Aap ek anjaan address ko apne SAARE tokens lene ki ijazat de rahe ho!");

// Muqabla: ek normal transfer kaisa dikhta hai
const normal = erc20.parseTransaction({ data: erc20.encodeFunctionData("transfer", [chor.address, parseUnits("10", 6)]) });
console.log(`\nMuqable ke liye normal transfer: ${normal.name}(${normal.selector}) -> sirf 10 USDC, ek baar.`);

// ------------------------------------------------------------
line("QADAM 8: 12 words -> Seed -> Private keys  [Cyber Security - BIP-39 / BIP-44]");
const phrase = meraWallet.mnemonic.phrase;
const mnemonic = Mnemonic.fromPhrase(phrase);
console.log("Hamare 12 words:", phrase);

// --- Hissa A: words asal mein ek random number hain ---
const entropyHex = mnemonic.entropy;                                  // 16 bytes = 128 bits
const toBits = (hex) => [...hex.slice(2)].map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
const entropyBits = toBits(entropyHex);
const checksumBits = toBits(sha256(entropyHex)).slice(0, 4);          // hash ke pehle 4 bits
const allBits = entropyBits + checksumBits;                           // 132 bits
console.log("\n[A] Random number (entropy):", entropyHex, `(${entropyBits.length} bits)`);
console.log("    Checksum (SHA-256 ke pehle 4 bits):", checksumBits, `-> kul ${allBits.length} bits`);
console.log("    132 bits ko 11-11 ke 12 tukdon mein kaata. Har tukda = list (2048 words) ka ek number:");
const words = phrase.split(" ");
for (let i = 0; i < 12; i++) {
  const chunk = allBits.slice(i * 11, i * 11 + 11);
  const num = parseInt(chunk, 2);
  const listWord = wordlists.en.getWord(num);
  console.log(`    Tukda ${String(i + 1).padStart(2)}: ${chunk} = ${String(num).padStart(4)} -> "${listWord}"`, listWord === words[i] ? "OK" : "GALAT");
}

// --- Hissa B: words -> seed (PBKDF2, 2048 rounds) ---
const seed = mnemonic.computeSeed();
console.log("\n[B] Words -> PBKDF2 (2048 dafa) -> Seed (64 bytes):");
console.log("    " + seed.slice(0, 66) + "...");

// --- Hissa C: seed -> darakht -> account 1, 2, 3 ---
console.log("\n[C] Seed se darakht (HD tree). Har path = alag private key = alag account:");
for (let i = 0; i < 3; i++) {
  const path = `m/44'/60'/0'/0/${i}`;
  const acc = HDNodeWallet.fromPhrase(phrase, "", path);
  console.log(`    Account ${i + 1}  path ${path}`);
  console.log(`      Private key: ${acc.privateKey}`);
  console.log(`      Address    : ${acc.address}`);
}
const pehla = HDNodeWallet.fromPhrase(phrase, "", "m/44'/60'/0'/0/0");
console.log("\n    Account 1 wahi hai jo Qadam 1 mein bana tha?", pehla.privateKey === meraWallet.privateKey ? "HAAN" : "NAHI");

// --- Hissa D: restore - naya phone, wahi words ---
console.log("\n[D] Phone gum ho gaya. Naye phone pe SIRF 12 words daale:");
const restored = HDNodeWallet.fromPhrase(phrase);
console.log("    Wapas mila address:", restored.address, restored.address === meraWallet.address ? "-> WALLET WAPAS MIL GAYA" : "-> nahi mila");

// --- Hissa E: ek word galat likha to? (checksum) ---
const galatWords = [...words];
galatWords[11] = words[11] === "abandon" ? "zoo" : "abandon";        // aakhri word badal diya
console.log(`\n[E] Aakhri word "${words[11]}" ki jagah "${galatWords[11]}" likh diya:`);
if (Mnemonic.isValidMnemonic(galatWords.join(" "))) {
  console.log("    Phrase valid hai? HAAN - itefaq se checksum mil gaya (4 bits = har 16 mein se 1 baar hota hai)");
  console.log("    Lekin yeh wallet khula:", HDNodeWallet.fromPhrase(galatWords.join(" ")).address);
  console.log("    Asli wallet tha      :", meraWallet.address, "-> BILKUL ALAG, khaali wallet!");
} else {
  console.log("    Phrase valid hai? NAHI - checksum ne galti pakad li!");
}

// --- Hissa F: 11 words chor ke paas hon to? ---
let milay = 0;
let mila = null;
for (let n = 0; n < 2048; n++) {
  const koshish = [...words.slice(0, 11), wordlists.en.getWord(n)].join(" ");
  if (!Mnemonic.isValidMnemonic(koshish)) continue;                   // checksum se zyada tar foran rad
  milay++;
  if (HDNodeWallet.fromPhrase(koshish).address === meraWallet.address) mila = wordlists.en.getWord(n);
}
console.log(`\n[F] Chor ke paas 11 words hain. Aakhri word ke 2048 options try kiye:`);
console.log(`    Checksum ke baad sirf ${milay} options bache. Sahi word mila: "${mila}"`);
console.log("    Sabaq: phrase ka EK hissa bhi leak karna khatarnak hai!");

console.log("\nDemo khatam. Yahi decoding ScamShield ki buniyaad banegi.\n");
