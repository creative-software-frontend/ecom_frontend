import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { IS_PRODUCTION, JWT_SECRET } from "../config/env.js";

/* ================================================================
   AES-256-GCM for courier credentials at rest.

   Payload format: v1:<iv_b64>:<tag_b64>:<cipher_b64>
   The key is either an explicit 32-byte base64 / 64-char hex key
   (required in production) or a deterministic dev/test fallback
   derived from JWT_SECRET. Nothing here logs key material or secrets.
   ================================================================ */

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const configured = process.env.COURIER_ENCRYPTION_KEY?.trim();
  if (configured) {
    let key: Buffer;
    if (/^[0-9a-fA-F]{64}$/.test(configured)) {
      key = Buffer.from(configured, "hex");
    } else {
      key = Buffer.from(configured, "base64");
      if (key.length !== KEY_BYTES) {
        throw new Error(
          "COURIER_ENCRYPTION_KEY must be a base64-encoded 32-byte key or a 64-character hex key",
        );
      }
    }
    cachedKey = key;
    return key;
  }

  if (IS_PRODUCTION) {
    throw new Error("COURIER_ENCRYPTION_KEY is required in production");
  }

  // Local dev/test only: deterministic fallback so no .env edit is needed.
  cachedKey = createHash("sha256").update(JWT_SECRET, "utf8").digest();
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return [
    VERSION,
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  const [version, ivPart, tagPart, cipherPart] = parts;
  if (
    parts.length !== 4 ||
    version !== VERSION ||
    !ivPart ||
    !tagPart ||
    !cipherPart
  ) {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(ivPart, "base64");
  const tag = Buffer.from(tagPart, "base64");
  const ciphertext = Buffer.from(cipherPart, "base64");
  if (
    iv.length !== IV_BYTES ||
    tag.length !== TAG_BYTES ||
    ciphertext.length === 0
  ) {
    throw new Error("Invalid encrypted secret format");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** Masked preview only — never returns the raw or decrypted secret. */
export function maskSecret(
  encryptedOrNull: string | null,
): { isSet: boolean; preview: string | null } {
  if (!encryptedOrNull) return { isSet: false, preview: null };

  try {
    const plain = decryptSecret(encryptedOrNull);
    return {
      isSet: true,
      preview: plain.length >= 8 ? `••••${plain.slice(-4)}` : "••••••••",
    };
  } catch {
    // Treat unreadable/foreign ciphertext as set without exposing any bytes.
    return { isSet: true, preview: "••••••••" };
  }
}
