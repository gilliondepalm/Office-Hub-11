import http from "http";
import path from "path";
import app from "./app";
import { logger } from "./lib/logger";
import { registerRoutes } from "./routes/routes";
import { serveStatic } from "./static";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = http.createServer(app);

registerRoutes(httpServer, app)
  .then(() => {
    const webDir = process.env["SERVE_WEB_DIR"];
    if (webDir) {
      const resolvedWebDir = path.isAbsolute(webDir)
        ? webDir
        : path.resolve(process.cwd(), webDir);
      serveStatic(app, resolvedWebDir);
      logger.info({ webDir: resolvedWebDir }, "Web app static files served");
    }

    httpServer.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to register routes");
    process.exit(1);
  });
