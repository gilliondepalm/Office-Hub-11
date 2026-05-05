import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const isProductionEnv = process.env["NODE_ENV"] === "production";
const rawAllowedOrigins = process.env["CORS_ALLOWED_ORIGINS"];
const allowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

if (isProductionEnv && (!allowedOrigins || allowedOrigins.length === 0)) {
  throw new Error(
    "CORS_ALLOWED_ORIGINS is verplicht in productie. Stel een komma-gescheiden lijst van toegestane origins in (bv. https://office-hub.example.com).",
  );
}

if (allowedOrigins) {
  logger.info({ allowedOrigins }, "CORS allowlist actief");
} else {
  logger.warn(
    "CORS_ALLOWED_ORIGINS niet ingesteld — alle origins worden toegestaan (development mode).",
  );
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!allowedOrigins) return cb(null, origin || true);
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin '${origin}' niet toegestaan`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
