import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp, pgEnum, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["directeur", "admin", "manager", "manager_az", "employee", "tijdelijk"]);
export const absenceTypeEnum = pgEnum("absence_type", ["sick", "vacation", "personal", "other", "bvvd", "persoonlijk"]);
export const absenceStatusEnum = pgEnum("absence_status", ["pending", "approved", "rejected", "cancelled"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  department: text("department"),
  avatar: text("avatar"),
  active: boolean("active").notNull().default(true),
  permissions: text("permissions").array(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  birthDate: date("birth_date"),
  vacationDaysTotal: integer("vacation_days_total").default(25),
  vacationDaysSaldoOud: integer("vacation_days_saldo_oud").default(0),
  phoneExtension: text("phone_extension"),
  functie: text("functie"),
  kadasterId: text("kadaster_id"),
  cedulaNr: text("cedula_nr"),
  telefoonnr: text("telefoonnr"),
  mobielnr: text("mobielnr"),
  adres: text("adres"),
  voornamen: text("voornamen"),
  voorvoegsel: text("voorvoegsel"),
  achternaam: text("achternaam"),
  vacationDaysCancel: real("vacation_days_cancel").default(0),
  titelsVoor: text("titels_voor").array(),
  titelsAchter: text("titels_achter").array(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  endDate: date("end_date"),
  time: text("time"),
  location: text("location"),
  category: text("category"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  pinned: boolean("pinned").notNull().default(false),
  pdfUrl: text("pdf_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  archived: boolean("archived").notNull().default(false),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: varchar("manager_id").references(() => users.id),
});

export const absences = pgTable("absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: absenceTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  bvvdReason: text("bvvd_reason"),
  halfDay: text("half_day"),
  status: absenceStatusEnum("status").notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  deductVacation: boolean("deduct_vacation").default(false),
  cancelReason: text("cancel_reason"),
  persoonlijkBesluit: text("persoonlijk_besluit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const absenceCancellations = pgTable("absence_cancellations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  absenceId: varchar("absence_id").references(() => absences.id).notNull(),
  cancelledDate: date("cancelled_date").notNull(),
  cancelReason: text("cancel_reason"),
  cancelledBy: varchar("cancelled_by").references(() => users.id),
  affectsBalance: boolean("affects_balance").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull().default(0),
  reason: text("reason").notNull(),
  awardedBy: varchar("awarded_by").references(() => users.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"),
  path: text("path"),
  icon: text("icon"),
});

export const appAccess = pgTable("app_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  applicationId: varchar("application_id").references(() => applications.id).notNull(),
  accessLevel: text("access_level").notNull().default("read"),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  reply: text("reply"),
  repliedAt: timestamp("replied_at"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aoProcedures = pgTable("ao_procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").references(() => departments.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
});

export const aoInstructions = pgTable("ao_instructions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").references(() => aoProcedures.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const positionHistory = pgTable("position_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  functionTitle: text("function_title").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  salary: integer("salary"),
  beginSchaal: integer("begin_schaal"),
  eindSchaal: integer("eind_schaal"),
  notes: text("notes"),
});

export const personalDevelopment = pgTable("personal_development", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  trainingName: text("training_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  completed: boolean("completed").notNull().default(false),
});

export const legislationLinks = pgTable("legislation_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  category: text("category").notNull().default("algemeen"),
  pdfUrl: text("pdf_url"),
});

export const caoDocuments = pgTable("cao_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterNumber: text("chapter_number").notNull(),
  title: text("title").notNull(),
  documentUrl: text("document_url").notNull(),
});

export const functioneringReviews = pgTable("functionering_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  medewerker: text("medewerker").notNull(),
  functie: text("functie"),
  afdeling: text("afdeling"),
  leidinggevende: text("leidinggevende"),
  datum: date("datum").notNull(),
  periode: text("periode"),
  terugblikTaken: text("terugblik_taken"),
  terugblikResultaten: text("terugblik_resultaten"),
  terugblikKnelpunten: text("terugblik_knelpunten"),
  werkinhoud: text("werkinhoud"),
  samenwerking: text("samenwerking"),
  communicatie: text("communicatie"),
  arbeidsomstandigheden: text("arbeidsomstandigheden"),
  persoonlijkeOntwikkeling: text("persoonlijke_ontwikkeling"),
  scholingswensen: text("scholingswensen"),
  doelstelling1: text("doelstelling_1"),
  doelstelling1Termijn: text("doelstelling_1_termijn"),
  doelstelling2: text("doelstelling_2"),
  doelstelling2Termijn: text("doelstelling_2_termijn"),
  doelstelling3: text("doelstelling_3"),
  doelstelling3Termijn: text("doelstelling_3_termijn"),
  afspraken: text("afspraken"),
  opmerkingMedewerker: text("opmerking_medewerker"),
  opmerkingLeidinggevende: text("opmerking_leidinggevende"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const competencies = pgTable("competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  functie: text("functie").notNull(),
  name: text("name").notNull(),
  norm1: text("norm_1").notNull().default(""),
  norm2: text("norm_2").notNull().default(""),
  norm3: text("norm_3").notNull().default(""),
  norm4: text("norm_4").notNull().default(""),
  norm5: text("norm_5").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const beoordelingReviews = pgTable("beoordeling_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  medewerker: text("medewerker").notNull(),
  functie: text("functie"),
  afdeling: text("afdeling"),
  beoordelaar: text("beoordelaar"),
  datum: date("datum").notNull(),
  periode: text("periode"),
  totalScore: text("total_score"),
  afspraken: text("afspraken"),
  opmerkingMedewerker: text("opmerking_medewerker"),
  opmerkingBeoordelaar: text("opmerking_beoordelaar"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const beoordelingScores = pgTable("beoordeling_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").references(() => beoordelingReviews.id).notNull(),
  competencyId: varchar("competency_id").references(() => competencies.id).notNull(),
  score: integer("score"),
  toelichting: text("toelichting"),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertAbsenceSchema = createInsertSchema(absences).omit({ id: true, createdAt: true });
export const insertAbsenceCancellationSchema = createInsertSchema(absenceCancellations).omit({ id: true, createdAt: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true, awardedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });
export const insertAppAccessSchema = createInsertSchema(appAccess).omit({ id: true, grantedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, reply: true, repliedAt: true, read: true });
export const insertAoProcedureSchema = createInsertSchema(aoProcedures).omit({ id: true });
export const insertAoInstructionSchema = createInsertSchema(aoInstructions).omit({ id: true });
export const insertPositionHistorySchema = createInsertSchema(positionHistory).omit({ id: true });
export const insertPersonalDevelopmentSchema = createInsertSchema(personalDevelopment).omit({ id: true });
export const insertLegislationLinkSchema = createInsertSchema(legislationLinks).omit({ id: true });
export const insertCaoDocumentSchema = createInsertSchema(caoDocuments).omit({ id: true });
export const insertFunctioneringReviewSchema = createInsertSchema(functioneringReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompetencySchema = createInsertSchema(competencies).omit({ id: true });
export const insertBeoordelingReviewSchema = createInsertSchema(beoordelingReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBeoordelingScoreSchema = createInsertSchema(beoordelingScores).omit({ id: true });

export const jaarplanItems = pgTable("jaarplan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  afdeling: varchar("afdeling").notNull(),
  year: integer("year").notNull(),
  afspraken: text("afspraken").notNull(),
  startDatum: date("start_datum"),
  eindDatum: date("eind_datum"),
  status: text("status").default("niet gestart"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJaarplanItemSchema = createInsertSchema(jaarplanItems).omit({ id: true, createdAt: true, updatedAt: true });

export const jaarplanOnderdelen = pgTable("jaarplan_onderdelen", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jaarplanId: varchar("jaarplan_id").references(() => jaarplanItems.id).notNull(),
  naam: text("naam").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJaarplanOnderdeelSchema = createInsertSchema(jaarplanOnderdelen).omit({ id: true, createdAt: true });

export const jaarplanActies = pgTable("jaarplan_acties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jaarplanId: varchar("jaarplan_id").references(() => jaarplanItems.id).notNull(),
  onderdeelId: varchar("onderdeel_id").references(() => jaarplanOnderdelen.id),
  datum: date("datum").notNull(),
  actie: text("actie").notNull(),
  status: text("status").default("niet gestart"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJaarplanActieSchema = createInsertSchema(jaarplanActies).omit({ id: true, createdAt: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type Absence = typeof absences.$inferSelect;
export type InsertAbsenceCancellation = z.infer<typeof insertAbsenceCancellationSchema>;
export type AbsenceCancellation = typeof absenceCancellations.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertAppAccess = z.infer<typeof insertAppAccessSchema>;
export type AppAccess = typeof appAccess.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAoProcedure = z.infer<typeof insertAoProcedureSchema>;
export type AoProcedure = typeof aoProcedures.$inferSelect;
export type InsertAoInstruction = z.infer<typeof insertAoInstructionSchema>;
export type AoInstruction = typeof aoInstructions.$inferSelect;
export type InsertPositionHistory = z.infer<typeof insertPositionHistorySchema>;
export type PositionHistory = typeof positionHistory.$inferSelect;
export type InsertPersonalDevelopment = z.infer<typeof insertPersonalDevelopmentSchema>;
export type PersonalDevelopment = typeof personalDevelopment.$inferSelect;
export type InsertLegislationLink = z.infer<typeof insertLegislationLinkSchema>;
export type LegislationLink = typeof legislationLinks.$inferSelect;
export type InsertCaoDocument = z.infer<typeof insertCaoDocumentSchema>;
export type CaoDocument = typeof caoDocuments.$inferSelect;
export type InsertFunctioneringReview = z.infer<typeof insertFunctioneringReviewSchema>;
export type FunctioneringReview = typeof functioneringReviews.$inferSelect;
export type InsertCompetency = z.infer<typeof insertCompetencySchema>;
export type Competency = typeof competencies.$inferSelect;
export type InsertBeoordelingReview = z.infer<typeof insertBeoordelingReviewSchema>;
export type BeoordelingReview = typeof beoordelingReviews.$inferSelect;
export type InsertBeoordelingScore = z.infer<typeof insertBeoordelingScoreSchema>;
export type BeoordelingScore = typeof beoordelingScores.$inferSelect;
export type InsertJaarplanItem = z.infer<typeof insertJaarplanItemSchema>;
export type JaarplanItem = typeof jaarplanItems.$inferSelect;
export type InsertJaarplanOnderdeel = z.infer<typeof insertJaarplanOnderdeelSchema>;
export type JaarplanOnderdeel = typeof jaarplanOnderdelen.$inferSelect;
export type InsertJaarplanActie = z.infer<typeof insertJaarplanActieSchema>;
export type JaarplanActie = typeof jaarplanActies.$inferSelect;

export const helpContentTable = pgTable("help_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageRoute: varchar("page_route").notNull().unique(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
});

export const insertHelpContentSchema = createInsertSchema(helpContentTable).omit({ id: true });
export type InsertHelpContent = z.infer<typeof insertHelpContentSchema>;
export type HelpContent = typeof helpContentTable.$inferSelect;

export const snipperdagen = pgTable("snipperdagen", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: date("date").notNull(),
  year: integer("year").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSnipperdagSchema = createInsertSchema(snipperdagen).omit({ id: true, createdAt: true });
export type InsertSnipperdag = z.infer<typeof insertSnipperdagSchema>;
export type Snipperdag = typeof snipperdagen.$inferSelect;

export const officialHolidays = pgTable("official_holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: date("date").notNull(),
  year: integer("year").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertOfficialHolidaySchema = createInsertSchema(officialHolidays).omit({ id: true });
export type InsertOfficialHoliday = z.infer<typeof insertOfficialHolidaySchema>;
export type OfficialHoliday = typeof officialHolidays.$inferSelect;

export const yearlyAwards = pgTable("yearly_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  photo: text("photo"),
  awardedBy: varchar("awarded_by").references(() => users.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});

export const insertYearlyAwardSchema = createInsertSchema(yearlyAwards).omit({ id: true, awardedAt: true });
export type InsertYearlyAward = z.infer<typeof insertYearlyAwardSchema>;
export type YearlyAward = typeof yearlyAwards.$inferSelect;

export const jobFunctions = pgTable("job_functions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").references(() => departments.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  descriptionFilePath: text("description_file_path"),
  beginSchaal: integer("begin_schaal"),
  eindSchaal: integer("eind_schaal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobFunctionSchema = createInsertSchema(jobFunctions).omit({ id: true, createdAt: true });
export type InsertJobFunction = z.infer<typeof insertJobFunctionSchema>;
export type JobFunction = typeof jobFunctions.$inferSelect;

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "directeur";
}

export function canManageVacation(role?: string | null): boolean {
  return role === "admin" || role === "directeur" || role === "manager_az";
}

// ── Maandelijkse productie kartografen ──────────────────────────────────────
export const maandProdKartograaf = pgTable("maand_prod_kartograaf", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  kartograaf: text("kartograaf").notNull(),
  mbr: integer("mbr").notNull().default(0),
  kad_spl: integer("kad_spl").notNull().default(0),
  gr_uitz: integer("gr_uitz").notNull().default(0),
  ex_pl: integer("ex_pl").notNull().default(0),
  plot_coor: integer("plot_coor").notNull().default(0),
  losse_mbr: integer("losse_mbr").notNull().default(0),
});
export const insertMaandProdKartograafSchema = createInsertSchema(maandProdKartograaf).omit({ id: true });
export type InsertMaandProdKartograaf = z.infer<typeof insertMaandProdKartograafSchema>;
export type MaandProdKartograaf = typeof maandProdKartograaf.$inferSelect;

export const maandProdSamenvatting = pgTable("maand_prod_samenvatting", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  binnengekomen: integer("binnengekomen").notNull().default(0),
  aantal_kartografen: integer("aantal_kartografen").notNull().default(0),
});
export const insertMaandProdSamenvattingSchema = createInsertSchema(maandProdSamenvatting).omit({ id: true });
export type InsertMaandProdSamenvatting = z.infer<typeof insertMaandProdSamenvattingSchema>;
export type MaandProdSamenvatting = typeof maandProdSamenvatting.$inferSelect;

// ── Maandelijkse productie landmeters ────────────────────────────────────────
export const maandProdLandmeter = pgTable("maand_prod_landmeter", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  landmeter: text("landmeter").notNull(),
  ex_uitb: integer("ex_uitb").notNull().default(0),
  meting: integer("meting").notNull().default(0),
  gr_uitz: integer("gr_uitz").notNull().default(0),
  l_meting: integer("l_meting").notNull().default(0),
  plot_inzage_coord: integer("plot_inzage_coord").notNull().default(0),
});
export const insertMaandProdLandmeterSchema = createInsertSchema(maandProdLandmeter).omit({ id: true });
export type InsertMaandProdLandmeter = z.infer<typeof insertMaandProdLandmeterSchema>;
export type MaandProdLandmeter = typeof maandProdLandmeter.$inferSelect;

export const maandProdSamenvattingLm = pgTable("maand_prod_samenvatting_lm", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  binnengekomen: integer("binnengekomen").notNull().default(0),
  aantal_landmeters: integer("aantal_landmeters").notNull().default(0),
  eilandgebied: integer("eilandgebied").notNull().default(0),
  particulier: integer("particulier").notNull().default(0),
  grensuitzetting: integer("grensuitzetting").notNull().default(0),
});
export const insertMaandProdSamenvattingLmSchema = createInsertSchema(maandProdSamenvattingLm).omit({ id: true });
export type InsertMaandProdSamenvattingLm = z.infer<typeof insertMaandProdSamenvattingLmSchema>;
export type MaandProdSamenvattingLm = typeof maandProdSamenvattingLm.$inferSelect;

// ── Kartografie productie (KM Binnen import) ─────────────────────────────────
export const kartografieProductie = pgTable("kartografie_productie", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: text("maand").notNull(),
  binnengekomen: integer("binnengekomen").notNull(),
  afgehandeld: integer("afgehandeld").notNull(),
  gemiddeld: real("gemiddeld").notNull(),
  kartografen: integer("kartografen").notNull(),
});

export const insertKartografieProductieSchema = createInsertSchema(kartografieProductie).omit({ id: true });
export type InsertKartografieProductie = z.infer<typeof insertKartografieProductieSchema>;
export type KartografieProductie = typeof kartografieProductie.$inferSelect;

// ── Trend KM Buiten ──────────────────────────────────────────────────────────
export const trendKmBuiten = pgTable("trend_km_buiten", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  binnengekomen: integer("binnengekomen").notNull().default(0),
  afgehandeld: integer("afgehandeld").notNull().default(0),
  uitbesteding: integer("uitbesteding").notNull().default(0),
  gemiddeld: real("gemiddeld").notNull().default(0),
  landmeters: integer("landmeters").notNull().default(0),
});
export const insertTrendKmBuitenSchema = createInsertSchema(trendKmBuiten).omit({ id: true });
export type InsertTrendKmBuiten = z.infer<typeof insertTrendKmBuitenSchema>;
export type TrendKmBuiten = typeof trendKmBuiten.$inferSelect;

// ── Maand Prod OR Info ────────────────────────────────────────────────────────
export const maandProdOrInfo = pgTable("maand_prod_or_info", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  inzage_or: integer("inzage_or").notNull().default(0),
  bulkdata: integer("bulkdata").notNull().default(0),
  verkorte_inzage: integer("verkorte_inzage").notNull().default(0),
  schriftelijke_inzage: integer("schriftelijke_inzage").notNull().default(0),
  kopie_akte: integer("kopie_akte").notNull().default(0),
  her_inzage: integer("her_inzage").notNull().default(0),
  na_inzage: integer("na_inzage").notNull().default(0),
  kadastrale_legger: integer("kadastrale_legger").notNull().default(0),
  verklaring_eensluidend: integer("verklaring_eensluidend").notNull().default(0),
  verklaring_geen_or: integer("verklaring_geen_or").notNull().default(0),
  getuigschrift_volgende: integer("getuigschrift_volgende").notNull().default(0),
  getuigschrift_or: integer("getuigschrift_or").notNull().default(0),
  aktes: integer("aktes").notNull().default(0),
  inschrijvingen: integer("inschrijvingen").notNull().default(0),
  doorhalingen: integer("doorhalingen").notNull().default(0),
  opheffingen: integer("opheffingen").notNull().default(0),
  beslagen: integer("beslagen").notNull().default(0),
  cessies: integer("cessies").notNull().default(0),
});
export const insertMaandProdOrInfoSchema = createInsertSchema(maandProdOrInfo).omit({ id: true });
export type InsertMaandProdOrInfo = z.infer<typeof insertMaandProdOrInfoSchema>;
export type MaandProdOrInfo = typeof maandProdOrInfo.$inferSelect;

// ── Maand Prod KM Info ────────────────────────────────────────────────────────
export const maandProdKmInfo = pgTable("maand_prod_km_info", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  topo_kaarten: integer("topo_kaarten").notNull().default(0),
  plot_overzicht: integer("plot_overzicht").notNull().default(0),
  plot_grens_uitz: integer("plot_grens_uitz").notNull().default(0),
  afdrukken_kaarten: integer("afdrukken_kaarten").notNull().default(0),
  sit_a4: integer("sit_a4").notNull().default(0),
  sit_a3: integer("sit_a3").notNull().default(0),
  reg_meetbrief: integer("reg_meetbrief").notNull().default(0),
  reg_extractplan: integer("reg_extractplan").notNull().default(0),
  inzage_kad: integer("inzage_kad").notNull().default(0),
  uur_tarieven: integer("uur_tarieven").notNull().default(0),
  digitale_bestanden: integer("digitale_bestanden").notNull().default(0),
  blok_maten: integer("blok_maten").notNull().default(0),
  kopie_veldwerk: integer("kopie_veldwerk").notNull().default(0),
  coordinaten: integer("coordinaten").notNull().default(0),
  hulp_kaart: integer("hulp_kaart").notNull().default(0),
  terrein_onderzoek: integer("terrein_onderzoek").notNull().default(0),
  proces_verbaal: integer("proces_verbaal").notNull().default(0),
});
export const insertMaandProdKmInfoSchema = createInsertSchema(maandProdKmInfo).omit({ id: true });
export type InsertMaandProdKmInfo = z.infer<typeof insertMaandProdKmInfoSchema>;
export type MaandProdKmInfo = typeof maandProdKmInfo.$inferSelect;

// ── Trend KM Info ─────────────────────────────────────────────────────────────
export const trendKmInfo = pgTable("trend_km_info", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  kkp: integer("kkp").notNull().default(0),
  db: integer("db").notNull().default(0),
  sa: integer("sa").notNull().default(0),
  rm: integer("rm").notNull().default(0),
  re: integer("re").notNull().default(0),
  km: integer("km").notNull().default(0),
  ik: integer("ik").notNull().default(0),
});
export const insertTrendKmInfoSchema = createInsertSchema(trendKmInfo).omit({ id: true });
export type InsertTrendKmInfo = z.infer<typeof insertTrendKmInfoSchema>;
export type TrendKmInfo = typeof trendKmInfo.$inferSelect;

// ── Trend OR Info ─────────────────────────────────────────────────────────────
export const trendOrInfo = pgTable("trend_or_info", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  inzagen: integer("inzagen").notNull().default(0),
  her_inzage: integer("her_inzage").notNull().default(0),
  na_inzage: integer("na_inzage").notNull().default(0),
  kadastaal_legger: integer("kadastaal_legger").notNull().default(0),
  verklaring: integer("verklaring").notNull().default(0),
  getuigschrift: integer("getuigschrift").notNull().default(0),
});
export const insertTrendOrInfoSchema = createInsertSchema(trendOrInfo).omit({ id: true });
export type InsertTrendOrInfo = z.infer<typeof insertTrendOrInfoSchema>;
export type TrendOrInfo = typeof trendOrInfo.$inferSelect;

// ── Trend OR Algemeen ─────────────────────────────────────────────────────────
export const trendOrAlgemeen = pgTable("trend_or_algemeen", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  aktes: integer("aktes").notNull().default(0),
  inschrijvingen: integer("inschrijvingen").notNull().default(0),
  doorhalingen: integer("doorhalingen").notNull().default(0),
  opheffingen: integer("opheffingen").notNull().default(0),
  beslagen: integer("beslagen").notNull().default(0),
  cessies: integer("cessies").notNull().default(0),
});
export const insertTrendOrAlgemeenSchema = createInsertSchema(trendOrAlgemeen).omit({ id: true });
export type InsertTrendOrAlgemeen = z.infer<typeof insertTrendOrAlgemeenSchema>;
export type TrendOrAlgemeen = typeof trendOrAlgemeen.$inferSelect;

// ── Maandelijkse Productie OR Notaris ────────────────────────────────────────
export const maandProdOrNotaris = pgTable("maand_prod_or_notaris", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  notaris_key: text("notaris_key").notNull(),
  aktes: integer("aktes").notNull().default(0),
  inschrijvingen: integer("inschrijvingen").notNull().default(0),
  doorhalingen: integer("doorhalingen").notNull().default(0),
  opheffingen: integer("opheffingen").notNull().default(0),
  beslagen: integer("beslagen").notNull().default(0),
  cessies: integer("cessies").notNull().default(0),
  sort_order: integer("sort_order").notNull().default(0),
});
export const insertMaandProdOrNotarisSchema = createInsertSchema(maandProdOrNotaris).omit({ id: true });
export type InsertMaandProdOrNotaris = z.infer<typeof insertMaandProdOrNotarisSchema>;
export type MaandProdOrNotaris = typeof maandProdOrNotaris.$inferSelect;

// ── Trend OR Notaris ──────────────────────────────────────────────────────────
export const trendOrNotaris = pgTable("trend_or_notaris", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  notaris_key: text("notaris_key").notNull(),
  waarde: integer("waarde").notNull().default(0),
});
export const insertTrendOrNotarisSchema = createInsertSchema(trendOrNotaris).omit({ id: true });
export type InsertTrendOrNotaris = z.infer<typeof insertTrendOrNotarisSchema>;
export type TrendOrNotaris = typeof trendOrNotaris.$inferSelect;

// ── Werktijden ────────────────────────────────────────────────────────────────
export const werktijden = pgTable("werktijden", {
  logid: serial("logid").primaryKey(),
  userid: varchar("userid", { length: 20 }).notNull(),
  checktime: timestamp("checktime").notNull(),
  checktype: text("checktype").notNull().default("in"), // 'in' | 'out'
  importId: varchar("import_id").references(() => importLog.id),
});
export const insertWerktijdenSchema = createInsertSchema(werktijden).omit({ logid: true });
export type InsertWerktijden = z.infer<typeof insertWerktijdenSchema>;
export type Werktijden = typeof werktijden.$inferSelect;

// ── Overuur aanvragen ─────────────────────────────────────────────────────────
export const overuurAanvragen = pgTable("overuur_aanvragen", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userid: varchar("userid", { length: 20 }).notNull(),
  datum: date("datum").notNull(),
  reden: text("reden"),
  aangevraagdDoor: varchar("aangevraagd_door").references(() => users.id),
  goedgekeurdDoor: varchar("goedgekeurd_door").references(() => users.id),
  status: text("status").notNull().default("aangevraagd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertOveruurAanvraagSchema = createInsertSchema(overuurAanvragen).omit({ id: true, createdAt: true, goedgekeurdDoor: true, status: true });
export type InsertOveruurAanvraag = z.infer<typeof insertOveruurAanvraagSchema>;
export type OveruurAanvraag = typeof overuurAanvragen.$inferSelect;

// ── Import Log ────────────────────────────────────────────────────────────────
export const importLog = pgTable("import_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  importedBy: varchar("imported_by").references(() => users.id),
  bestandsnaam: text("bestandsnaam"),
  totaalRecords: integer("totaal_records").default(0),
  geldigeRecords: integer("geldige_records").default(0),
  foutRecords: integer("fout_records").default(0),
  waarschuwingen: integer("waarschuwingen").default(0),
  status: text("status").notNull().default("verwerkt"),
});
export const insertImportLogSchema = createInsertSchema(importLog).omit({ id: true, importedAt: true });
export type InsertImportLog = z.infer<typeof insertImportLogSchema>;
export type ImportLog = typeof importLog.$inferSelect;

// ── Prikklok Event Log ────────────────────────────────────────────────────────
export const prikklokEventLog = pgTable("prikklok_event_log", {
  id: serial("id").primaryKey(),
  eventAt: timestamp("event_at").notNull().defaultNow(),
  importId: varchar("import_id").references(() => importLog.id),
  eventType: text("event_type").notNull().default("info"), // info | warning | error
  userid: varchar("userid", { length: 20 }),
  checktime: timestamp("checktime"),
  bericht: text("bericht").notNull(),
});
export const insertPrikklokEventLogSchema = createInsertSchema(prikklokEventLog).omit({ id: true, eventAt: true });
export type InsertPrikklokEventLog = z.infer<typeof insertPrikklokEventLogSchema>;
export type PrikklokEventLog = typeof prikklokEventLog.$inferSelect;

// ── Trend Kartografen historisch ──────────────────────────────────────────────
export const trendKartografenHist = pgTable("trend_kartografen_hist", {
  id: serial("id").primaryKey(),
  jaar: integer("jaar").notNull(),
  maand: integer("maand").notNull(),
  egaleano: integer("egaleano").notNull().default(0),
  jpieters: integer("jpieters").notNull().default(0),
  nsambo: integer("nsambo").notNull().default(0),
  binnengekomen: integer("binnengekomen").notNull().default(0),
  afgehandeld: integer("afgehandeld").notNull().default(0),
});
export const insertTrendKartografenHistSchema = createInsertSchema(trendKartografenHist).omit({ id: true });
export type InsertTrendKartografenHist = z.infer<typeof insertTrendKartografenHistSchema>;
export type TrendKartografenHist = typeof trendKartografenHist.$inferSelect;

// ── Correctieverzoeken prikklok ───────────────────────────────────────────────
export const correctieverzoeken = pgTable("correctieverzoeken", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingediendDoor: varchar("ingediend_door").references(() => users.id).notNull(),
  kadasterId: varchar("kadaster_id", { length: 20 }).notNull(),
  datum: date("datum").notNull(),
  checktime: timestamp("checktime").notNull(),
  richting: text("richting").notNull(), // 'IN' | 'OUT'
  reden: text("reden"),
  status: text("status").notNull().default("aangevraagd"), // aangevraagd | goedgekeurd | afgewezen
  beoordeeldDoor: varchar("beoordeeld_door").references(() => users.id),
  beoordeeldAt: timestamp("beoordeeld_at"),
  beoordelingNotitie: text("beoordeling_notitie"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const insertCorrectieverzoekSchema = createInsertSchema(correctieverzoeken).omit({
  id: true, createdAt: true, beoordeeldDoor: true, beoordeeldAt: true, beoordelingNotitie: true, status: true,
});
export type InsertCorrectieverzoek = z.infer<typeof insertCorrectieverzoekSchema>;
export type Correctieverzoek = typeof correctieverzoeken.$inferSelect;
