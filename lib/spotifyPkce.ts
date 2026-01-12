import crypto from "crypto";

export function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomString(bytes = 32) {
  return base64UrlEncode(crypto.randomBytes(bytes));
}

export function sha256Base64Url(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest();
  return base64UrlEncode(hash);
}
