const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const SALT = "hermes-organization-salt-v1";


export const DEFAULT_MASTER_SECRET = "HERMES-MVP-MASTER-KEY";

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

const fromBase64 = (base64) =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

export async function deriveKey(masterSecret = DEFAULT_MASTER_SECRET) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(masterSecret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: textEncoder.encode(SALT),
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptEmployee(cryptoKey, employee) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    textEncoder.encode(JSON.stringify(employee))
  );

  return {
    encrypted_data: toBase64(ciphertext),
    iv: toBase64(iv),
  };
}

export async function decryptEmployee(cryptoKey, encryptedData, ivBase64) {
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivBase64) },
    cryptoKey,
    fromBase64(encryptedData)
  );
  return JSON.parse(textDecoder.decode(plaintext));
}
