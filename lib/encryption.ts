// lib/encryption.ts

/**
 * AES-256-GCM encryption for Google OAuth tokens stored in the database.
 *
 * Why AES-256-GCM:
 * - Authenticated encryption — detects tampering (GCM authentication tag)
 * - 256-bit key — exceeds NIST recommendation for long-term secret protection
 * - Random 12-byte IV per encryption — no nonce reuse with same key
 *
 * Storage format (base64-encoded, colon-delimited):
 *   <iv_hex>:<ciphertext_hex>:<authTag_hex>
 *
 * The ENCRYPTION_KEY env var must be a base64-encoded 32-byte value.
 * Generate with: openssl rand -base64 32
 */

import { gcm } from "@noble/ciphers/aes";
import { randomBytes } from "@noble/ciphers/webcrypto";

function getKey(): Uint8Array {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}). ` +
        "Re-generate with: openssl rand -base64 32"
    );
  }
  return new Uint8Array(key);
}

/**
 * Encrypt a plaintext string.
 * Returns a storable string in the format: <iv_hex>:<ciphertext_hex>:<tag_hex>
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV — standard for GCM
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const cipher = gcm(key, iv);
  const encrypted = cipher.encrypt(data);

  // @noble/ciphers appends the 16-byte auth tag to the ciphertext
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);

  const ivHex = Buffer.from(iv).toString("hex");
  const ctHex = Buffer.from(ciphertext).toString("hex");
  const tagHex = Buffer.from(tag).toString("hex");

  return `${ivHex}:${ctHex}:${tagHex}`;
}

/**
 * Decrypt a string produced by encrypt().
 * Throws if the authentication tag is invalid (tampered data).
 */
export function decrypt(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format.");
  }

  const [ivHex, ctHex, tagHex] = parts as [string, string, string];

  const key = getKey();
  const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
  const ciphertext = Buffer.from(ctHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  // Reattach the auth tag for @noble/ciphers GCM decryption
  const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(tag, ciphertext.length);

  const cipher = gcm(key, iv);
  const decrypted = cipher.decrypt(ciphertextWithTag);

  return new TextDecoder().decode(decrypted);
}

/**
 * Safely attempt decryption — returns null on any failure.
 * Use when the absence of a token is recoverable (e.g., calendar not connected).
 */
export function safeDecrypt(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    return decrypt(stored);
  } catch {
    return null;
  }
}