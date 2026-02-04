import crypto from "crypto";

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateToken(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}
