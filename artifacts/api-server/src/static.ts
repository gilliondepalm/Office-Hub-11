import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express, distPath: string) {
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `SERVE_WEB_DIR='${distPath}' bestaat niet. Bouw eerst de web-app: pnpm --filter @workspace/office-hub run build`,
    );
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for any non-API GET that wasn't matched.
  app.use("/{*path}", (req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    if (req.path === "/uploads" || req.path.startsWith("/uploads/")) return next();
    if (req.path === "/PDF" || req.path.startsWith("/PDF/")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
