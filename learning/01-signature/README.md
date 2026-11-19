# Lesson 1: Private Key, Address aur Signature

Chalane ke liye:
```
npm install
node demo.mjs
```

| Qadam | Kya seekha | Topic |
|---|---|---|
| 1 | Private key ek bada random number hai | 🛡️ Cyber Security (Cryptography) |
| 2 | Private key → public key → address (one-way) | 🛡️ Cyber Security |
| 3 | Paigham badle to signature poora badal jata hai | 🛡️ Cyber Security |
| 4 | Signature se address wapas milta hai (`ecrecover`), key nahi | 🔗 Blockchain Security |
| 5 | Paigham badalne wala pakda jata hai (integrity) | 🛡️ Cyber Security |
| 6 | Chor aapki jagah sign nahi kar sakta | 🛡️ Cyber Security |
| 7 | Asli khatra: "Claim" ke peeche `approve(chor, unlimited)` | 🔗 Blockchain Security |
| 8 | 12 words → seed (PBKDF2) → HD tree → private keys; checksum; 11 words leak ho to aakhri word minto mein mil jata hai | 🛡️ Cyber Security (BIP-39 / BIP-44) |

**Sabaq:** chor aapki key nahi todta, woh aapse ghalat cheez **sign karwata** hai. ScamShield transaction ka `data` decode karke asal sach dikhata hai.
