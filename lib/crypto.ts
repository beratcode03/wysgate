import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const KDF_ROUNDS = 4800;

function bytesToUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function hexToText(value: string): string {
  return new TextDecoder().decode(hexToBytes(value));
}

async function sha256Hex(value: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

/**
 * A memory-hard KDF such as Argon2id should be supplied by a native build.
 * Expo Go does not expose one consistently, so the first build uses a salted,
 * repeated SHA-256 derivation and keeps the resulting key only in memory.
 */
export async function deriveKey(password: string, salt: string) {
  let state = await sha256Hex(`${salt}:${password}`);
  for (let index = 0; index < KDF_ROUNDS; index += 1) {
    state = await sha256Hex(`${state}:${salt}:${password}`);
  }
  return hexToBytes(state);
}

export async function createSalt() {
  return bytesToHex(await Crypto.getRandomBytesAsync(16));
}

export function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function createVerifier(password: string, salt: string) {
  return bytesToHex(await deriveKey(password, salt));
}

export async function encryptVault(value: string, key: Uint8Array) {
  const nonce = await Crypto.getRandomBytesAsync(12);
  const encrypted = gcm(key, nonce).encrypt(bytesToUtf8(value));
  return `${bytesToHex(nonce)}.${bytesToHex(encrypted)}`;
}

export function decryptVault(blob: string, key: Uint8Array) {
  const [nonceHex, payloadHex] = blob.split('.');
  if (!nonceHex || !payloadHex) throw new Error('Bozuk kasa verisi');
  const decrypted = gcm(key, hexToBytes(nonceHex)).decrypt(hexToBytes(payloadHex));
  return new TextDecoder().decode(decrypted);
}