// Build-time tool. Run by hand to regenerate public/models/character.enc
// from the source .glb:  node scripts/encrypt-model.cjs
//
// Do NOT move this back into public/. Everything under public/ is copied
// verbatim into dist/ and served, and this file carries the encryption
// password as a literal, so living there published the key at
// /models/encrypt.cjs for anyone to read.
//
// Note the password is also bundled into the client (character.ts passes
// it to decryptFile), because the browser has to decrypt the model. The
// .enc wrapper therefore deters casual copying only; it is not a secret.
const crypto = require("crypto");
const fs = require("fs");

const encryptFile = (inputFile, outputFile, password) => {
  const key = crypto.createHash("sha256").update(password).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  output.write(iv);
  input.pipe(cipher).pipe(output);
};

encryptFile("character.glb", "character.enc", "Character3D#@");
