const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));

const fromBase64 = (base64) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export async function deriveKey(password, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: textEncoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptField(cryptoKey, plaintext) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    textEncoder.encode(plaintext)
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
  };
}

export async function decryptField(cryptoKey, ciphertextBase64, ivBase64) {
  const ciphertext = fromBase64(ciphertextBase64);
  const iv = fromBase64(ivBase64);
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );
  return textDecoder.decode(plaintext);
}

export async function encryptEmployee(cryptoKey, { name, email, position }) {
  const nameResult = await encryptField(cryptoKey, name);
  const emailResult = await encryptField(cryptoKey, email);
  const positionResult = await encryptField(cryptoKey, position);

  return {
    name_enc: nameResult.ciphertext,
    name_iv: nameResult.iv,
    email_enc: emailResult.ciphertext,
    email_iv: emailResult.iv,
    position_enc: positionResult.ciphertext,
    position_iv: positionResult.iv,
  };
}
