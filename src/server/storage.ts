import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";

/**
 * Upload storage boundary. The local driver writes to public/uploads (development / single server).
 * An S3-compatible driver can implement the same interface for production.
 * Files are validated by size and magic bytes, never by the client-supplied name or MIME type.
 */
const KINDS = {
  image: { max: 5 * 1024 * 1024, types: [{ ext: "jpg", sig: [0xff, 0xd8, 0xff] }, { ext: "png", sig: [0x89, 0x50, 0x4e, 0x47] }, { ext: "webp", sig: [0x52, 0x49, 0x46, 0x46], extra: (b: Buffer) => b.subarray(8, 12).toString() === "WEBP" }] },
  pdf: { max: 10 * 1024 * 1024, types: [{ ext: "pdf", sig: [0x25, 0x50, 0x44, 0x46] }] },
} as const;

export class UploadError extends Error {}

export async function storeUpload(file: File, kind: keyof typeof KINDS): Promise<string> {
  const spec = KINDS[kind];
  if (!file || file.size === 0) throw new UploadError("No file selected");
  if (file.size > spec.max) throw new UploadError(`File is larger than ${spec.max / 1024 / 1024} MB`);
  const buf = Buffer.from(await file.arrayBuffer());
  const match = spec.types.find((t) => t.sig.every((byte, i) => buf[i] === byte) && (!("extra" in t) || t.extra(buf)));
  if (!match) throw new UploadError(kind === "pdf" ? "Only PDF files are allowed" : "Only JPEG, PNG or WebP images are allowed");
  switch (env.STORAGE_DRIVER) {
    case "local":
    default: {
      const now = new Date();
      const dir = path.join(process.cwd(), "public", "uploads", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
      await mkdir(dir, { recursive: true });
      const name = `${randomToken(12)}.${match.ext}`;
      await writeFile(path.join(dir, name), buf);
      return `/uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${name}`;
    }
  }
}
