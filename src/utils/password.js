import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(plain, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const derived = await scryptAsync(plain, salt, 64);
  const storedBuf = Buffer.from(hashHex, "hex");
  const derivedBuf = Buffer.from(derived);
  if (storedBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(storedBuf, derivedBuf);
}
