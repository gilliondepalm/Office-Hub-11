import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import bcrypt from "bcryptjs";
import pgSession from "connect-pg-simple";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  insertUserSchema, insertEventSchema, insertAnnouncementSchema,
  insertDepartmentSchema, insertAbsenceSchema, insertRewardSchema,
  insertApplicationSchema, insertAppAccessSchema, insertMessageSchema,
  insertAoProcedureSchema, insertAoInstructionSchema, insertPositionHistorySchema,
  insertPersonalDevelopmentSchema, insertLegislationLinkSchema, insertCaoDocumentSchema,
  insertFunctioneringReviewSchema,
  insertCompetencySchema, insertBeoordelingReviewSchema, insertBeoordelingScoreSchema,
  insertJaarplanItemSchema, insertJaarplanOnderdeelSchema, insertJaarplanActieSchema,
  insertHelpContentSchema,
  insertYearlyAwardSchema,
  insertKartografieProductieSchema,
  insertMaandProdKartograafSchema,
  insertMaandProdSamenvattingSchema,
  insertMaandProdLandmeterSchema,
  insertMaandProdSamenvattingLmSchema,
  insertMaandProdKmInfoSchema,
  insertMaandProdOrInfoSchema,
  insertMaandProdOrNotarisSchema,
  insertTrendKmBuitenSchema,
  insertTrendKmInfoSchema,
  insertTrendOrInfoSchema,
  insertTrendOrAlgemeenSchema,
  insertTrendOrNotarisSchema,
  insertTrendKartografenHistSchema,
  insertWerktijdenSchema,
  insertOveruurAanvraagSchema,
  insertImportLogSchema,
  insertCorrectieverzoekSchema,
  isAdminRole,
  canManageVacation,
} from "@shared/schema";

const PgStore = pgSession(session);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function isWithinDir(dir: string, filePath: string): boolean {
  const resolvedDir = path.resolve(dir);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + path.sep);
}

const aankondigingenDir = path.join(uploadsDir, "Aankondigingen");
if (!fs.existsSync(aankondigingenDir)) {
  fs.mkdirSync(aankondigingenDir, { recursive: true });
}

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv" || file.mimetype === "text/plain" || file.originalname.endsWith(".csv") || file.originalname.endsWith(".txt");
    if (ok) cb(null, true); else cb(new Error("Alleen CSV/TXT bestanden zijn toegestaan"));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, aankondigingenDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Alleen PDF-bestanden zijn toegestaan"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const beloningDir = path.join(uploadsDir, "Beloning");
if (!fs.existsSync(beloningDir)) {
  fs.mkdirSync(beloningDir, { recursive: true });
}

const functiesDir = path.join(uploadsDir, "Functies");
if (!fs.existsSync(functiesDir)) {
  fs.mkdirSync(functiesDir, { recursive: true });
}

const functiesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, functiesDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  },
});

const uploadFunctie = multer({
  storage: functiesStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Alleen PDF, Word of tekstbestanden zijn toegestaan"));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const beloningStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, beloningDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  },
});

const uploadBeloning = multer({
  storage: beloningStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Alleen afbeeldingen zijn toegestaan"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const pasfotoDir = path.join(uploadsDir, "Pasfoto");
if (!fs.existsSync(pasfotoDir)) {
  fs.mkdirSync(pasfotoDir, { recursive: true });
}

const huishoudelijkDir = path.join(uploadsDir, "Huishoudelijkreglement");
if (!fs.existsSync(huishoudelijkDir)) {
  fs.mkdirSync(huishoudelijkDir, { recursive: true });
}

const pasfotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pasfotoDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `user-${req.params?.id || Date.now()}${ext}`);
  },
});

const uploadPasfoto = multer({
  storage: pasfotoStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) { cb(null, true); }
    else { cb(new Error("Alleen afbeeldingen zijn toegestaan")); }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const appPicsDir = path.join(uploadsDir, "App_pics");
if (!fs.existsSync(appPicsDir)) {
  fs.mkdirSync(appPicsDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, appPicsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  },
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Alleen afbeeldingen zijn toegestaan"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
  if (!process.env.SESSION_SECRET) {
    console.warn("[SECURITY] SESSION_SECRET is niet ingesteld. Een tijdelijke sleutel wordt gebruikt. Stel SESSION_SECRET in als omgevingsvariabele voor productie.");
  }

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.set("trust proxy", 1);

  const keyGenerator = (req: any) => {
    const raw = req.ip || req.socket.remoteAddress || "unknown";
    const ip = raw.replace(/:\d+$/, "").replace(/^::ffff:/, "");
    return ipKeyGenerator(ip);
  };

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Te veel pogingen. Probeer het over 15 minuten opnieuw." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    keyGenerator,
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { message: "Te veel verzoeken. Probeer het later opnieuw." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    keyGenerator,
    skip: (req: any) => !!(req.session as any)?.userId, // ingelogde gebruikers zijn vrijgesteld
  });

  app.use("/api/", apiLimiter);

  await seedDatabase();

  async function requireAuth(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Niet ingelogd" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Niet ingelogd" });
    }
    req.user = user;
    next();
  }

  async function requireAdmin(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Niet ingelogd" });
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Geen toegang - alleen beheerders" });
    }
    next();
  }

  async function requirePersonaliaAdmin(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Niet ingelogd" });
    const user = await storage.getUser(userId);
    if (!user || (!isAdminRole(user.role) && user.role !== "manager_az")) {
      return res.status(403).json({ message: "Geen toegang - alleen beheerders" });
    }
    req.user = user;
    next();
  }

  const express = await import("express");

  app.use("/PDF", express.default.static(path.join(process.cwd(), "PDF")));

  app.use("/uploads/App_pics", express.default.static(appPicsDir));
  app.use("/uploads/Beloning", express.default.static(beloningDir));
  app.use("/uploads/Functies", express.default.static(functiesDir));
  app.use("/uploads/Pasfoto", express.default.static(pasfotoDir));
  app.use("/uploads/Huishoudelijkreglement", express.default.static(huishoudelijkDir));

  app.get("/uploads/public/:filename", (req, res) => {
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = path.join(uploadsDir, filename);
    if (!isWithinDir(uploadsDir, filePath) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Bestand niet gevonden" });
    }
    res.sendFile(filePath);
  });

  app.use("/uploads", requireAuth, (req, res, next) => {
    if (req.path.endsWith(".pdf")) {
      const filePath = path.join(uploadsDir, req.path);
      if (isWithinDir(uploadsDir, filePath) && fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
        return res.sendFile(filePath);
      }
    }
    next();
  }, express.default.static(uploadsDir));

  app.post("/api/upload/pdf", requireAuth, uploadPdf.single("pdf"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    const pdfUrl = `/uploads/Aankondigingen/${req.file.filename}`;
    res.json({ pdfUrl });
  });

  const wetgevingDir = path.join(uploadsDir, "Wetgeving");
  if (!fs.existsSync(wetgevingDir)) {
    fs.mkdirSync(wetgevingDir, { recursive: true });
  }

  app.get("/api/uploads/list", requireAuth, (_req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir)
        .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
        .map((f: string) => {
          const stat = fs.statSync(path.join(uploadsDir, f));
          return { name: f, path: `/uploads/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/uploads/wetgeving", requireAuth, (_req, res) => {
    try {
      const files = fs.readdirSync(wetgevingDir)
        .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
        .map((f: string) => {
          const stat = fs.statSync(path.join(wetgevingDir, f));
          return { name: f, path: `/uploads/Wetgeving/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  const wetgevingUpload = multer({
    storage: multer.diskStorage({
      destination: (_req: any, _file: any, cb: any) => cb(null, wetgevingDir),
      filename: (_req: any, file: any, cb: any) => cb(null, file.originalname),
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("Alleen PDF-bestanden"));
    },
  });

  app.post("/api/uploads/wetgeving", requireAuth, wetgevingUpload.single("pdf"), async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    res.json({ name: req.file.originalname, path: `/uploads/Wetgeving/${req.file.originalname}` });
  });

  const caoDir = path.join(uploadsDir, "CAO");
  if (!fs.existsSync(caoDir)) {
    fs.mkdirSync(caoDir, { recursive: true });
  }

  app.get("/api/uploads/cao", requireAuth, (_req, res) => {
    try {
      const files = fs.readdirSync(caoDir)
        .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
        .map((f: string) => {
          const stat = fs.statSync(path.join(caoDir, f));
          return { name: f, path: `/uploads/CAO/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  const caoUpload = multer({
    storage: multer.diskStorage({
      destination: (_req: any, _file: any, cb: any) => cb(null, caoDir),
      filename: (_req: any, file: any, cb: any) => cb(null, file.originalname),
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("Alleen PDF-bestanden"));
    },
  });

  app.post("/api/uploads/cao", requireAuth, caoUpload.single("pdf"), async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    res.json({ name: req.file.originalname, path: `/uploads/CAO/${req.file.originalname}` });
  });

  app.delete("/api/uploads/cao/:filename", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._\- ]/g, "");
    const filePath = path.join(caoDir, filename);
    if (!isWithinDir(caoDir, filePath)) return res.status(400).json({ message: "Ongeldig bestandspad" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Verwijderd" });
    } else {
      res.status(404).json({ message: "Bestand niet gevonden" });
    }
  });

  app.delete("/api/uploads/wetgeving/:filename", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._\- ]/g, "");
    const filePath = path.join(wetgevingDir, filename);
    if (!isWithinDir(wetgevingDir, filePath)) return res.status(400).json({ message: "Ongeldig bestandspad" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Verwijderd" });
    } else {
      res.status(404).json({ message: "Bestand niet gevonden" });
    }
  });

  app.get("/api/uploads/huishoudelijkreglement", requireAuth, (_req, res) => {
    try {
      const files = fs.readdirSync(huishoudelijkDir)
        .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
        .map((f: string) => {
          const stat = fs.statSync(path.join(huishoudelijkDir, f));
          return { name: f, path: `/uploads/Huishoudelijkreglement/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  const huishoudelijkUpload = multer({
    storage: multer.diskStorage({
      destination: (_req: any, _file: any, cb: any) => cb(null, huishoudelijkDir),
      filename: (_req: any, file: any, cb: any) => cb(null, file.originalname),
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("Alleen PDF-bestanden"));
    },
  });

  app.post("/api/uploads/huishoudelijkreglement", requireAuth, huishoudelijkUpload.single("pdf"), async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    res.json({ name: req.file.originalname, path: `/uploads/Huishoudelijkreglement/${req.file.originalname}` });
  });

  app.delete("/api/uploads/huishoudelijkreglement/:filename", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._\- ]/g, "");
    const filePath = path.join(huishoudelijkDir, filename);
    if (!isWithinDir(huishoudelijkDir, filePath)) return res.status(400).json({ message: "Ongeldig bestandspad" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Verwijderd" });
    } else {
      res.status(404).json({ message: "Bestand niet gevonden" });
    }
  });

  const nieuwsbriefDir = path.join(uploadsDir, "Nieuwsbrief");
  if (!fs.existsSync(nieuwsbriefDir)) {
    fs.mkdirSync(nieuwsbriefDir, { recursive: true });
  }

  app.get("/api/uploads/nieuwsbrief", requireAuth, (_req, res) => {
    try {
      const files = fs.readdirSync(nieuwsbriefDir)
        .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
        .map((f: string) => {
          const stat = fs.statSync(path.join(nieuwsbriefDir, f));
          return { name: f, path: `/uploads/Nieuwsbrief/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  const nieuwsbriefUpload = multer({
    storage: multer.diskStorage({
      destination: (_req: any, _file: any, cb: any) => cb(null, nieuwsbriefDir),
      filename: (_req: any, file: any, cb: any) => cb(null, file.originalname),
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("Alleen PDF-bestanden"));
    },
  });

  app.post("/api/uploads/nieuwsbrief", requireAuth, nieuwsbriefUpload.single("pdf"), async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    res.json({ name: req.file.originalname, path: `/uploads/Nieuwsbrief/${req.file.originalname}` });
  });

  app.delete("/api/uploads/nieuwsbrief/:filename", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._\- ]/g, "");
    const filePath = path.join(nieuwsbriefDir, filename);
    if (!isWithinDir(nieuwsbriefDir, filePath)) return res.status(400).json({ message: "Ongeldig bestandspad" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Verwijderd" });
    } else {
      res.status(404).json({ message: "Bestand niet gevonden" });
    }
  });

  const instructiesDir = path.join(uploadsDir, "Instructies");
  if (!fs.existsSync(instructiesDir)) {
    fs.mkdirSync(instructiesDir, { recursive: true });
  }

  app.get("/api/uploads/instructies", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });

    try {
      const allDepts = fs.readdirSync(instructiesDir, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => d.name)
        .sort();

      const visibleDepts = isAdminRole(user.role)
        ? allDepts
        : allDepts.filter((d: string) => d === user.department);

      const result: Record<string, any[]> = {};
      for (const dept of visibleDepts) {
        const deptPath = path.join(instructiesDir, dept);
        const files = fs.readdirSync(deptPath)
          .filter((f: string) => f.toLowerCase().endsWith(".pdf"))
          .map((f: string) => {
            const stat = fs.statSync(path.join(deptPath, f));
            return { name: f, path: `/uploads/Instructies/${dept}/${f}`, size: stat.size, modified: stat.mtime };
          })
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        result[dept] = files;
      }

      if (!isAdminRole(user.role) && user.department && !result[user.department]) {
        result[user.department] = [];
      }

      res.json(result);
    } catch {
      res.json({});
    }
  });

  const instructiesUpload = multer({
    storage: multer.diskStorage({
      destination: (req: any, _file: any, cb: any) => {
        const dept = req.params.department.replace(/[^a-zA-Z0-9 _-]/g, "");
        const deptPath = path.join(instructiesDir, dept);
        if (!isWithinDir(instructiesDir, deptPath)) return cb(new Error("Ongeldig pad"));
        if (!fs.existsSync(deptPath)) fs.mkdirSync(deptPath, { recursive: true });
        cb(null, deptPath);
      },
      filename: (_req: any, file: any, cb: any) => cb(null, file.originalname),
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("Alleen PDF-bestanden"));
    },
  });

  app.post("/api/uploads/instructies/:department", requireAuth, instructiesUpload.single("pdf"), async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Geen PDF-bestand ontvangen" });
    }
    const dept = req.params.department.replace(/[^a-zA-Z0-9 _-]/g, "");
    res.json({ name: req.file.originalname, path: `/uploads/Instructies/${dept}/${req.file.originalname}` });
  });

  app.delete("/api/uploads/instructies/:department/:filename", requireAuth, async (req: any, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({ message: "Alleen beheerders" });
    }
    const dept = req.params.department.replace(/[^a-zA-Z0-9 _-]/g, "");
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._\- ]/g, "");
    const filePath = path.join(instructiesDir, dept, filename);
    if (!isWithinDir(instructiesDir, filePath)) return res.status(400).json({ message: "Ongeldig bestandspad" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Verwijderd" });
    } else {
      res.status(404).json({ message: "Bestand niet gevonden" });
    }
  });

  app.post("/api/auth/request-reset", authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "E-mail is verplicht" });
      }
      res.json({ message: "Als dit e-mailadres bekend is, is een verzoek ingediend bij de beheerder. Neem contact op met uw beheerder." });
    } catch (err) {
      res.status(500).json({ message: "Serverfout" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Gebruikersnaam en wachtwoord zijn verplicht" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Sessie fout" });
        }
        (req.session as any).userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ message: "Sessie fout" });
          }
          const { password: _, ...safeUser } = user;
          res.json(safeUser);
        });
      });
    } catch (err) {
      res.status(500).json({ message: "Serverfout" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Niet ingelogd" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Gebruiker niet gevonden" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/change-password", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Niet ingelogd" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Huidig en nieuw wachtwoord zijn verplicht" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Nieuw wachtwoord moet minimaal 8 tekens bevatten" });
    }
    try {
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Gebruiker niet gevonden" });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: "Huidig wachtwoord is onjuist" });
      const hashed = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(userId, { password: hashed });
      res.json({ message: "Wachtwoord succesvol gewijzigd" });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij wijzigen wachtwoord" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Uitgelogd" });
    });
  });

  app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/absences/today", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const currentUser = await storage.getUser(userId);
    if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });

    if (!isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
      return res.status(403).json({ message: "Geen toegang" });
    }

    const today = new Date().toISOString().split("T")[0];

    const allAbsences = isAdminRole(currentUser.role)
      ? await storage.getAbsences()
      : currentUser.department
        ? await storage.getAbsencesByDepartment(currentUser.department)
        : [];

    const todayAbsences = allAbsences.filter(a => {
      return (a.status === "approved" || a.status === "pending") &&
        a.startDate <= today && a.endDate >= today;
    });

    const allDepts = await storage.getDepartments();
    const allUsers = await storage.getUsers();

    const grouped: Record<string, { managerName: string; managerRole: string; department: string; employees: { name: string; type: string; status: string; halfDay: string | null }[] }> = {};

    for (const absence of todayAbsences) {
      const dept = absence.userDepartment || "Onbekend";
      const deptRecord = allDepts.find(d => d.name === dept);
      let managerName = "Geen beheerder";
      let managerRole = "";
      if (deptRecord?.managerId) {
        const mgr = allUsers.find(u => u.id === deptRecord.managerId);
        if (mgr) {
          managerName = mgr.fullName;
          managerRole = mgr.role;
        }
      }

      const key = dept;
      if (!grouped[key]) {
        grouped[key] = { managerName, managerRole, department: dept, employees: [] };
      }
      grouped[key].employees.push({
        name: absence.userName || "Onbekend",
        type: absence.type,
        status: absence.status,
        halfDay: absence.halfDay,
      });
    }

    res.json({
      date: today,
      totalAbsent: todayAbsences.length,
      departments: Object.values(grouped),
    });
  });

  app.get("/api/users", requireAuth, async (_req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers.map(({ password: _, ...u }) => u));
  });

  app.get("/api/users/next-userid", requirePersonaliaAdmin, async (_req, res) => {
    try {
      const nextId = await storage.getNextKadasterId();
      res.json({ nextId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/users", requirePersonaliaAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      if (parsed.password.length < 8) {
        return res.status(400).json({ message: "Wachtwoord moet minimaal 8 tekens bevatten" });
      }
      const hashed = await bcrypt.hash(parsed.password, 12);
      const nextKadasterId = await storage.getNextKadasterId();
      const user = await storage.createUser({ ...parsed, password: hashed, kadasterId: nextKadasterId });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/users/:id", requirePersonaliaAdmin, async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.password) {
        if (data.password.length < 8) {
          return res.status(400).json({ message: "Wachtwoord moet minimaal 8 tekens bevatten" });
        }
        data.password = await bcrypt.hash(data.password, 12);
      }
      if (data.active === false && !data.endDate) {
        return res.status(400).json({ message: "Datum uit dienst is verplicht bij deactiveren" });
      }
      if (data.active === true) {
        data.endDate = null;
      }
      if (data.kadasterId) {
        const allUsers = await storage.getUsers();
        const conflict = allUsers.find(
          (u: any) => u.id !== req.params.id && u.kadasterId === data.kadasterId
        );
        if (conflict) {
          return res.status(409).json({ message: `Userid "${data.kadasterId}" is al in gebruik` });
        }
      }
      const user = await storage.updateUser(req.params.id, data);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.patch("/api/users/:id/permissions", requireAdmin, async (req, res) => {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Ongeldige rechten" });
      }
      const user = await storage.updateUserPermissions(req.params.id, permissions);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.post("/api/users/:id/avatar", requirePersonaliaAdmin, (req: any, res: any, next: any) => {
    uploadPasfoto.single("photo")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Bestand is te groot (maximaal 20 MB)" });
        }
        return res.status(400).json({ message: err.message || "Upload mislukt" });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Geen bestand geüpload" });
      const avatarPath = `/uploads/Pasfoto/${req.file.filename}`;
      const user = await storage.updateUser(req.params.id, { avatar: avatarPath } as any);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij uploaden" });
    }
  });

  app.get("/api/events", requireAuth, async (_req, res) => {
    const all = await storage.getEvents();
    res.json(all);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const parsed = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(parsed);
      res.json(event);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      res.json(event);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    await storage.deleteEvent(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/snipperdagen", requireAuth, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const list = await storage.getSnipperdagen(year);
    res.json(list);
  });

  app.post("/api/snipperdagen", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!canManageVacation(user?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { name, date } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Naam is verplicht" });
      }
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Ongeldige datum" });
      }
      const year = parseInt(date.split("-")[0]);
      const existing = await storage.getSnipperdagen(year);
      if (existing.some(s => s.date === date)) {
        return res.status(400).json({ message: "Er bestaat al een snipperdag op deze datum" });
      }
      const snipperdag = await storage.createSnipperdag({
        name: name.trim(),
        date,
        year,
        createdBy: user.id,
      });
      res.json(snipperdag);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Aanmaken mislukt" });
    }
  });

  app.delete("/api/snipperdagen/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!canManageVacation(user?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteSnipperdag(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/official-holidays", requireAuth, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const holidays = await storage.getOfficialHolidays(year);
    res.json(holidays);
  });

  app.post("/api/official-holidays/single", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!isAdminRole(user?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { name, date, year } = req.body;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Naam is verplicht" });
      }
      if (!date || !dateRegex.test(date)) {
        return res.status(400).json({ message: "Ongeldige datum (verwacht JJJJ-MM-DD)" });
      }
      if (typeof year !== "number") {
        return res.status(400).json({ message: "Jaar is verplicht" });
      }
      const holiday = await storage.createOfficialHoliday({ name: name.trim(), date, year, createdBy: user.id });
      res.json(holiday);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Toevoegen mislukt" });
    }
  });

  app.post("/api/official-holidays", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!isAdminRole(user?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const holidays = req.body.holidays;
      const year = req.body.year;
      if (!Array.isArray(holidays) || typeof year !== "number" || holidays.length === 0) {
        return res.status(400).json({ message: "Ongeldige data: verwacht jaar (number) en holidays (array)" });
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validated = holidays.map((h: any, i: number) => {
        if (!h.name || typeof h.name !== "string" || !h.name.trim()) {
          throw new Error(`Rij ${i + 1}: naam is verplicht`);
        }
        if (!h.date || !dateRegex.test(h.date)) {
          throw new Error(`Rij ${i + 1}: ongeldige datum (verwacht JJJJ-MM-DD)`);
        }
        return { name: h.name.trim(), date: h.date, year, createdBy: user.id };
      });
      await storage.deleteOfficialHolidaysByYear(year);
      const created = [];
      for (const v of validated) {
        const holiday = await storage.createOfficialHoliday(v);
        created.push(holiday);
      }
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload mislukt" });
    }
  });

  app.delete("/api/official-holidays/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!isAdminRole(user?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteOfficialHoliday(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/announcements", requireAuth, async (_req, res) => {
    const all = await storage.getAnnouncements();
    res.json(all);
  });

  app.get("/api/announcements/archived", requireAuth, async (_req, res) => {
    const all = await storage.getArchivedAnnouncements();
    res.json(all);
  });

  app.patch("/api/announcements/:id/archive", requireAuth, async (req, res) => {
    await storage.archiveAnnouncement(req.params.id);
    res.json({ message: "Gearchiveerd" });
  });

  app.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const parsed = insertAnnouncementSchema.parse(req.body);
      const ann = await storage.createAnnouncement(parsed);
      res.json(ann);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const ann = await storage.updateAnnouncement(req.params.id, req.body);
      res.json(ann);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    await storage.deleteAnnouncement(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/departments", requireAuth, async (_req, res) => {
    const all = await storage.getDepartments();
    res.json(all);
  });

  app.post("/api/departments", requireAuth, async (req, res) => {
    try {
      const parsed = insertDepartmentSchema.parse(req.body);
      const dept = await storage.createDepartment(parsed);
      res.json(dept);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/departments/:id", requireAuth, async (req, res) => {
    try {
      const dept = await storage.updateDepartment(req.params.id, req.body);
      res.json(dept);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/departments/:id", requireAuth, async (req, res) => {
    await storage.deleteDepartment(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/vacation-balance", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const allAbsences = await storage.getAbsences();
      const currentYear = new Date().getFullYear();
      const yearSnipperdagen = await storage.getSnipperdagen(currentYear);
      const snipperdagenCount = yearSnipperdagen.length;

      const allCancellations = await storage.getAllAbsenceCancellations();

      const [holidaysPrev, holidaysCurr, holidaysNext] = await Promise.all([
        storage.getOfficialHolidays(currentYear - 1),
        storage.getOfficialHolidays(currentYear),
        storage.getOfficialHolidays(currentYear + 1),
      ]);
      const publicHolidaySet = new Set<string>(
        [...holidaysPrev, ...holidaysCurr, ...holidaysNext].map(h => h.date)
      );

      const absenceById = new Map(allAbsences.map(a => [a.id, a]));
      const todayStr = new Date().toISOString().split("T")[0];

      const perDayCancelByUser: Record<string, number> = {};
      const perDayCancelOpgenomenByUser: Record<string, number> = {};
      const perDaySickCancelByUser: Record<string, number> = {};
      for (const c of allCancellations) {
        const absence = absenceById.get(c.absenceId);
        if (!absence) continue;
        const cancelYear = new Date(c.cancelledDate).getFullYear();
        if (cancelYear !== currentYear) continue;
        if (publicHolidaySet.has(c.cancelledDate)) continue;
        const days = (absence.halfDay === "am" || absence.halfDay === "pm") ? 0.5 : 1;
        if ((c as any).affectsBalance) {
          perDayCancelByUser[absence.userId] = (perDayCancelByUser[absence.userId] || 0) + days;
          if (c.cancelledDate <= todayStr) {
            perDayCancelOpgenomenByUser[absence.userId] = (perDayCancelOpgenomenByUser[absence.userId] || 0) + days;
          }
        }
        if (absence.type === "sick") {
          perDaySickCancelByUser[absence.userId] = (perDaySickCancelByUser[absence.userId] || 0) + days;
        }
      }

      const countWeekdays = (startStr: string, endStr: string): number => {
        const start = new Date(startStr + "T00:00:00");
        const end = new Date(endStr + "T00:00:00");
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
          const day = current.getDay();
          const dateStr = current.toISOString().split("T")[0];
          if (day !== 0 && day !== 6 && !publicHolidaySet.has(dateStr)) count++;
          current.setDate(current.getDate() + 1);
        }
        return count;
      }

      const countDays = (list: typeof allAbsences) => {
        let days = 0;
        for (const a of list) {
          if (a.halfDay === "am" || a.halfDay === "pm") {
            days += 0.5;
          } else {
            days += countWeekdays(a.startDate, a.endDate);
          }
        }
        return days;
      };

      const countDaysUpTo = (list: typeof allAbsences, upTo: string) => {
        let days = 0;
        for (const a of list) {
          if (a.startDate > upTo) continue;
          const effectiveEnd = a.endDate <= upTo ? a.endDate : upTo;
          if (a.halfDay === "am" || a.halfDay === "pm") {
            days += 0.5;
          } else {
            days += countWeekdays(a.startDate, effectiveEnd);
          }
        }
        return days;
      };

      const balances = allUsers.filter(u => u.active).map(u => {
        const userVacAbsences = allAbsences.filter(
          a => a.userId === u.id &&
            (a.type === "vacation" ||
              ((a.type === "personal" || a.type === "other") && (a as any).deductVacation === true) ||
              (a.type === "persoonlijk" && (a as any).persoonlijkBesluit === "ongeoorloofd")) &&
            new Date(a.startDate).getFullYear() === currentYear
        );
        const userSickAbsences = allAbsences.filter(
          a => a.userId === u.id && a.type === "sick" &&
            new Date(a.startDate).getFullYear() === currentYear &&
            (a.status === "approved" || a.status === "pending")
        );
        const userPersoonlijkGeoorloofd = allAbsences.filter(
          a => a.userId === u.id &&
            a.type === "persoonlijk" &&
            (a as any).persoonlijkBesluit === "geoorloofd" &&
            a.status === "approved" &&
            new Date(a.startDate).getFullYear() === currentYear
        );
        // Rejected persoonlijk absences for past periods count as ongeoorloofd → deducted from vacation balance
        const userRejectedPastPersoonlijk = allAbsences.filter(
          a => a.userId === u.id &&
            a.type === "persoonlijk" &&
            a.status === "rejected" &&
            a.endDate < todayStr &&
            new Date(a.startDate).getFullYear() === currentYear
        );
        const rejectedPastDays = countDays(userRejectedPastPersoonlijk);
        const approved = userVacAbsences.filter(a => a.status === "approved");
        const pending = userVacAbsences.filter(a => a.status === "pending");
        const cancelDays = perDayCancelByUser[u.id] || 0;
        const pastCancelDays = perDayCancelOpgenomenByUser[u.id] || 0;
        const toegekendDays = Math.max(0, countDays(approved) + rejectedPastDays - cancelDays);
        const geplandDays = countDays(pending);
        const opgenomenDays = Math.max(0, countDaysUpTo(approved, todayStr) + rejectedPastDays - pastCancelDays);
        const sickDays = Math.max(0, countDays(userSickAbsences) - (perDaySickCancelByUser[u.id] || 0));
        const persoonlijkGeoorloofdDays = countDays(userPersoonlijkGeoorloofd);
        // Ongeoorloofd = approved persoonlijk with besluit=ongeoorloofd + rejected past persoonlijk
        const ongeoorloofdApproved = userVacAbsences.filter(
          a => a.status === "approved" &&
            a.type === "persoonlijk" &&
            (a as any).persoonlijkBesluit === "ongeoorloofd"
        );
        const ongeoorloofdDays = countDays(ongeoorloofdApproved) + rejectedPastDays;
        const recht = u.vacationDaysTotal ?? 25;
        const saldoOud = u.vacationDaysSaldoOud ?? 0;
        // Extra vakantiedagen: 1 extra per jaar vanaf 60e verjaardag t/m 64e (max 5)
        let extra = 0;
        if (u.birthDate) {
          const birthYear = new Date(u.birthDate).getFullYear();
          const age = currentYear - birthYear;
          if (age >= 60 && age < 65) {
            extra = age - 59; // 60→1, 61→2, 62→3, 63→4, 64→5
          }
        }
        const totaal = recht + saldoOud + extra;
        return {
          userId: u.id,
          userName: u.fullName,
          department: u.department || "Geen afdeling",
          recht,
          saldoOud,
          extra,
          totalDays: totaal,
          geplandDays,
          toegekendDays,
          opgenomenDays,
          sickDays,
          snipperdagen: snipperdagenCount,
          cancelDays,
          persoonlijkGeoorloofdDays,
          ongeoorloofdDays,
          remainingDays: totaal - toegekendDays - geplandDays - snipperdagenCount,
        };
      });
      res.json(balances);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen saldo" });
    }
  });

  app.patch("/api/users/:id/vacation-days", requireAuth, async (req, res) => {
    const currentUser = req.user as any;
    if (!canManageVacation(currentUser?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { vacationDaysTotal } = req.body;
      if (typeof vacationDaysTotal !== "number" || vacationDaysTotal < 0) {
        return res.status(400).json({ message: "Ongeldig aantal vakantiedagen" });
      }
      const user = await storage.updateUser(req.params.id, { vacationDaysTotal } as any);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.patch("/api/users/:id/saldo-oud", requireAuth, async (req, res) => {
    const currentUser = req.user as any;
    if (!canManageVacation(currentUser?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { vacationDaysSaldoOud } = req.body;
      if (typeof vacationDaysSaldoOud !== "number" || vacationDaysSaldoOud < 0) {
        return res.status(400).json({ message: "Ongeldig saldo oud" });
      }
      const user = await storage.updateUser(req.params.id, { vacationDaysSaldoOud } as any);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  // ── Jaar Afsluiten ─────────────────────────────────────────────────────────
  // GET /api/vacation/jaar-afsluiten-preview?year=N
  // Berekent een vooruitblik: welk saldo wordt het nieuwe Saldo Oud? (geen opslag)
  app.get("/api/vacation/jaar-afsluiten-preview", requireAuth, async (req, res) => {
    const currentUser = req.user as any;
    if (!canManageVacation(currentUser?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const closingYear = parseInt(req.query.year as string);
      const thisYear = new Date().getFullYear();

      if (!closingYear || isNaN(closingYear)) {
        return res.status(400).json({ message: "Ongeldig jaar opgegeven" });
      }
      if (closingYear >= thisYear) {
        return res.status(400).json({
          message: `Jaar ${closingYear} is nog niet voorbij. Afsluiten is pas mogelijk vanaf 1 januari ${closingYear + 1}.`,
        });
      }

      const allUsers    = await storage.getUsers();
      const allAbsences = await storage.getAbsences();

      const yearSnipperdagen   = await storage.getSnipperdagen(closingYear);
      const snipperdagenCount  = yearSnipperdagen.length;

      const [holidaysPrev, holidaysCurr] = await Promise.all([
        storage.getOfficialHolidays(closingYear - 1),
        storage.getOfficialHolidays(closingYear),
      ]);
      const publicHolidaySet = new Set<string>(
        [...holidaysPrev, ...holidaysCurr].map(h => h.date)
      );

      const countWeekdays = (startStr: string, endStr: string): number => {
        const start   = new Date(startStr + "T00:00:00");
        const end     = new Date(endStr   + "T00:00:00");
        let count     = 0;
        const current = new Date(start);
        while (current <= end) {
          const day     = current.getDay();
          const dateStr = current.toISOString().split("T")[0];
          if (day !== 0 && day !== 6 && !publicHolidaySet.has(dateStr)) count++;
          current.setDate(current.getDate() + 1);
        }
        return count;
      };

      const countDays = (list: typeof allAbsences) => {
        let days = 0;
        for (const a of list) {
          if (a.halfDay === "am" || a.halfDay === "pm") {
            days += 0.5;
          } else {
            days += countWeekdays(a.startDate, a.endDate);
          }
        }
        return days;
      };

      const results: { userId: string; userName: string; oudSaldo: number; nieuwSaldo: number }[] = [];

      for (const u of allUsers.filter(u => u.active)) {
        const approved = allAbsences.filter(a =>
          a.userId === u.id &&
          new Date(a.startDate).getFullYear() === closingYear &&
          a.status === "approved" &&
          (a.type === "vacation" ||
            ((a.type === "personal" || a.type === "other") && (a as any).deductVacation === true) ||
            (a.type === "persoonlijk" && (a as any).persoonlijkBesluit === "ongeoorloofd"))
        );
        const rejectedPast = allAbsences.filter(a =>
          a.userId === u.id &&
          a.type === "persoonlijk" &&
          a.status === "rejected" &&
          new Date(a.startDate).getFullYear() === closingYear
        );

        let extra = 0;
        if (u.birthDate) {
          const age = closingYear - new Date(u.birthDate).getFullYear();
          if (age >= 60 && age < 65) extra = age - 59;
        }

        const recht    = u.vacationDaysTotal    ?? 25;
        const saldoOud = u.vacationDaysSaldoOud ?? 0;
        const totaal   = recht + saldoOud + extra;

        const gebruiktDagen  = countDays(approved) + countDays(rejectedPast);
        const resterend      = totaal - gebruiktDagen - snipperdagenCount;
        const nieuwSaldo     = Math.max(0, Math.round(resterend * 2) / 2);

        results.push({ userId: u.id, userName: u.fullName, oudSaldo: saldoOud, nieuwSaldo });
      }

      res.json({ closingYear, results });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen preview" });
    }
  });

  // POST /api/vacation/jaar-afsluiten
  // Berekent het resterende vakantiesaldo per medewerker voor het afgesloten jaar
  // en slaat dit op als het nieuwe 'Saldo Oud' voor het volgende jaar.
  app.post("/api/vacation/jaar-afsluiten", requireAuth, async (req, res) => {
    const currentUser = req.user as any;
    if (!canManageVacation(currentUser?.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const closingYear = parseInt(req.body.year);
      const thisYear = new Date().getFullYear();

      if (!closingYear || isNaN(closingYear)) {
        return res.status(400).json({ message: "Ongeldig jaar opgegeven" });
      }
      if (closingYear >= thisYear) {
        return res.status(400).json({
          message: `Jaar ${closingYear} is nog niet voorbij. Afsluiten is pas mogelijk vanaf 1 januari ${closingYear + 1}.`,
        });
      }

      const allUsers    = await storage.getUsers();
      const allAbsences = await storage.getAbsences();

      // Snipperdagen voor het af te sluiten jaar
      const yearSnipperdagen   = await storage.getSnipperdagen(closingYear);
      const snipperdagenCount  = yearSnipperdagen.length;

      // Officiële feestdagen voor weekdag-berekening
      const [holidaysPrev, holidaysCurr] = await Promise.all([
        storage.getOfficialHolidays(closingYear - 1),
        storage.getOfficialHolidays(closingYear),
      ]);
      const publicHolidaySet = new Set<string>(
        [...holidaysPrev, ...holidaysCurr].map(h => h.date)
      );

      const countWeekdays = (startStr: string, endStr: string): number => {
        const start   = new Date(startStr + "T00:00:00");
        const end     = new Date(endStr   + "T00:00:00");
        let count     = 0;
        const current = new Date(start);
        while (current <= end) {
          const day     = current.getDay();
          const dateStr = current.toISOString().split("T")[0];
          if (day !== 0 && day !== 6 && !publicHolidaySet.has(dateStr)) count++;
          current.setDate(current.getDate() + 1);
        }
        return count;
      };

      const countDays = (list: typeof allAbsences) => {
        let days = 0;
        for (const a of list) {
          if (a.halfDay === "am" || a.halfDay === "pm") {
            days += 0.5;
          } else {
            days += countWeekdays(a.startDate, a.endDate);
          }
        }
        return days;
      };

      const results: { userId: string; userName: string; oudSaldo: number; nieuwSaldo: number }[] = [];

      for (const u of allUsers.filter(u => u.active)) {
        // Goedgekeurde vakantieaftrek-absences in het af te sluiten jaar
        const approved = allAbsences.filter(a =>
          a.userId === u.id &&
          new Date(a.startDate).getFullYear() === closingYear &&
          a.status === "approved" &&
          (a.type === "vacation" ||
            ((a.type === "personal" || a.type === "other") && (a as any).deductVacation === true) ||
            (a.type === "persoonlijk" && (a as any).persoonlijkBesluit === "ongeoorloofd"))
        );
        // Afgekeurde persoonlijk (verleden) tellen ook als aftrek
        const rejectedPast = allAbsences.filter(a =>
          a.userId === u.id &&
          a.type === "persoonlijk" &&
          a.status === "rejected" &&
          new Date(a.startDate).getFullYear() === closingYear
        );

        // Extra vakantiedagen (60-64 jaar)
        let extra = 0;
        if (u.birthDate) {
          const age = closingYear - new Date(u.birthDate).getFullYear();
          if (age >= 60 && age < 65) extra = age - 59;
        }

        const recht    = u.vacationDaysTotal    ?? 25;
        const saldoOud = u.vacationDaysSaldoOud ?? 0;
        const totaal   = recht + saldoOud + extra;

        const gebruiktDagen  = countDays(approved) + countDays(rejectedPast);
        const resterend      = totaal - gebruiktDagen - snipperdagenCount;
        const nieuwSaldo     = Math.max(0, Math.round(resterend * 2) / 2); // Afronden op 0.5

        await storage.updateUser(u.id, { vacationDaysSaldoOud: nieuwSaldo } as any);
        results.push({ userId: u.id, userName: u.fullName, oudSaldo: saldoOud, nieuwSaldo });
      }

      res.json({
        closedYear:   closingYear,
        newYear:      closingYear + 1,
        updatedCount: results.length,
        results,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij afsluiten jaar" });
    }
  });

  app.get("/api/absences", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const currentUser = await storage.getUser(userId);
    if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });

    if (isAdminRole(currentUser.role)) {
      const all = await storage.getAbsences();
      return res.json(all);
    }

    if (currentUser.role === "manager" || currentUser.role === "manager_az") {
      const dept = currentUser.department;
      if (dept) {
        const deptAbsences = await storage.getAbsencesByDepartment(dept);
        return res.json(deptAbsences);
      }
      const mine = await storage.getAbsencesByUser(userId);
      return res.json(mine);
    }

    const mine = await storage.getAbsencesByUser(userId);
    res.json(mine);
  });

  app.get("/api/absences/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const mine = await storage.getAbsencesByUser(userId);
    res.json(mine);
  });

  app.post("/api/absences", requireAuth, async (req, res) => {
    try {
      const parsed = insertAbsenceSchema.parse(req.body);
      const absence = await storage.createAbsence(parsed);
      const requestingUser = await storage.getUser(parsed.userId);
      if (requestingUser?.role === "directeur") {
        await storage.updateAbsenceStatus(absence.id, "approved", parsed.userId);
        const updated = (await storage.getAbsences()).find(a => a.id === absence.id);
        return res.json(updated || absence);
      }
      res.json(absence);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/absences/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });

      const allAbsences = await storage.getAbsences();
      const absence = allAbsences.find((a) => a.id === req.params.id);
      if (!absence) return res.status(404).json({ message: "Melding niet gevonden" });

      const absenceUser = await storage.getUser(absence.userId);

      if ((absenceUser && isAdminRole(absenceUser.role)) || absenceUser?.role === "manager" || absenceUser?.role === "manager_az") {
        if (currentUser.role !== "directeur") {
          return res.status(403).json({ message: "Alleen de directeur kan verzuimverzoeken van beheerders en managers goedkeuren" });
        }
      } else if (currentUser.role === "manager" || currentUser.role === "manager_az") {
        if (absenceUser?.department !== currentUser.department) {
          return res.status(403).json({ message: "U kunt alleen verzuim van uw eigen afdeling goedkeuren" });
        }
      } else if (!isAdminRole(currentUser.role)) {
        return res.status(403).json({ message: "Geen rechten om verzuim goed te keuren" });
      }

      const { status, persoonlijkBesluit } = req.body;
      // Persoonlijk future rejections → treat as cancelled with standard reason
      let actualStatus = status;
      let autoCancelReason: string | undefined = undefined;
      if (status === "rejected" && absence.type === "persoonlijk") {
        const todayStr = new Date().toISOString().split("T")[0];
        if (absence.startDate > todayStr) {
          actualStatus = "cancelled";
          autoCancelReason = "Uw verzoek voor verzuim op basis van persoonlijke redenen wordt niet gehonoreerd.";
        }
      }
      await storage.updateAbsenceStatus(req.params.id, actualStatus, userId, autoCancelReason, persoonlijkBesluit ?? undefined);
      res.json({ message: "Bijgewerkt" });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/absences/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const absence = await storage.getAbsenceById(req.params.id);
      if (!absence) return res.status(404).json({ message: "Melding niet gevonden" });
      const canDelete = isAdminRole(currentUser.role) || canManageVacation(currentUser.role) || absence.userId === currentUser.id;
      if (!canDelete) return res.status(403).json({ message: "Geen rechten om deze melding te verwijderen" });
      await storage.deleteAbsence(req.params.id);
      res.json({ message: "Verwijderd" });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Verwijderen mislukt" });
    }
  });

  app.get("/api/absences/user/:userId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const targetUserId = req.params.userId;
      if (currentUser.id === targetUserId) {
        // eigen data altijd toegestaan
      } else if (!isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      } else if (!isAdminRole(currentUser.role)) {
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser || targetUser.department !== currentUser.department) {
          return res.status(403).json({ message: "Geen toegang tot deze medewerker" });
        }
      }
      const absenceList = await storage.getAbsencesByUser(targetUserId);
      const active = absenceList.filter(a =>
        a.status === "pending" || a.status === "approved"
      );
      res.json(active);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.post("/api/absences/:id/cancel", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const absence = await storage.getAbsenceById(req.params.id);
      if (!absence) return res.status(404).json({ message: "Verlofmelding niet gevonden" });
      if (!isAdminRole(currentUser.role)) {
        const targetUser = await storage.getUser(absence.userId);
        if (!targetUser || targetUser.department !== currentUser.department) {
          return res.status(403).json({ message: "Geen toegang tot deze medewerker" });
        }
      }

      const absenceYear = new Date(absence.startDate).getFullYear();
      const [holidaysPrev, holidaysCurr, holidaysNext] = await Promise.all([
        storage.getOfficialHolidays(absenceYear - 1),
        storage.getOfficialHolidays(absenceYear),
        storage.getOfficialHolidays(absenceYear + 1),
      ]);
      const publicHolidaySet = new Set<string>(
        [...holidaysPrev, ...holidaysCurr, ...holidaysNext].map(h => h.date)
      );

      const countWeekdays = (startStr: string, endStr: string): number => {
        const start = new Date(startStr + "T00:00:00");
        const end = new Date(endStr + "T00:00:00");
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
          const d = cur.getDay();
          const dateStr = cur.toISOString().split("T")[0];
          if (d !== 0 && d !== 6 && !publicHolidaySet.has(dateStr)) count++;
          cur.setDate(cur.getDate() + 1);
        }
        return count;
      };

      const today = new Date().toISOString().split("T")[0];
      let takenDays = 0;

      if (absence.status === "approved") {
        if (absence.startDate <= today) {
          const effectiveEnd = absence.endDate <= today ? absence.endDate : today;
          if (absence.halfDay === "am" || absence.halfDay === "pm") {
            takenDays = 0.5;
          } else {
            takenDays = countWeekdays(absence.startDate, effectiveEnd);
          }
        }
      }

      const cancelReason = req.body?.cancelReason?.trim() || undefined;
      await storage.updateAbsenceStatus(absence.id, "cancelled", null, cancelReason);

      if (takenDays > 0) {
        const user = await storage.getUser(absence.userId);
        if (user) {
          const currentCancel = (user as any).vacationDaysCancel ?? 0;
          await storage.updateUser(absence.userId, { vacationDaysCancel: currentCancel + takenDays } as any);
        }
      }

      res.json({ cancelled: true, takenDays });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Annuleren mislukt" });
    }
  });

  app.get("/api/absence-cancellations", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllAbsenceCancellations();
      res.json(all);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/absence-cancellations/user/:userId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const targetUserId = req.params.userId;
      if (!isAdminRole(currentUser.role) && !canManageVacation(currentUser.role) && currentUser.id !== targetUserId) {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const cancellations = await storage.getAbsenceCancellationsByUser(targetUserId);
      res.json(cancellations);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/absence-cancellations", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (!isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const { absenceId, cancelledDate, cancelReason } = req.body;
      if (!absenceId || !cancelledDate) {
        return res.status(400).json({ message: "absenceId en cancelledDate zijn verplicht" });
      }

      const absence = await storage.getAbsenceById(absenceId);
      if (!absence) return res.status(404).json({ message: "Verlofmelding niet gevonden" });
      if (currentUser.id === absence.userId) {
        // eigen verzuim altijd toegestaan
      } else if (!isAdminRole(currentUser.role)) {
        const targetUser = await storage.getUser(absence.userId);
        if (!targetUser || targetUser.department !== currentUser.department) {
          return res.status(403).json({ message: "Geen toegang tot deze medewerker" });
        }
      }

      const affectsBalance = absence.type === "vacation"
        || (["sick", "bvvd"].includes(absence.type) && absence.deductVacation === true);

      const cancellation = await storage.createAbsenceCancellation({
        absenceId,
        cancelledDate,
        cancelReason: cancelReason?.trim() || null,
        cancelledBy: (req.session as any).userId,
        affectsBalance,
      });

      if (affectsBalance) {
        const user = await storage.getUser(absence.userId);
        if (user) {
          const isHalfDay = absence.halfDay === "am" || absence.halfDay === "pm";
          const days = isHalfDay ? 0.5 : 1;
          const currentCancel = (user as any).vacationDaysCancel ?? 0;
          await storage.updateUser(absence.userId, { vacationDaysCancel: currentCancel + days } as any);
        }
      }

      res.json({ ...cancellation, affectsBalance, daysBooked: affectsBalance ? (absence.halfDay ? 0.5 : 1) : 0 });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Annuleren mislukt" });
    }
  });

  app.get("/api/rewards", requireAuth, async (_req, res) => {
    const all = await storage.getRewards();
    res.json(all);
  });

  app.get("/api/rewards/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const mine = await storage.getRewardsByUser(userId);
    res.json(mine);
  });

  app.post("/api/rewards", requireAuth, async (req, res) => {
    try {
      const parsed = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(parsed);
      res.json(reward);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.get("/api/rewards/leaderboard", requireAuth, async (_req, res) => {
    const lb = await storage.getLeaderboard();
    res.json(lb);
  });

  app.get("/api/yearly-awards", requireAuth, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const awards = await storage.getYearlyAwards(year);
    res.json(awards);
  });

  app.post("/api/yearly-awards", requireAuth, uploadBeloning.single("photo"), async (req: any, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    try {
      const photoUrl = req.file ? `/uploads/Beloning/${req.file.filename}` : null;
      const award = await storage.createYearlyAward({
        year: parseInt(req.body.year),
        type: req.body.type,
        name: req.body.name,
        awardedBy: req.body.awardedBy || null,
        photo: photoUrl,
      });
      res.json(award);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/yearly-awards/:id", requireAuth, async (req, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    await storage.deleteYearlyAward(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/job-functions", requireAuth, async (_req, res) => {
    const funcs = await storage.getJobFunctions();
    res.json(funcs);
  });

  app.post("/api/job-functions", requireAuth, async (req, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    const { name, description, departmentId, sortOrder, beginSchaal, eindSchaal } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Naam is verplicht" });
    const created = await storage.createJobFunction({
      name: name.trim(),
      description: description || null,
      departmentId: departmentId || null,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      beginSchaal: beginSchaal !== undefined && beginSchaal !== "" ? parseInt(beginSchaal) : null,
      eindSchaal: eindSchaal !== undefined && eindSchaal !== "" ? parseInt(eindSchaal) : null,
    });
    res.json(created);
  });

  app.patch("/api/job-functions/bulk-sort-order", requireAuth, async (req, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    const { updates } = req.body as { updates: { id: string; sortOrder: number }[] };
    if (!Array.isArray(updates)) return res.status(400).json({ message: "Ongeldige data" });
    for (const { id, sortOrder } of updates) {
      await storage.updateJobFunction(id, { sortOrder });
    }
    res.json({ success: true });
  });

  app.patch("/api/job-functions/:id", requireAuth, async (req, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    const { name, description, departmentId, sortOrder, beginSchaal, eindSchaal } = req.body;
    const updated = await storage.updateJobFunction(req.params.id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description || null }),
      ...(departmentId !== undefined && { departmentId: departmentId || null }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      ...(beginSchaal !== undefined && { beginSchaal: beginSchaal !== "" ? parseInt(beginSchaal) : null }),
      ...(eindSchaal !== undefined && { eindSchaal: eindSchaal !== "" ? parseInt(eindSchaal) : null }),
    });
    res.json(updated);
  });

  app.delete("/api/job-functions/:id", requireAuth, async (req, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    await storage.deleteJobFunction(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/job-functions/:id/upload-description", requireAuth, uploadFunctie.single("file"), async (req: any, res) => {
    const sessionUser = await storage.getUser((req.session as any).userId);
    if (!sessionUser || !isAdminRole(sessionUser.role)) {
      return res.status(403).json({ message: "Alleen admin/directeur" });
    }
    if (!req.file) return res.status(400).json({ message: "Geen bestand geüpload" });
    const filePath = `/uploads/Functies/${req.file.filename}`;
    const updated = await storage.updateJobFunction(req.params.id, { descriptionFilePath: filePath });
    res.json(updated);
  });

  app.get("/api/functionering", requireAuth, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    if (year) {
      const reviews = await storage.getFunctioneringReviewsByYear(year);
      res.json(reviews);
    } else {
      const reviews = await storage.getFunctioneringReviews();
      res.json(reviews);
    }
  });

  app.get("/api/functionering/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const reviews = await storage.getFunctioneringReviewsByUser(userId);
    res.json(reviews);
  });

  app.get("/api/functionering/:userId/:year", requireAuth, async (req, res) => {
    const { userId, year } = req.params;
    const review = await storage.getFunctioneringReviewByUserAndYear(userId, parseInt(year));
    if (!review) {
      res.status(404).json({ message: "Geen functioneringsgesprek gevonden" });
      return;
    }
    res.json(review);
  });

  app.post("/api/functionering", requireAuth, async (req, res) => {
    try {
      const { editId, functioneringsJaar, ...rest } = req.body;
      const parsed = insertFunctioneringReviewSchema.parse(rest);
      if (editId) {
        const updated = await storage.updateFunctioneringReview(editId, parsed);
        res.json(updated);
      } else {
        const review = await storage.createFunctioneringReview(parsed);
        res.json(review);
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.put("/api/functionering/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateFunctioneringReview(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/functionering/:id", requireAuth, async (req, res) => {
    await storage.deleteFunctioneringReview(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/competencies", requireAuth, async (_req, res) => {
    const comps = await storage.getAllCompetencies();
    res.json(comps);
  });

  app.get("/api/competencies/functie/:functie", requireAuth, async (req, res) => {
    const comps = await storage.getCompetenciesByFunctie(req.params.functie);
    res.json(comps);
  });

  app.post("/api/competencies", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role) && (req as any).user.role !== "manager") {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const parsed = insertCompetencySchema.parse(req.body);
      const comp = await storage.createCompetency(parsed);
      res.json(comp);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.put("/api/competencies/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role) && (req as any).user.role !== "manager") {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const updated = await storage.updateCompetency(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/competencies/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role) && (req as any).user.role !== "manager") {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteCompetency(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/beoordeling", requireAuth, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    if (year) {
      const reviews = await storage.getBeoordelingReviewsByYear(year);
      res.json(reviews);
    } else {
      const reviews = await storage.getBeoordelingReviews();
      res.json(reviews);
    }
  });

  app.get("/api/beoordeling/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const reviews = await storage.getBeoordelingReviewsByUser(userId);
    res.json(reviews);
  });

  app.get("/api/beoordeling/:id/scores", requireAuth, async (req, res) => {
    const scores = await storage.getBeoordelingScoresByReview(req.params.id);
    res.json(scores);
  });

  app.post("/api/beoordeling", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role) && (req as any).user.role !== "manager") {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { scores, editId, ...reviewData } = req.body;
      const parsed = insertBeoordelingReviewSchema.parse(reviewData);
      let review;
      if (editId) {
        review = await storage.updateBeoordelingReview(editId, parsed);
        await storage.deleteBeoordelingScoresByReview(editId);
      } else {
        review = await storage.createBeoordelingReview(parsed);
      }
      if (scores && Array.isArray(scores)) {
        for (const s of scores) {
          await storage.createBeoordelingScore({
            reviewId: review.id,
            competencyId: s.competencyId,
            score: s.score,
            toelichting: s.toelichting || null,
          });
        }
      }
      const savedScores = await storage.getBeoordelingScoresByReview(review.id);
      res.json({ ...review, scores: savedScores });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/beoordeling/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role) && (req as any).user.role !== "manager") {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteBeoordelingReview(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/applications", requireAuth, async (_req, res) => {
    const all = await storage.getApplications();
    res.json(all);
  });

  app.post("/api/applications", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) return res.status(403).json({ message: "Alleen admin" });
    try {
      const parsed = insertApplicationSchema.parse(req.body);
      const app2 = await storage.createApplication(parsed);
      res.json(app2);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) return res.status(403).json({ message: "Alleen admin" });
    try {
      const app2 = await storage.updateApplication(req.params.id, req.body);
      res.json(app2);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/applications/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) return res.status(403).json({ message: "Alleen admin" });
    await storage.deleteApplication(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/app-access", requireAuth, async (_req, res) => {
    const all = await storage.getAppAccess();
    res.json(all);
  });

  app.post("/api/app-access", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) return res.status(403).json({ message: "Alleen admin" });
    try {
      const parsed = insertAppAccessSchema.parse(req.body);
      const access = await storage.createAppAccess(parsed);
      res.json(access);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/app-access/:id", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) return res.status(403).json({ message: "Alleen admin" });
    await storage.deleteAppAccess(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/messages", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const msgs = await storage.getMessagesByUser(userId);
    res.json(msgs);
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || (!isAdminRole(user.role) && user.role !== "manager")) {
        return res.status(403).json({ message: "Alleen beheerders en managers mogen berichten sturen" });
      }
      const { toUserIds, ...rest } = req.body;
      const recipientIds: string[] = Array.isArray(toUserIds) && toUserIds.length > 0
        ? [...new Set(toUserIds as string[])]
        : req.body.toUserId ? [req.body.toUserId] : [];

      if (recipientIds.length === 0) {
        return res.status(400).json({ message: "Selecteer minimaal één ontvanger" });
      }

      if (user.role === "manager" || user.role === "manager_az") {
        const allUsers = await storage.getUsers();
        const allowedIds = allUsers
          .filter(u => u.active && u.department === user.department && u.id !== user.id)
          .map(u => u.id);
        const invalidIds = recipientIds.filter(id => !allowedIds.includes(id));
        if (invalidIds.length > 0) {
          return res.status(403).json({ message: "U kunt alleen berichten sturen naar medewerkers in uw eigen afdeling" });
        }
      }

      const allRecipients = await Promise.all(
        recipientIds.map(id => storage.getUser(id))
      );
      const invalidRecipients = recipientIds.filter((id, i) => !allRecipients[i] || !allRecipients[i]!.active);
      if (invalidRecipients.length > 0) {
        return res.status(400).json({ message: "Een of meer ontvangers zijn ongeldig of inactief" });
      }

      const created = [];
      for (const toId of recipientIds) {
        const parsed = insertMessageSchema.parse({ ...rest, toUserId: toId, fromUserId: userId });
        const msg = await storage.createMessage(parsed);
        created.push(msg);
      }
      res.json(recipientIds.length === 1 ? created[0] : created);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/messages/:id/reply", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const allMessages = await storage.getMessagesByUser(userId);
      const msg = allMessages.find(m => m.id === req.params.id);
      if (!msg || msg.toUserId !== userId) {
        return res.status(403).json({ message: "Geen toegang tot dit bericht" });
      }
      if (msg.reply) {
        return res.status(400).json({ message: "Er is al gereageerd op dit bericht" });
      }
      const { reply } = req.body;
      if (!reply || !reply.trim()) {
        return res.status(400).json({ message: "Reactie is verplicht" });
      }
      const updated = await storage.replyToMessage(req.params.id, reply);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Reageren mislukt" });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const allMessages = await storage.getMessagesByUser(userId);
      const msg = allMessages.find(m => m.id === req.params.id);
      if (!msg || msg.toUserId !== userId) {
        return res.status(403).json({ message: "Geen toegang tot dit bericht" });
      }
      await storage.markMessageRead(req.params.id);
      res.json({ message: "Gelezen" });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  // AO Procedures
  app.get("/api/ao-procedures", requireAuth, async (_req, res) => {
    const all = await storage.getAoProcedures();
    res.json(all);
  });

  app.post("/api/ao-procedures", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      const parsed = insertAoProcedureSchema.parse(req.body);
      const proc = await storage.createAoProcedure(parsed);
      res.json(proc);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/ao-procedures/:id", requireAdmin, async (req, res) => {
    await storage.deleteAoProcedure(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  // AO Instructions
  app.get("/api/ao-instructions/:procedureId", requireAuth, async (req, res) => {
    const instructions = await storage.getAoInstructions(req.params.procedureId);
    res.json(instructions);
  });

  app.post("/api/ao-instructions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      const parsed = insertAoInstructionSchema.parse(req.body);
      const instr = await storage.createAoInstruction(parsed);
      res.json(instr);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/ao-instructions/:id", requireAdmin, async (req, res) => {
    await storage.deleteAoInstruction(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  // Position History
  app.get("/api/position-history/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const history = await storage.getPositionHistoryByUser(userId);
    res.json(history);
  });

  app.get("/api/position-history/user/:userId", requireAuth, async (req, res) => {
    const currentUserId = (req.session as any).userId;
    const currentUser = await storage.getUser(currentUserId);
    if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
    if (!isAdminRole(currentUser.role) && currentUserId !== req.params.userId) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    const history = await storage.getPositionHistoryByUser(req.params.userId);
    res.json(history);
  });

  app.get("/api/position-history", requireAdmin, async (_req, res) => {
    const all = await storage.getPositionHistoryAll();
    res.json(all);
  });

  app.post("/api/position-history", requireAdmin, async (req, res) => {
    try {
      const parsed = insertPositionHistorySchema.parse(req.body);
      const entry = await storage.createPositionHistory(parsed);
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/position-history/:id", requireAdmin, async (req, res) => {
    try {
      const entry = await storage.updatePositionHistory(req.params.id, req.body);
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/position-history/:id", requireAdmin, async (req, res) => {
    await storage.deletePositionHistory(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  // Personal Development
  app.get("/api/personal-development/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const entries = await storage.getPersonalDevelopmentByUser(userId);
    res.json(entries);
  });

  app.get("/api/personal-development/user/:userId", requireAuth, async (req, res) => {
    const currentUserId = (req.session as any).userId;
    const currentUser = await storage.getUser(currentUserId);
    if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
    if (!isAdminRole(currentUser.role) && currentUserId !== req.params.userId) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    const entries = await storage.getPersonalDevelopmentByUser(req.params.userId);
    res.json(entries);
  });

  app.post("/api/personal-development", requireAdmin, async (req, res) => {
    try {
      const parsed = insertPersonalDevelopmentSchema.parse(req.body);
      const entry = await storage.createPersonalDevelopment(parsed);
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/personal-development/:id", requireAdmin, async (req, res) => {
    try {
      const entry = await storage.updatePersonalDevelopment(req.params.id, req.body);
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/personal-development/:id", requireAdmin, async (req, res) => {
    await storage.deletePersonalDevelopment(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  // Legislation Links
  app.get("/api/legislation", requireAuth, async (_req, res) => {
    const all = await storage.getLegislationLinks();
    res.json(all);
  });

  app.post("/api/legislation", requireAuth, uploadPdf.single("pdf"), async (req: any, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      const body = {
        title: req.body.title,
        url: req.body.url || "",
        description: req.body.description || null,
        category: req.body.category,
        pdfUrl: req.file ? `/uploads/${req.file.filename}` : (req.body.pdfUrl || null),
      };
      const parsed = insertLegislationLinkSchema.parse(body);
      const link = await storage.createLegislationLink(parsed);
      res.json(link);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/legislation/:id", requireAdmin, async (req, res) => {
    await storage.deleteLegislationLink(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  app.get("/api/cao-documents", requireAuth, async (_req, res) => {
    const all = await storage.getCaoDocuments();
    res.json(all);
  });

  app.post("/api/cao-documents", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      const parsed = insertCaoDocumentSchema.parse(req.body);
      const doc = await storage.createCaoDocument(parsed);
      res.json(doc);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/cao-documents/:id", requireAdmin, async (req, res) => {
    await storage.deleteCaoDocument(req.params.id);
    res.json({ message: "Verwijderd" });
  });

  const publicSettingKeys = ["login_photo"];
  const authSettingKeys = ["dashboard_photo", "rapporten_photo", "productie_photo"];

  const DEFAULT_LOGIN_PHOTO = "/uploads/App_pics/curacao_login.jpg";

  app.get("/api/site-settings/public/:key", async (req, res) => {
    if (!publicSettingKeys.includes(req.params.key)) {
      return res.status(404).json({ message: "Instelling niet gevonden" });
    }
    const value = await storage.getSiteSetting(req.params.key);
    if (req.params.key === "login_photo") {
      return res.json({ value: value ?? DEFAULT_LOGIN_PHOTO });
    }
    res.json({ value });
  });

  app.get("/api/site-settings/:key", requireAuth, async (req, res) => {
    const allKeys = [...publicSettingKeys, ...authSettingKeys];
    if (!allKeys.includes(req.params.key)) {
      return res.status(404).json({ message: "Instelling niet gevonden" });
    }
    const value = await storage.getSiteSetting(req.params.key);
    res.json({ value });
  });

  app.post("/api/site-settings/dashboard-photo", requireAuth, uploadImage.single("photo"), async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Geen afbeelding geüpload" });
      }
      const photoUrl = `/uploads/App_pics/${req.file.filename}`;
      await storage.setSiteSetting("dashboard_photo", photoUrl);
      res.json({ value: photoUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload mislukt" });
    }
  });

  const uploadLoginPhoto = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, appPicsDir),
      filename: (_req, _file, cb) => cb(null, "login.png"),
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Alleen afbeeldingen zijn toegestaan"));
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/site-settings/login-photo", requireAuth, uploadLoginPhoto.single("photo"), async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Geen afbeelding geüpload" });
      }
      const photoUrl = `/uploads/App_pics/login.png`;
      await storage.setSiteSetting("login_photo", photoUrl);
      res.json({ value: photoUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload mislukt" });
    }
  });

  app.post("/api/site-settings/rapporten-photo", requireAuth, uploadImage.single("photo"), async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Geen afbeelding geüpload" });
      }
      const photoUrl = `/uploads/App_pics/${req.file.filename}`;
      await storage.setSiteSetting("rapporten_photo", photoUrl);
      res.json({ value: photoUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload mislukt" });
    }
  });

  const uploadProductiePhoto = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, appPicsDir),
      filename: (_req, _file, cb) => cb(null, "productie.png"),
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Alleen afbeeldingen zijn toegestaan"));
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/site-settings/productie-photo", requireAuth, uploadProductiePhoto.single("photo"), async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ message: "Alleen beheerders" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Geen afbeelding geüpload" });
      }
      const photoUrl = `/uploads/App_pics/productie.png`;
      await storage.setSiteSetting("productie_photo", photoUrl);
      res.json({ value: photoUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload mislukt" });
    }
  });

  const canEditJaarplan = (role: string) =>
    isAdminRole(role) || role === "manager" || role === "manager_az";

  app.get("/api/jaarplan", requireAuth, async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const user = (req as any).user;
    let afdeling: string | undefined;
    if (isAdminRole(user.role) || user.role === "manager_az" || user.role === "manager") {
      afdeling = req.query.afdeling as string | undefined;
    } else {
      afdeling = user.department || undefined;
    }
    const items = await storage.getJaarplanItemsByYear(year, afdeling);
    res.json(items);
  });

  app.post("/api/jaarplan", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!canEditJaarplan(user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { editId, ...rest } = req.body;
      if (!isAdminRole(user.role)) {
        rest.afdeling = user.department;
      }
      rest.createdBy = user.id;
      const parsed = insertJaarplanItemSchema.parse(rest);
      if (editId) {
        const updated = await storage.updateJaarplanItem(editId, parsed);
        res.json(updated);
      } else {
        const item = await storage.createJaarplanItem(parsed);
        res.json(item);
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.put("/api/jaarplan/:id", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const updated = await storage.updateJaarplanItem(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/jaarplan/:id", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteJaarplanItem(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/jaarplan/:id/acties", requireAuth, async (req, res) => {
    const acties = await storage.getJaarplanActies(req.params.id);
    res.json(acties);
  });

  app.post("/api/jaarplan/:id/acties", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!canEditJaarplan(user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const parsed = insertJaarplanActieSchema.parse({
        ...req.body,
        jaarplanId: req.params.id,
        createdBy: user.id,
      });
      const actie = await storage.createJaarplanActie(parsed);
      res.json(actie);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.delete("/api/jaarplan/acties/:actieId", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteJaarplanActie(req.params.actieId);
    res.json({ success: true });
  });

  app.patch("/api/jaarplan/acties/:actieId", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { status } = req.body;
      const updated = await storage.updateJaarplanActie(req.params.actieId, { status });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  // ── Planonderdelen ─────────────────────────────────────────────────────────
  app.get("/api/jaarplan/:id/onderdelen", requireAuth, async (req, res) => {
    const onderdelen = await storage.getJaarplanOnderdelen(req.params.id);
    res.json(onderdelen);
  });

  app.post("/api/jaarplan/:id/onderdelen", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const parsed = insertJaarplanOnderdeelSchema.parse({
        ...req.body,
        jaarplanId: req.params.id,
      });
      const onderdeel = await storage.createJaarplanOnderdeel(parsed);
      res.json(onderdeel);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.patch("/api/jaarplan/onderdelen/:id", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { naam } = req.body;
      if (!naam?.trim()) return res.status(400).json({ message: "Naam is verplicht" });
      const updated = await storage.updateJaarplanOnderdeel(req.params.id, naam.trim());
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Bijwerken mislukt" });
    }
  });

  app.delete("/api/jaarplan/onderdelen/:id", requireAuth, async (req, res) => {
    if (!canEditJaarplan((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    await storage.deleteJaarplanOnderdeel(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/jaarplan/onderdelen/:id/acties", requireAuth, async (req, res) => {
    const acties = await storage.getJaarplanActiesByOnderdeel(req.params.id);
    res.json(acties);
  });

  app.post("/api/jaarplan/onderdelen/:id/acties", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!canEditJaarplan(user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const parsed = insertJaarplanActieSchema.parse({
        ...req.body,
        onderdeelId: req.params.id,
        createdBy: user.id,
      });
      const actie = await storage.createJaarplanActie(parsed);
      res.json(actie);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Validatiefout" });
    }
  });

  app.get("/api/help-content", requireAuth, async (_req, res) => {
    const items = await storage.getAllHelpContent();
    res.json(items);
  });

  app.put("/api/help-content", requireAuth, async (req, res) => {
    if (!isAdminRole((req as any).user.role)) {
      return res.status(403).json({ message: "Geen toegang" });
    }
    try {
      const { pageRoute, title, content } = req.body;
      if (!pageRoute || !title || !content) {
        return res.status(400).json({ message: "Alle velden zijn verplicht" });
      }
      const updated = await storage.upsertHelpContent({ pageRoute, title, content });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Fout bij opslaan" });
    }
  });

  app.get("/api/kartografie-productie", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const [kpRows, mpkRows, samRows] = await Promise.all([
        storage.getKartografieProductie(),
        storage.getAllMaandProdKartograaf(),
        storage.getAllMaandProdSamenvatting(),
      ]);
      const MAAND_AFB = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
      // Bestaande (jaar, maandNaam) sleutels in kartografie_productie
      const kpKeys = new Set(kpRows.map(r => `${r.jaar}-${r.maand}`));
      const prod = (r: { mbr: number; kad_spl: number; gr_uitz: number }) => r.mbr + r.kad_spl + r.gr_uitz;
      const extraRows: (typeof kpRows[0])[] = samRows
        .filter(s => {
          const maandNaam = MAAND_AFB[s.maand - 1];
          return maandNaam && !kpKeys.has(`${s.jaar}-${maandNaam}`);
        })
        .map(s => {
          const maandNaam = MAAND_AFB[s.maand - 1]!;
          const kRows = mpkRows.filter(r => r.jaar === s.jaar && r.maand === s.maand && r.kartograaf !== "afgeboekt_stukken");
          const totAf = kRows.reduce((acc, r) => acc + prod(r), 0);
          const aantalKart = s.aantal_kartografen || 1;
          return { id: 0, jaar: s.jaar, maand: maandNaam, binnengekomen: s.binnengekomen, afgehandeld: totAf, gemiddeld: aantalKart > 0 ? +((totAf / aantalKart) * 10).toFixed(1) : 0, kartografen: s.aantal_kartografen };
        });
      res.json([...kpRows, ...extraRows].sort((a, b) => a.jaar !== b.jaar ? a.jaar - b.jaar : MAAND_AFB.indexOf(a.maand) - MAAND_AFB.indexOf(b.maand)));
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.post("/api/kartografie-productie/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || (!isAdminRole(user.role) && user.role !== "manager")) return res.status(403).json({ message: "Alleen beheerders of managers" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "Geen geldige rijen" });
      }
      const parsed = rows.map((r: unknown) => insertKartografieProductieSchema.parse(r));
      const result = await storage.bulkUpsertKartografieProductie(parsed);
      res.json({ imported: result.length, rows: result });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Fout bij importeren" });
    }
  });

  app.delete("/api/kartografie-productie/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || (!isAdminRole(user.role) && user.role !== "manager")) return res.status(403).json({ message: "Alleen beheerders of managers" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try {
      await storage.deleteKartografieProductieByJaar(jaar);
      res.json({ message: "Verwijderd" });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij verwijderen" });
    }
  });

  // ── Maandelijkse productie kartografen ──────────────────────────────────
  app.get("/api/maand-prod-kartograaf", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const jaar = parseInt(req.query.jaar as string) || new Date().getFullYear();
    const maand = parseInt(req.query.maand as string) || new Date().getMonth() + 1;
    try {
      const [kartografen, samenvatting] = await Promise.all([
        storage.getMaandProdKartograaf(jaar, maand),
        storage.getMaandProdSamenvatting(jaar, maand),
      ]);
      res.json({ kartografen, samenvatting: samenvatting ?? null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.get("/api/maand-prod-kartograaf/alle", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const rows = await storage.getAllMaandProdKartograaf();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.get("/api/maand-prod-kartograaf/jaar/:jaar", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try {
      const rows = await storage.getMaandProdKartograafJaar(jaar);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.post("/api/maand-prod-kartograaf", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const { jaar, maand, kartografen, samenvatting } = req.body;
    if (!jaar || !maand || !Array.isArray(kartografen)) {
      return res.status(400).json({ message: "Ongeldige data" });
    }
    try {
      const parsedRows = kartografen.map((r: unknown) =>
        insertMaandProdKartograafSchema.parse(r)
      );
      await storage.saveMaandProdKartograaf(parsedRows);
      const parsedSam = insertMaandProdSamenvattingSchema.parse(samenvatting);
      const savedSam = await storage.saveMaandProdSamenvatting(parsedSam);

      // ── Write-through: sync naar trend_kartografen_hist en kartografie_productie ──
      const MAAND_AFKORTINGEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
      const maandNaam = MAAND_AFKORTINGEN[parsedSam.maand - 1] ?? "Onb";

      // Prod = mbr + kad_spl + gr_uitz (excl. ex_pl, plot_coor, losse_mbr)
      const prod = (r: { mbr: number; kad_spl: number; gr_uitz: number }) => r.mbr + r.kad_spl + r.gr_uitz;

      // Normaliseer kartograaf-naam naar sleutel (verwijder punten en spaties)
      // "E. Galeano" → "egaleano", "J. Pieters" → "jpieters", "N. Sambo" → "nsambo"
      const toKey = (naam: string): string => naam.toLowerCase().replace(/[.\s]+/g, "");

      const actieveRijen = parsedRows.filter(r => r.kartograaf !== "afgeboekt_stukken");
      const totAfgehandeld = actieveRijen.reduce((s, r) => s + prod(r), 0);

      const getProd = (key: string) => {
        const match = actieveRijen.find(r => toKey(r.kartograaf) === key || r.kartograaf.toLowerCase().includes(key.replace(/j|e|n/, "")));
        return match ? prod(match) : 0;
      };

      // Upsert trend_kartografen_hist (per maand, niet bulk-delete)
      await storage.upsertTrendKartografenHistRow(insertTrendKartografenHistSchema.parse({
        jaar: parsedSam.jaar,
        maand: parsedSam.maand,
        egaleano: getProd("egaleano"),
        jpieters: getProd("jpieters"),
        nsambo: getProd("nsambo"),
        binnengekomen: parsedSam.binnengekomen,
        afgehandeld: totAfgehandeld,
      }));

      // Upsert kartografie_productie
      const aantalKart = parsedSam.aantal_kartografen || 1;
      await storage.bulkUpsertKartografieProductie([insertKartografieProductieSchema.parse({
        jaar: parsedSam.jaar,
        maand: maandNaam,
        binnengekomen: parsedSam.binnengekomen,
        afgehandeld: totAfgehandeld,
        gemiddeld: aantalKart > 0 ? +((totAfgehandeld / aantalKart) * 10).toFixed(1) : 0,
        kartografen: parsedSam.aantal_kartografen,
      })]);

      res.json({ success: true, samenvatting: savedSam });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij opslaan" });
    }
  });

  // ── Helper: controleer of gebruiker admin of manager is ─────────────────────
  function isAdminOrManager(user: any): boolean {
    return isAdminRole(user?.role) || user?.role === "manager";
  }

  // ── Maandelijkse productie Landmeters ─────────────────────────────────────
  app.post("/api/maand-prod-landmeter/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertMaandProdLandmeterSchema.parse(r));
      await storage.bulkUpsertMaandProdLandmeter(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/maand-prod-landmeter/jaar/:jaar", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try {
      const rows = await storage.getMaandProdLandmeterJaar(jaar);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.get("/api/maand-prod-landmeter/alle", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const [rijen, samenvatting] = await Promise.all([
        storage.getAllMaandProdLandmeter(),
        storage.getAllMaandProdSamenvattingLm(),
      ]);
      res.json({ rijen, samenvatting });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.get("/api/maand-prod-landmeter", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const jaar = parseInt(req.query.jaar as string) || new Date().getFullYear();
    const maand = parseInt(req.query.maand as string) || new Date().getMonth() + 1;
    try {
      const [landmeters, samenvatting] = await Promise.all([
        storage.getMaandProdLandmeter(jaar, maand),
        storage.getMaandProdSamenvattingLm(jaar, maand),
      ]);
      res.json({ landmeters, samenvatting: samenvatting ?? null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij ophalen" });
    }
  });

  app.post("/api/maand-prod-landmeter", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const { jaar, maand, landmeters, samenvatting } = req.body;
    if (!jaar || !maand || !Array.isArray(landmeters)) {
      return res.status(400).json({ message: "Ongeldige data" });
    }
    try {
      const parsedRows = landmeters.map((r: unknown) => insertMaandProdLandmeterSchema.parse(r));
      await storage.saveMaandProdLandmeter(parsedRows);
      const parsedSam = insertMaandProdSamenvattingLmSchema.parse(samenvatting);
      const savedSam = await storage.saveMaandProdSamenvattingLm(parsedSam);

      // ── Write-through naar trend_km_buiten ────────────────────────────────
      const totProd = (r: { meting: number; gr_uitz: number }) => r.meting + r.gr_uitz;
      const actieveRijen = parsedRows.filter(r => r.landmeter !== "afgeboekte_stukken");
      const totAfgehandeld = actieveRijen.reduce((s, r) => s + totProd(r), 0);
      const totUitbesteding = actieveRijen.reduce((s, r) => s + r.ex_uitb, 0);
      const aantalLm = parsedSam.aantal_landmeters || 1;
      const gemiddeld = aantalLm > 0 ? +((totAfgehandeld / aantalLm) * 10).toFixed(1) : 0;

      await storage.upsertTrendKmBuitenRow(insertTrendKmBuitenSchema.parse({
        jaar: parsedSam.jaar,
        maand: parsedSam.maand,
        binnengekomen: parsedSam.binnengekomen,
        afgehandeld: totAfgehandeld,
        uitbesteding: totUitbesteding,
        gemiddeld,
        landmeters: parsedSam.aantal_landmeters,
      }));

      res.json({ success: true, samenvatting: savedSam });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Fout bij opslaan" });
    }
  });

  // ── Trend KM Buiten ──────────────────────────────────────────────────────────
  app.get("/api/trend-km-buiten", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const [trendRows, lmRows, samRows] = await Promise.all([
        storage.getTrendKmBuiten(),
        storage.getAllMaandProdLandmeter(),
        storage.getAllMaandProdSamenvattingLm(),
      ]);
      const trendKeys = new Set(trendRows.map(r => `${r.jaar}-${r.maand}`));
      const totProd = (r: { meting: number; gr_uitz: number }) => r.meting + r.gr_uitz;
      const extraRows = samRows
        .filter(s => !trendKeys.has(`${s.jaar}-${s.maand}`))
        .map(s => {
          const actief = lmRows.filter(r => r.jaar === s.jaar && r.maand === s.maand && r.landmeter !== "afgeboekte_stukken");
          const totAf = actief.reduce((acc, r) => acc + totProd(r), 0);
          const totUitb = actief.reduce((acc, r) => acc + r.ex_uitb, 0);
          const aantalLm = s.aantal_landmeters || 1;
          return { id: 0, jaar: s.jaar, maand: s.maand, binnengekomen: s.binnengekomen, afgehandeld: totAf, uitbesteding: totUitb, gemiddeld: aantalLm > 0 ? +((totAf / aantalLm) * 10).toFixed(1) : 0, landmeters: s.aantal_landmeters };
        });
      res.json([...trendRows, ...extraRows].sort((a, b) => a.jaar !== b.jaar ? a.jaar - b.jaar : a.maand - b.maand));
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-km-buiten/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendKmBuitenSchema.parse(r));
      await storage.bulkUpsertTrendKmBuiten(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-km-buiten/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendKmBuitenByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Maand Prod KM Info ────────────────────────────────────────────────────────
  app.get("/api/maand-prod-km-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const jaar = parseInt(req.query.jaar as string) || new Date().getFullYear();
      const rows = await storage.getMaandProdKmInfo(jaar);
      res.json(rows);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/maand-prod-km-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertMaandProdKmInfoSchema.parse(r));
      await storage.saveMaandProdKmInfo(parsed);
      for (const r of parsed) {
        const kkp = r.topo_kaarten + r.plot_overzicht + r.plot_grens_uitz + r.afdrukken_kaarten;
        const sa  = r.sit_a4 + r.sit_a3;
        const rm  = r.reg_meetbrief;
        const re  = r.reg_extractplan;
        const ik  = r.inzage_kad;
        const db_ = r.uur_tarieven + r.digitale_bestanden;
        const km  = r.blok_maten + r.kopie_veldwerk + r.coordinaten + r.hulp_kaart + r.terrein_onderzoek + r.proces_verbaal;
        await storage.upsertTrendKmInfoRow({ jaar: r.jaar, maand: r.maand, kkp, sa, rm, re, ik, db: db_, km });
      }
      res.json({ saved: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ── Trend KM Info ─────────────────────────────────────────────────────────────
  app.get("/api/trend-km-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try { res.json(await storage.getTrendKmInfo()); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-km-info/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendKmInfoSchema.parse(r));
      await storage.bulkUpsertTrendKmInfo(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-km-info/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendKmInfoByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Maand Prod OR Info ────────────────────────────────────────────────────────
  app.get("/api/maand-prod-or-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const jaar = parseInt(req.query.jaar as string) || new Date().getFullYear();
      res.json(await storage.getMaandProdOrInfo(jaar));
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/maand-prod-or-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertMaandProdOrInfoSchema.parse(r));
      await storage.saveMaandProdOrInfo(parsed);
      for (const r of parsed) {
        const inzagen     = r.inzage_or + r.bulkdata + r.verkorte_inzage + r.schriftelijke_inzage + r.kopie_akte;
        const verklaring  = r.verklaring_eensluidend + r.verklaring_geen_or;
        const getuigschrift = r.getuigschrift_volgende + r.getuigschrift_or;
        await storage.upsertTrendOrInfoRow({ jaar: r.jaar, maand: r.maand, inzagen, her_inzage: r.her_inzage, na_inzage: r.na_inzage, kadastaal_legger: r.kadastrale_legger, verklaring, getuigschrift });
      }
      res.json({ saved: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ── Maandelijkse Productie OR Notaris ─────────────────────────────────────────
  app.get("/api/maand-prod-or-notaris/jaar/:jaar", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try {
      res.json(await storage.getMaandProdOrNotarisJaar(jaar));
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.get("/api/maand-prod-or-notaris", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const jaar  = parseInt(req.query.jaar  as string) || new Date().getFullYear();
      const maand = parseInt(req.query.maand as string) || new Date().getMonth() + 1;
      res.json(await storage.getMaandProdOrNotaris(jaar, maand));
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/maand-prod-or-notaris", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertMaandProdOrNotarisSchema.parse(r));
      await storage.saveMaandProdOrNotaris(parsed);
      for (const r of parsed) {
        const waarde = r.aktes + r.inschrijvingen + r.doorhalingen + r.opheffingen + r.beslagen + r.cessies;
        await storage.upsertTrendOrNotarisRow({ jaar: r.jaar, maand: r.maand, notaris_key: r.notaris_key, waarde });
      }
      const aktesTot      = parsed.reduce((s, r) => s + r.aktes, 0);
      const inschrijvTot  = parsed.reduce((s, r) => s + r.inschrijvingen, 0);
      const doorhalinTot  = parsed.reduce((s, r) => s + r.doorhalingen, 0);
      const opheffTot     = parsed.reduce((s, r) => s + r.opheffingen, 0);
      const beslagenTot   = parsed.reduce((s, r) => s + r.beslagen, 0);
      const cessiesTot    = parsed.reduce((s, r) => s + r.cessies, 0);
      const { jaar, maand } = parsed[0];
      await storage.upsertTrendOrAlgemeenRow({ jaar, maand, aktes: aktesTot, inschrijvingen: inschrijvTot, doorhalingen: doorhalinTot, opheffingen: opheffTot, beslagen: beslagenTot, cessies: cessiesTot });
      res.json({ saved: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ── Trend OR Info ─────────────────────────────────────────────────────────────
  app.get("/api/trend-or-info", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try { res.json(await storage.getTrendOrInfo()); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-or-info/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendOrInfoSchema.parse(r));
      await storage.bulkUpsertTrendOrInfo(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-or-info/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendOrInfoByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Trend OR Algemeen ─────────────────────────────────────────────────────────
  app.get("/api/trend-or-algemeen", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try { res.json(await storage.getTrendOrAlgemeen()); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-or-algemeen/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendOrAlgemeenSchema.parse(r));
      await storage.bulkUpsertTrendOrAlgemeen(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-or-algemeen/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendOrAlgemeenByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Trend OR Notaris ──────────────────────────────────────────────────────────
  app.get("/api/trend-or-notaris", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try { res.json(await storage.getTrendOrNotaris()); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-or-notaris/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendOrNotarisSchema.parse(r));
      await storage.bulkUpsertTrendOrNotaris(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-or-notaris/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendOrNotarisByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Trend Kartografen historisch ──────────────────────────────────────────────
  app.get("/api/trend-kartografen-hist", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Niet ingelogd" });
    try {
      const [trendRows, mpkRows, samRows] = await Promise.all([
        storage.getTrendKartografenHist(),
        storage.getAllMaandProdKartograaf(),
        storage.getAllMaandProdSamenvatting(),
      ]);
      // Maak set van bestaande (jaar, maand) sleutels in trend_hist
      const trendKeys = new Set(trendRows.map(r => `${r.jaar}-${r.maand}`));
      // Naam-normalisatie: verwijder punten en spaties
      const toKey = (naam: string) => naam.toLowerCase().replace(/[.\s]+/g, "");
      // Prod = mbr + kad_spl + gr_uitz
      const prod = (r: { mbr: number; kad_spl: number; gr_uitz: number }) => r.mbr + r.kad_spl + r.gr_uitz;
      // Bereken afgeleidde trend-rijen vanuit maand_prod voor ontbrekende (jaar, maand)
      const extraRows = samRows
        .filter(s => !trendKeys.has(`${s.jaar}-${s.maand}`))
        .map(s => {
          const kRows = mpkRows.filter(r => r.jaar === s.jaar && r.maand === s.maand && r.kartograaf !== "afgeboekt_stukken");
          const totAf = kRows.reduce((acc, r) => acc + prod(r), 0);
          const getProd = (key: string) => {
            const match = kRows.find(r => toKey(r.kartograaf) === key || r.kartograaf.toLowerCase().includes(key.slice(1)));
            return match ? prod(match) : 0;
          };
          return { id: 0, jaar: s.jaar, maand: s.maand, egaleano: getProd("egaleano"), jpieters: getProd("jpieters"), nsambo: getProd("nsambo"), binnengekomen: s.binnengekomen, afgehandeld: totAf };
        });
      res.json([...trendRows, ...extraRows].sort((a, b) => a.jaar !== b.jaar ? a.jaar - b.jaar : a.maand - b.maand));
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/trend-kartografen-hist/import", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen geldige rijen" });
      const parsed = rows.map((r: unknown) => insertTrendKartografenHistSchema.parse(r));
      await storage.bulkUpsertTrendKartografenHist(parsed);
      res.json({ imported: parsed.length });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/trend-kartografen-hist/:jaar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (!user || !isAdminOrManager(user)) return res.status(403).json({ message: "Geen toegang" });
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) return res.status(400).json({ message: "Ongeldig jaar" });
    try { await storage.deleteTrendKartografenHistByJaar(jaar); res.json({ message: "Verwijderd" }); } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Werktijden ─────────────────────────────────────────────────────────────

  // GET /api/werktijden/my-performance — Maandelijkse prikklokperformance voor ingelogde medewerker
  app.get("/api/werktijden/my-performance", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const kadasterId = currentUser.kadasterId;

      // If no kadasterId, still return months with empty data (don't hide the card)
      const allRecords = kadasterId ? await storage.getWerktijden(kadasterId) : [];
      const allAbsences = await storage.getAbsencesByUser(currentUser.id);
      const approvedAbsences = allAbsences.filter((a: any) => a.status === "approved");

      // Constants matching werktijden.tsx exactly
      const _M = 60, _H = 3600;
      const ANA_BLK1_S  = 7  * _H;              // 07:00
      const ANA_BLK1_E  = 8  * _H;              // 08:00
      const ANA_BLK2_S  = 11 * _H + 45 * _M;   // 11:45
      const ANA_BLK2_E  = 12 * _H;              // 12:00
      const ANA_BLK3_S  = 13 * _H + 30 * _M;   // 13:30
      const ANA_BLK3_E  = 14 * _H;              // 14:00
      const ANA_BLK4_WD = 16 * _H + 45 * _M;   // 16:45 Ma-Do
      const ANA_BLK4_FR = 16 * _H + 30 * _M;   // 16:30 Vr
      const ANA_BLK4_E  = 18 * _H;              // 18:00
      const ANA_BREAK_S = 12 * _H;              // 12:00
      const ANA_BREAK_E = 13 * _H + 30 * _M;   // 13:30
      const ANA_TARGET_WD = 8  * _H;            // 8u target Ma-Do
      const ANA_TARGET_FR = 7  * _H + 30 * _M; // 7.5u target Vr

      const secOfDay = (dt: Date) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
      const parseCt  = (ct: any): Date => ct instanceof Date ? ct : new Date(ct);

      const hasApprovedAbsence = (dateStr: string): boolean =>
        approvedAbsences.some((a: any) => a.startDate <= dateStr && a.endDate >= dateStr);

      const now = new Date();
      const monthsResult: {
        month: string; label: string; werkdagen: number;
        verzuim: number; teLaat: number; teVroegUit: number; saldoMinuten: number;
      }[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year        = monthDate.getFullYear();
        const month       = monthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lastDay     = i === 0 ? now.getDate() : daysInMonth;

        const werkdagen: string[] = [];
        for (let day = 1; day <= lastDay; day++) {
          const dow = new Date(year, month, day).getDay();
          if (dow >= 1 && dow <= 5) {
            werkdagen.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
          }
        }

        const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
        const recordsByDay: Record<string, typeof allRecords> = {};
        for (const r of allRecords) {
          const ct = parseCt(r.checktime);
          const dk = `${ct.getFullYear()}-${String(ct.getMonth() + 1).padStart(2, "0")}-${String(ct.getDate()).padStart(2, "0")}`;
          if (dk.startsWith(monthStr)) {
            if (!recordsByDay[dk]) recordsByDay[dk] = [];
            recordsByDay[dk].push(r);
          }
        }

        let verzuim = 0, teLaat = 0, teVroegUit = 0, saldoSec = 0;

        for (const datum of werkdagen) {
          const dayRecs = recordsByDay[datum] || [];
          // Like werktijden.tsx: only process days that have records
          if (dayRecs.length === 0) continue;

          const isFriday  = new Date(datum + "T00:00:00").getDay() === 5;
          const targetSec = isFriday ? ANA_TARGET_FR : ANA_TARGET_WD;
          const b4Start   = isFriday ? ANA_BLK4_FR   : ANA_BLK4_WD;
          const absent    = hasApprovedAbsence(datum);

          const sorted  = dayRecs.slice().sort((a, b) => parseCt(a.checktime).getTime() - parseCt(b.checktime).getTime());
          const inRecs  = sorted.filter(r => r.checktype === "in");
          const outRecs = sorted.filter(r => r.checktype === "out");

          // Block compliance — identical to computeDagAnalyse in werktijden.tsx
          const blok1Ok = inRecs.some(r  => { const s = secOfDay(parseCt(r.checktime));  return s >= ANA_BLK1_S && s <= ANA_BLK1_E; });
          const blok2Ok = outRecs.some(r => { const s = secOfDay(parseCt(r.checktime));  return s >= ANA_BLK2_S && s <= ANA_BLK2_E + 30 * _M; });
          const blok3Ok = inRecs.some(r  => { const s = secOfDay(parseCt(r.checktime));  return s >= ANA_BLK3_S && s <= ANA_BLK3_E + 30 * _M; });
          const blok4Ok = outRecs.some(r => { const s = secOfDay(parseCt(r.checktime));  return s >= b4Start - 15 * _M && s <= ANA_BLK4_E; });

          // Count complete in-out pairs (like completePairs in frontend)
          let pairCount = 0;
          let pendingIn: Date | null = null;
          let dayWerktijdSec = 0;
          for (const r of sorted) {
            const ct = parseCt(r.checktime);
            if (r.checktype === "in") {
              pendingIn = ct;
            } else if (pendingIn !== null) {
              pairCount++;
              const durSec = (ct.getTime() - pendingIn.getTime()) / 1000;
              const inSec  = secOfDay(pendingIn);
              const outSec = secOfDay(ct);
              const brkOv  = Math.max(0, Math.min(outSec, ANA_BREAK_E) - Math.max(inSec, ANA_BREAK_S));
              dayWerktijdSec += Math.max(0, durSec - brkOv);
              pendingIn = null;
            }
          }

          // Verzuim: has complete pairs but missed at least one required block (same as werktijden.tsx)
          if (!absent && pairCount > 0 && (!blok1Ok || !blok2Ok || !blok3Ok || !blok4Ok)) {
            verzuim++;
          }

          // Te laat: count per IN record (same as allTeLaat.length in werktijden.tsx)
          for (const r of inRecs) {
            const sec = secOfDay(parseCt(r.checktime));
            if ((sec > ANA_BLK1_E && sec < 13 * _H) || (sec > ANA_BLK3_E && sec >= 12 * _H)) {
              teLaat++;
            }
          }

          // Te vroeg uit: count per OUT record (same as allTeVroegUit.length in werktijden.tsx)
          for (const r of outRecs) {
            const sec = secOfDay(parseCt(r.checktime));
            if (!absent && sec >= ANA_BREAK_E && sec < b4Start) {
              teVroegUit++;
            }
          }

          // Saldo: absent days contribute 0, present days contribute (worked - target)
          if (!absent) {
            saldoSec += dayWerktijdSec - targetSec;
          }
        }

        monthsResult.push({
          month: monthStr,
          label: monthDate.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
          werkdagen: werkdagen.length,
          verzuim, teLaat, teVroegUit,
          saldoMinuten: Math.round(saldoSec / 60),
        });
      }

      res.json({ months: monthsResult });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.get("/api/werktijden", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const isManager = isAdminRole(currentUser.role) || currentUser.role === "manager" || currentUser.role === "manager_az";
      const useridFilter = req.query.userid as string | undefined;
      if (isManager) {
        const records = await storage.getWerktijden(useridFilter);
        res.json(records);
      } else {
        const records = await storage.getWerktijden(currentUser.kadasterId || undefined);
        res.json(records);
      }
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.delete("/api/werktijden/:logid", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || !isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const logid = parseInt(req.params.logid);
      if (isNaN(logid)) return res.status(400).json({ message: "Ongeldig logid" });
      await storage.deleteWerktijden(logid);
      res.json({ message: "Verwijderd" });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // POST /api/werktijden — Handmatige registratie toevoegen
  app.post("/api/werktijden", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || (!isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az")) {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const { userid, datum, tijdstip, checktype } = req.body;
      if (!userid || !datum || !tijdstip || !checktype) {
        return res.status(400).json({ message: "Vereiste velden ontbreken: userid, datum, tijdstip, checktype" });
      }
      if (checktype !== "in" && checktype !== "out") {
        return res.status(400).json({ message: "checktype moet 'in' of 'out' zijn" });
      }
      const checktimeStr = `${datum}T${tijdstip}:00`;
      const checktime = new Date(checktimeStr);
      if (isNaN(checktime.getTime())) {
        return res.status(400).json({ message: "Ongeldige datum/tijdcombinatie" });
      }
      const record = await storage.createWerktijden({ userid, checktime, checktype });
      res.status(201).json(record);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Prikklok Import ────────────────────────────────────────────────────────
  // POST /api/werktijden/import — Verwerkt CSV-upload van prikklokdata
  app.post("/api/werktijden/import", requireAuth, uploadCsv.single("bestand"), async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || !isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Alleen managers mogen prikklokdata importeren" });
      }
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "Geen bestand ontvangen" });

      const bestandsnaam = file.originalname;
      const rawText: string = file.buffer?.toString("utf-8") ?? fs.readFileSync(file.path, "utf-8");
      if (file.path) try { fs.unlinkSync(file.path); } catch {}

      // ── CSV parsen ──────────────────────────────────────────────────────────
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return res.status(400).json({ message: "Bestand is leeg" });

      // Detecteer separator (puntkomma, tab of komma)
      const sep = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";

      // Helper: parseer datum in diverse formaten naar Date
      const parseFlexDate = (raw: string): Date | null => {
        // D-M-YYYY HH:MM[:SS] of DD-MM-YYYY HH:MM[:SS]
        const m1 = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (m1) {
          const [, d, mo, y, h, mn, s] = m1;
          const dt = new Date(`${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}T${h.padStart(2,"0")}:${mn}:${(s||"00").padStart(2,"0")}`);
          if (!isNaN(dt.getTime())) return dt;
        }
        // D/M/YYYY HH:MM[:SS] of DD/MM/YYYY HH:MM[:SS]
        const m2 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (m2) {
          const [, d, mo, y, h, mn, s] = m2;
          const dt = new Date(`${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}T${h.padStart(2,"0")}:${mn}:${(s||"00").padStart(2,"0")}`);
          if (!isNaN(dt.getTime())) return dt;
        }
        // Overige formaten (ISO, etc.)
        const dt = new Date(raw);
        return isNaN(dt.getTime()) ? null : dt;
      };

      // ── Kolomdetectie ───────────────────────────────────────────────────────
      const USERID_NAMES = ["userid","pin","personeelsnr","employee_id","emp_id","badgeid","badge"];
      const TIME_NAMES   = ["checktime","datetime","timestamp","tijdstip","check_time","date_time","tijd"];
      const TYPE_NAMES   = ["checktype","type","status","check_type","richting","direction","action"];

      const headerCols = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));
      const colUserIdName = USERID_NAMES.find(c => headerCols.includes(c));
      const colTimeName   = TIME_NAMES.find(c => headerCols.includes(c));
      const colTypeName   = TYPE_NAMES.find(c => headerCols.includes(c));

      let idxUser: number;
      let idxTime: number;
      let idxType: number;
      let dataStartLine: number;

      if (colUserIdName && colTimeName) {
        // Bestand met herkenbare headers
        idxUser = headerCols.indexOf(colUserIdName);
        idxTime = headerCols.indexOf(colTimeName);
        idxType = colTypeName ? headerCols.indexOf(colTypeName) : -1;
        dataStartLine = 1;
      } else {
        // Geen herkenbare headers — auto-detectie op basis van inhoud
        // Probeer eerste rij als data; als geen datum gevonden probeer tweede rij (headers aanwezig maar onbekend)
        let testCols = lines[0].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));
        let testDateIdx = testCols.findIndex(c => parseFlexDate(c) !== null);
        if (testDateIdx < 0 && lines.length > 1) {
          testCols = lines[1].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));
          testDateIdx = testCols.findIndex(c => parseFlexDate(c) !== null);
          dataStartLine = 1; // rij 0 is headerrij (onbekend), data begint op rij 1
        } else {
          dataStartLine = 0; // rij 0 is al data
        }
        if (testDateIdx < 0) {
          return res.status(400).json({ message: `Geen datum/tijdkolom herkend. Controleer het bestandsformaat. Eerste rij: ${lines[0]}` });
        }
        idxTime = testDateIdx;
        idxType = -1; // geen type in headerloze bestanden → blok-gebaseerd
        // Userid = laatste puur numerieke kolom vóór de datumkolom
        // (ZKTeco-formaat: LogID ; UserID ; DateTime ; ...)
        const numericBefore = testCols
          .map((c, i) => ({ i, c }))
          .filter(({ i, c }) => i < testDateIdx && /^\d+$/.test(c) && c.length > 0);
        if (numericBefore.length === 0) {
          return res.status(400).json({ message: `Geen userid-kolom herkend. Eerste rij: ${lines[0]}` });
        }
        idxUser = numericBefore[numericBefore.length - 1].i;
      }

      // Alle bekende users ophalen voor validatie
      const allUsers = await storage.getUsers();
      const knownUserids = new Set(allUsers.map((u: any) => u.kadasterId).filter(Boolean));

      const eventLogs: { eventType: string; userid?: string; checktime?: Date; bericht: string }[] = [];
      let foutRecords = 0;
      let waarschuwingen = 0;

      // Blokdefinities: doeltijd in seconden van de dag + verwacht type
      // blok1=inklok (07:30), blok2=uitklok (11:52), blok3=inklok (13:45), blok4=uitklok (17:22 ma-do / 17:07 vr)
      const _H = 3600, _M = 60;
      const getBlokken = (isFriday: boolean) => [
        { target: 7*_H + 30*_M,  type: "in"  },  // blok1 center 07:30
        { target: 11*_H + 52*_M, type: "out" },  // blok2 center 11:52
        { target: 13*_H + 45*_M, type: "in"  },  // blok3 center 13:45
        { target: isFriday ? 17*_H + 15*_M : 17*_H + 22*_M, type: "out" }, // blok4
      ];

      // Stap 1: parseer alle regels, records zonder expliciet type worden later verwerkt
      type ParsedRec = { userid: string; checktime: Date; checktype: string | null; lineNum: number };
      const parsedRecs: ParsedRec[] = [];

      for (let i = dataStartLine; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));
        const rawUserId = cols[idxUser];
        const rawTime   = cols[idxTime];
        const rawType   = idxType >= 0 ? cols[idxType] : "";

        if (!rawUserId || !rawTime) {
          foutRecords++;
          eventLogs.push({ eventType: "error", bericht: `Rij ${i + 1}: ontbrekende userid of tijdstip` });
          continue;
        }

        // Tijdstip parsen via parseFlexDate (ondersteunt DD-MM-YYYY, D-M-YYYY, ISO, etc.)
        const checktime = parseFlexDate(rawTime);
        if (!checktime) {
          foutRecords++;
          eventLogs.push({ eventType: "error", userid: rawUserId, bericht: `Rij ${i + 1}: ongeldig tijdstip "${rawTime}"` });
          continue;
        }

        // Checktype parsen (null = geen expliciet type, later per blok bepalen)
        // Numerieke waarden (0, 1, 2, ...) zijn systeem-specifiek en worden genegeerd → blok-gebaseerd
        let checktype: string | null = null;
        if (rawType && !/^\d+$/.test(rawType.trim())) {
          const t = rawType.toLowerCase().trim();
          if (["out", "c/o", "o", "uit", "uitklok"].includes(t)) checktype = "out";
          else if (["in", "c/i", "i", "inklok"].includes(t)) checktype = "in";
          else {
            checktype = null; // onbekend type → ook blok-gebaseerd
            waarschuwingen++;
            eventLogs.push({ eventType: "warning", userid: rawUserId, checktime, bericht: `Rij ${i + 1}: onbekend checktype "${rawType}", wordt blok-gebaseerd bepaald` });
          }
        }

        // Valideer userid
        if (!knownUserids.has(rawUserId)) {
          waarschuwingen++;
          eventLogs.push({ eventType: "warning", userid: rawUserId, checktime, bericht: `Rij ${i + 1}: userid "${rawUserId}" niet gevonden in systeem` });
        }

        // Buiten bereik?
        const h = checktime.getHours();
        if (h < 5 || h > 22) {
          waarschuwingen++;
          eventLogs.push({ eventType: "warning", userid: rawUserId, checktime, bericht: `Rij ${i + 1}: tijdstip ${checktime.toTimeString().slice(0, 5)} valt buiten normaal bereik (05:00–22:00)` });
        }

        parsedRecs.push({ userid: rawUserId, checktime, checktype, lineNum: i + 1 });
      }

      // Stap 2: wijs types toe aan records zonder expliciet type via blok-matching
      // Groepeer per user+dag, sorteer op tijd, dan match naar dichtstbijzijnde vrije blok
      const dayGroups: Record<string, ParsedRec[]> = {};
      for (const r of parsedRecs) {
        const key = `${r.userid}::${r.checktime.toISOString().slice(0, 10)}`;
        if (!dayGroups[key]) dayGroups[key] = [];
        dayGroups[key].push(r);
      }

      for (const group of Object.values(dayGroups)) {
        group.sort((a, b) => a.checktime.getTime() - b.checktime.getTime());
        const isFriday = group[0].checktime.getDay() === 5;
        const blokken = getBlokken(isFriday);
        const assigned = new Set<number>(); // welke blok-indices al bezet zijn

        // Verwerk records op tijd-volgorde; expliciet-getypte records claimen ook een blok
        for (const r of group) {
          const sec = r.checktime.getHours() * _H + r.checktime.getMinutes() * _M + r.checktime.getSeconds();

          if (r.checktype !== null) {
            // Expliciet type: markeer de dichtstbijzijnde passende blok als bezet
            let nearest = -1, minDist = Infinity;
            for (let b = 0; b < blokken.length; b++) {
              if (!assigned.has(b) && blokken[b].type === r.checktype) {
                const dist = Math.abs(sec - blokken[b].target);
                if (dist < minDist) { minDist = dist; nearest = b; }
              }
            }
            if (nearest >= 0) assigned.add(nearest);
          } else {
            // Geen expliciet type: dichtstbijzijnde vrije blok bepaalt het type
            let nearest = -1, minDist = Infinity;
            for (let b = 0; b < blokken.length; b++) {
              if (!assigned.has(b)) {
                const dist = Math.abs(sec - blokken[b].target);
                if (dist < minDist) { minDist = dist; nearest = b; }
              }
            }
            if (nearest >= 0) {
              r.checktype = blokken[nearest].type;
              assigned.add(nearest);
            } else {
              // Alle blokken bezet: gebruik alternerend op basis van aantal al toegewezen
              r.checktype = assigned.size % 2 === 0 ? "in" : "out";
            }
          }
        }
      }

      // Stap 3: zet parsedRecs om naar definitieve records (zelfde volgorde als CSV)
      const records: { userid: string; checktime: Date; checktype: string }[] = parsedRecs.map(r => ({
        userid: r.userid,
        checktime: r.checktime,
        checktype: r.checktype ?? "in",
      }));

      // Logregels aanmaken
      for (const r of parsedRecs) {
        eventLogs.push({ eventType: "info", userid: r.userid, checktime: r.checktime, bericht: `Rij ${r.lineNum}: ${r.userid} ${r.checktype} ${r.checktime.toISOString()}` });
      }

      // ── Duplicaten detecteren ───────────────────────────────────────────────
      const seen = new Set<string>();
      const deduped: typeof records = [];
      for (const r of records) {
        const key = `${r.userid}::${r.checktime.toISOString()}`;
        if (seen.has(key)) {
          waarschuwingen++;
          eventLogs.push({ eventType: "warning", userid: r.userid, checktime: r.checktime, bericht: `Duplicaat gevonden: ${r.userid} @ ${r.checktime.toISOString()}` });
        } else {
          seen.add(key);
          deduped.push(r);
        }
      }

      // ── Missende paren detecteren ──────────────────────────────────────────
      const byUserDay: Record<string, typeof records> = {};
      for (const r of deduped) {
        const key = `${r.userid}::${r.checktime.toISOString().slice(0, 10)}`;
        if (!byUserDay[key]) byUserDay[key] = [];
        byUserDay[key].push(r);
      }
      for (const [key, recs] of Object.entries(byUserDay)) {
        const ins  = recs.filter(r => r.checktype === "in").length;
        const outs = recs.filter(r => r.checktype === "out").length;
        if (ins === 0 && outs > 0) {
          waarschuwingen++;
          eventLogs.push({ eventType: "warning", userid: key.split("::")[0], bericht: `${key.split("::")[1]}: uitklokregistraties zonder inklok` });
        } else if (ins > 0 && outs === 0) {
          waarschuwingen++;
          eventLogs.push({ eventType: "warning", userid: key.split("::")[0], bericht: `${key.split("::")[1]}: inklokregistraties zonder uitklok` });
        }
      }

      // ── Opslaan in DB ──────────────────────────────────────────────────────
      const importEntry = await storage.createImportLog({
        importedBy: currentUser.id,
        bestandsnaam,
        totaalRecords: lines.length - 1,
        geldigeRecords: deduped.length,
        foutRecords,
        waarschuwingen,
        status: foutRecords === 0 ? "verwerkt" : "verwerkt_met_fouten",
      });

      // Sla event logs op met importId
      await storage.createPrikklokEventLogs(
        eventLogs.map(e => ({ ...e, importId: importEntry.id }))
      );

      // Sla werktijden records op met importId
      await storage.bulkCreateWerktijden(deduped.map(r => ({ ...r, importId: importEntry.id })));

      res.json({
        importId: importEntry.id,
        bestandsnaam,
        totaalRecords: lines.length - 1,
        geldigeRecords: deduped.length,
        foutRecords,
        waarschuwingen,
        status: importEntry.status,
      });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // GET /api/import-logs — Overzicht van alle imports
  app.get("/api/import-logs", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || !isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const logs = await storage.getImportLogs();
      res.json(logs);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // DELETE /api/import-logs/:id — Verwijder een import inclusief alle bijbehorende klokregistraties
  app.delete("/api/import-logs/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || !isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      await storage.deleteImportLog(req.params.id);
      res.json({ message: "Import verwijderd" });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // GET /api/prikklok-events — Event logboek
  app.get("/api/prikklok-events", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || !isAdminRole(currentUser.role) && currentUser.role !== "manager" && currentUser.role !== "manager_az") {
        return res.status(403).json({ message: "Geen toegang" });
      }
      const importId = req.query.importId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 500;
      const logs = await storage.getPrikklokEventLogs(importId, limit);
      res.json(logs);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Correctieverzoeken ──────────────────────────────────────────────────────
  app.get("/api/correctieverzoeken", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const isManager = isAdminRole(currentUser.role) || currentUser.role === "manager" || currentUser.role === "manager_az";
      const records = isManager
        ? await storage.getCorrectieverzoeken()
        : await storage.getCorrectieverzoeken(String(currentUser.id));
      res.json(records);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.post("/api/correctieverzoeken", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const body = { ...req.body, ingediendDoor: String(currentUser.id) };
      if (body.checktime && typeof body.checktime === "string") {
        body.checktime = new Date(body.checktime);
      }
      const parsed = insertCorrectieverzoekSchema.parse(body);
      const record = await storage.createCorrectieverzoek(parsed);
      res.json(record);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  app.patch("/api/correctieverzoeken/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const isManager = isAdminRole(currentUser.role) || currentUser.role === "manager" || currentUser.role === "manager_az";
      if (!isManager) return res.status(403).json({ message: "Alleen managers mogen verzoeken beoordelen" });
      const { status, beoordelingNotitie } = req.body;
      if (!["goedgekeurd", "afgewezen"].includes(status)) return res.status(400).json({ message: "Ongeldig status" });
      const updated = await storage.updateCorrectieverzoek(req.params.id, {
        status,
        beoordeeldDoor: String(currentUser.id),
        beoordeeldAt: new Date(),
        beoordelingNotitie: beoordelingNotitie || null,
      });
      // On approval: automatically create werktijd registration
      if (status === "goedgekeurd") {
        await storage.createWerktijden({
          userid: updated.kadasterId,
          checktime: updated.checktime,
          direction: updated.richting as "IN" | "OUT",
          deviceid: "correctie",
        });
      }
      res.json(updated);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.get("/api/overuur-aanvragen", requireAuth, async (req, res) => {
    try {
      const records = await storage.getOveruurAanvragen();
      res.json(records);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.post("/api/overuur-aanvragen", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser) return res.status(401).json({ message: "Niet ingelogd" });
      const isManager = isAdminRole(currentUser.role) || currentUser.role === "manager" || currentUser.role === "manager_az";
      if (!isManager) return res.status(403).json({ message: "Alleen managers mogen overuur aanvragen indienen" });
      const parsed = insertOveruurAanvraagSchema.parse({ ...req.body, aangevraagdDoor: currentUser.id });
      const record = await storage.createOveruurAanvraag(parsed);
      res.json(record);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  app.patch("/api/overuur-aanvragen/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      if (!currentUser || currentUser.role !== "directeur" && !isAdminRole(currentUser.role)) {
        return res.status(403).json({ message: "Alleen directie mag overuur goedkeuren" });
      }
      const { status } = req.body;
      if (!["goedgekeurd", "afgewezen"].includes(status)) return res.status(400).json({ message: "Ongeldig status" });
      const updated = await storage.updateOveruurAanvraag(req.params.id, {
        status,
        goedgekeurdDoor: currentUser.id,
      });
      res.json(updated);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  return httpServer;
}
