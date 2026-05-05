import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import type { Response } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "./logger";

export interface ListedObject {
  name: string;
  size: number;
  modified: Date;
}

export interface SendOptions {
  contentType?: string;
  inline?: boolean;
}

export interface StorageAdapter {
  readonly kind: "local" | "s3";
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  delete(key: string): Promise<boolean>;
  /** List file objects directly under `prefix`. Empty string lists the root. */
  list(prefix: string): Promise<ListedObject[]>;
  /** List immediate sub-prefix names (a.k.a. "directories") under `prefix`. */
  listCommonPrefixes(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  send(res: Response, key: string, opts?: SendOptions): Promise<boolean>;
}

function sanitizeKey(key: string): string {
  const cleaned = key.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (cleaned === "") return "";
  if (cleaned.split("/").some((part) => part === ".." || part === "")) {
    throw new Error(`Ongeldig storage-pad: ${key}`);
  }
  return cleaned;
}

class LocalFsAdapter implements StorageAdapter {
  readonly kind = "local" as const;

  constructor(private readonly baseDir: string) {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  private resolve(key: string): string {
    const safe = sanitizeKey(key);
    const full = safe === "" ? this.baseDir : path.join(this.baseDir, safe);
    const resolved = path.resolve(full);
    const root = path.resolve(this.baseDir);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error(`Pad buiten storage-root: ${key}`);
    }
    return resolved;
  }

  async listCommonPrefixes(prefix: string): Promise<string[]> {
    const dir = this.resolve(prefix);
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch (err: any) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }

  async put(key: string, body: Buffer, _contentType?: string): Promise<void> {
    const filePath = this.resolve(key);
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, body);
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.resolve(key);
    try {
      await fsp.unlink(filePath);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") return false;
      throw err;
    }
  }

  async list(prefix: string): Promise<ListedObject[]> {
    const dir = this.resolve(prefix);
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      const results: ListedObject[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const stat = await fsp.stat(path.join(dir, entry.name));
        results.push({ name: entry.name, size: stat.size, modified: stat.mtime });
      }
      return results;
    } catch (err: any) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsp.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async send(res: Response, key: string, opts?: SendOptions): Promise<boolean> {
    let filePath: string;
    try {
      filePath = this.resolve(key);
    } catch {
      return false;
    }
    if (!fs.existsSync(filePath)) return false;
    if (opts?.contentType) res.setHeader("Content-Type", opts.contentType);
    if (opts?.inline) {
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
    }
    return await new Promise<boolean>((resolve, reject) => {
      res.sendFile(filePath, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

class S3Adapter implements StorageAdapter {
  readonly kind = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;
  private readonly presignTtlSeconds: number;

  constructor(config: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle?: boolean;
    publicBaseUrl?: string;
    presignTtlSeconds?: number;
  }) {
    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl;
    this.presignTtlSeconds = config.presignTtlSeconds ?? 3600;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? !!config.endpoint,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  async put(key: string, body: Buffer, contentType?: string): Promise<void> {
    const safe = sanitizeKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safe,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<boolean> {
    const safe = sanitizeKey(key);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: safe }),
      );
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      throw err;
    }
  }

  async list(prefix: string): Promise<ListedObject[]> {
    const safe = sanitizeKey(prefix);
    const normalized = safe === "" ? "" : safe.endsWith("/") ? safe : `${safe}/`;
    const results: ListedObject[] = [];
    let continuationToken: string | undefined;
    do {
      const resp = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalized || undefined,
          Delimiter: "/",
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of resp.Contents ?? []) {
        if (!obj.Key) continue;
        const name = obj.Key.slice(normalized.length);
        if (!name) continue;
        results.push({
          name,
          size: obj.Size ?? 0,
          modified: obj.LastModified ?? new Date(0),
        });
      }
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (continuationToken);
    return results;
  }

  async listCommonPrefixes(prefix: string): Promise<string[]> {
    const safe = sanitizeKey(prefix);
    const normalized = safe === "" ? "" : safe.endsWith("/") ? safe : `${safe}/`;
    const out: string[] = [];
    let continuationToken: string | undefined;
    do {
      const resp = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalized || undefined,
          Delimiter: "/",
          ContinuationToken: continuationToken,
        }),
      );
      for (const cp of resp.CommonPrefixes ?? []) {
        if (!cp.Prefix) continue;
        const name = cp.Prefix.slice(normalized.length).replace(/\/$/, "");
        if (name) out.push(name);
      }
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (continuationToken);
    return out;
  }

  async exists(key: string): Promise<boolean> {
    const safe = sanitizeKey(key);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: safe }),
      );
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      if (err?.name === "NotFound" || err?.name === "NoSuchKey") return false;
      throw err;
    }
  }

  async send(res: Response, key: string, opts?: SendOptions): Promise<boolean> {
    let safe: string;
    try {
      safe = sanitizeKey(key);
    } catch {
      return false;
    }
    if (this.publicBaseUrl) {
      const target = `${this.publicBaseUrl.replace(/\/+$/, "")}/${safe}`;
      res.redirect(302, target);
      return true;
    }
    try {
      const cmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: safe,
        ResponseContentType: opts?.contentType,
        ResponseContentDisposition: opts?.inline ? "inline" : undefined,
      });
      const url = await getSignedUrl(this.client, cmd, {
        expiresIn: this.presignTtlSeconds,
      });
      res.redirect(302, url);
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      throw err;
    }
  }
}

let cached: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (cached) return cached;
  const bucket = process.env.S3_BUCKET;
  if (bucket) {
    const region = process.env.S3_REGION || "auto";
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
    const ttl = Number.parseInt(process.env.S3_PRESIGN_TTL_SECONDS || "3600", 10);
    cached = new S3Adapter({
      bucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicBaseUrl,
      forcePathStyle,
      presignTtlSeconds: Number.isFinite(ttl) ? ttl : 3600,
    });
    logger.info(
      { bucket, region, endpoint: endpoint ?? null, hasPublicBase: !!publicBaseUrl },
      "Storage backend: S3",
    );
  } else {
    // Resolve a deterministic uploads directory. Operators can force a path
    // with UPLOADS_DIR (absolute or relative to cwd). Without it we pick
    // the canonical `artifacts/api-server/uploads`, working both when cwd
    // is the repo root (production per DEPLOY.md) and when cwd is the
    // api-server artifact directory (local dev workflow).
    const override = process.env.UPLOADS_DIR;
    let baseDir: string;
    if (override) {
      baseDir = path.isAbsolute(override)
        ? override
        : path.resolve(process.cwd(), override);
    } else {
      const fromRepoRoot = path.resolve(
        process.cwd(),
        "artifacts/api-server/uploads",
      );
      const fromArtifactDir = path.resolve(process.cwd(), "uploads");
      const cwdEndsInArtifact = process
        .cwd()
        .replace(/\\/g, "/")
        .endsWith("/artifacts/api-server");
      baseDir = cwdEndsInArtifact ? fromArtifactDir : fromRepoRoot;
    }
    cached = new LocalFsAdapter(baseDir);
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        { baseDir },
        "Storage backend: lokale schijf. Stel S3_BUCKET in voor cloud storage. Bestanden gaan verloren bij redeploy op hosters zonder persistente schijf.",
      );
    } else {
      logger.info({ baseDir }, "Storage backend: lokale schijf");
    }
  }
  return cached;
}

export function makeUploadFilename(originalName: string): string {
  const safe = (originalName || "bestand").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`;
}

export function sanitizeOriginalFilename(originalName: string): string {
  return (originalName || "bestand").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export interface UploadedMulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export async function persistUpload(
  prefix: string,
  file: UploadedMulterFile,
  opts?: { fixedName?: string; useOriginalName?: boolean },
): Promise<string> {
  let filename: string;
  if (opts?.fixedName) {
    filename = opts.fixedName;
  } else if (opts?.useOriginalName) {
    filename = sanitizeOriginalFilename(file.originalname);
  } else {
    filename = makeUploadFilename(file.originalname);
  }
  const adapter = getStorageAdapter();
  await adapter.put(`${prefix}/${filename}`, file.buffer, file.mimetype);
  return filename;
}
