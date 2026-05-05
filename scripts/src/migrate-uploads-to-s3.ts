import path from "path";
import { promises as fsp } from "fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

interface CliOptions {
  source: string;
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
  dryRun: boolean;
  skipExisting: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq >= 0) {
        args.set(arg.slice(2, eq), arg.slice(eq + 1));
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          args.set(arg.slice(2), next);
          i++;
        } else {
          flags.add(arg.slice(2));
        }
      }
    }
  }
  const env = process.env;
  const source =
    args.get("source") ??
    env.UPLOADS_DIR ??
    path.resolve(process.cwd(), "artifacts/api-server/uploads");
  const bucket = args.get("bucket") ?? env.S3_BUCKET ?? "";
  if (!bucket) {
    throw new Error(
      "Bucket niet opgegeven. Gebruik --bucket=<naam> of stel S3_BUCKET in.",
    );
  }
  return {
    source: path.resolve(source),
    bucket,
    region: args.get("region") ?? env.S3_REGION ?? "auto",
    endpoint: args.get("endpoint") ?? env.S3_ENDPOINT,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle:
      (args.get("force-path-style") ?? env.S3_FORCE_PATH_STYLE) === "true",
    dryRun: flags.has("dry-run"),
    skipExisting: !flags.has("overwrite"),
  };
}

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
};

async function* walk(dir: string, root: string): AsyncGenerator<{ abs: string; key: string }> {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (err: any) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(abs, root);
    } else if (entry.isFile()) {
      const key = path.relative(root, abs).split(path.sep).join("/");
      yield { abs, key };
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  console.log(`Bron       : ${opts.source}`);
  console.log(`Bucket     : ${opts.bucket}`);
  console.log(`Region     : ${opts.region}`);
  if (opts.endpoint) console.log(`Endpoint   : ${opts.endpoint}`);
  console.log(`Dry run    : ${opts.dryRun ? "ja" : "nee"}`);
  console.log(`Skip exist.: ${opts.skipExisting ? "ja" : "nee (overschrijven)"}`);

  try {
    const stat = await fsp.stat(opts.source);
    if (!stat.isDirectory()) {
      throw new Error(`Bron is geen directory: ${opts.source}`);
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.log("Bron-directory bestaat niet — niets te migreren.");
      return;
    }
    throw err;
  }

  const client = new S3Client({
    region: opts.region,
    endpoint: opts.endpoint,
    forcePathStyle: opts.forcePathStyle || !!opts.endpoint,
    credentials:
      opts.accessKeyId && opts.secretAccessKey
        ? {
            accessKeyId: opts.accessKeyId,
            secretAccessKey: opts.secretAccessKey,
          }
        : undefined,
  });

  let uploaded = 0;
  let skipped = 0;
  let bytes = 0;
  let errors = 0;

  for await (const { abs, key } of walk(opts.source, opts.source)) {
    try {
      if (opts.skipExisting && !opts.dryRun) {
        try {
          await client.send(new HeadObjectCommand({ Bucket: opts.bucket, Key: key }));
          skipped++;
          console.log(`SKIP   ${key}`);
          continue;
        } catch (err: any) {
          if (err?.$metadata?.httpStatusCode !== 404 && err?.name !== "NotFound") {
            throw err;
          }
        }
      }
      const body = await fsp.readFile(abs);
      const ext = path.extname(key).toLowerCase();
      const contentType = MIME_BY_EXT[ext];
      if (opts.dryRun) {
        console.log(`DRY    ${key}  (${body.length} bytes)`);
      } else {
        await client.send(
          new PutObjectCommand({
            Bucket: opts.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
        console.log(`UPLOAD ${key}  (${body.length} bytes)`);
      }
      uploaded++;
      bytes += body.length;
    } catch (err: any) {
      errors++;
      console.error(`FOUT   ${key}: ${err?.message || err}`);
    }
  }

  console.log("---");
  console.log(`Geüpload : ${uploaded}`);
  console.log(`Overgeslagen: ${skipped}`);
  console.log(`Bytes    : ${bytes}`);
  console.log(`Fouten   : ${errors}`);
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
