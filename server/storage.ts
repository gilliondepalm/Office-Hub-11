import { db } from "./db";
import { eq, desc, sql, and, isNull, isNotNull } from "drizzle-orm";
import {
  users, events, announcements, departments, absences, absenceCancellations, rewards, applications, appAccess, messages,
  aoProcedures, aoInstructions, positionHistory, personalDevelopment, legislationLinks, caoDocuments, siteSettings,
  functioneringReviews, competencies, beoordelingReviews, beoordelingScores, jaarplanItems, jaarplanOnderdelen, jaarplanActies,
  werktijden, overuurAanvragen, importLog, prikklokEventLog, correctieverzoeken,
  type Werktijden, type InsertWerktijden,
  type OveruurAanvraag, type InsertOveruurAanvraag,
  type ImportLog, type InsertImportLog,
  type PrikklokEventLog, type InsertPrikklokEventLog,
  type Correctieverzoek, type InsertCorrectieverzoek,
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Announcement, type InsertAnnouncement,
  type Department, type InsertDepartment,
  type Absence, type InsertAbsence,
  type AbsenceCancellation, type InsertAbsenceCancellation,
  type Reward, type InsertReward,
  type Application, type InsertApplication,
  type AppAccess, type InsertAppAccess,
  type Message, type InsertMessage,
  type AoProcedure, type InsertAoProcedure,
  type AoInstruction, type InsertAoInstruction,
  type PositionHistory, type InsertPositionHistory,
  type PersonalDevelopment, type InsertPersonalDevelopment,
  type LegislationLink, type InsertLegislationLink,
  type CaoDocument, type InsertCaoDocument,
  type FunctioneringReview, type InsertFunctioneringReview,
  type Competency, type InsertCompetency,
  type BeoordelingReview, type InsertBeoordelingReview,
  type BeoordelingScore, type InsertBeoordelingScore,
  type JaarplanItem, type InsertJaarplanItem,
  type JaarplanOnderdeel, type InsertJaarplanOnderdeel,
  type JaarplanActie, type InsertJaarplanActie,
  type HelpContent, type InsertHelpContent,
  type OfficialHoliday, type InsertOfficialHoliday,
  type Snipperdag, type InsertSnipperdag,
  type YearlyAward, type InsertYearlyAward,
  type JobFunction, type InsertJobFunction,
  type KartografieProductie, type InsertKartografieProductie,
  type MaandProdKartograaf, type InsertMaandProdKartograaf,
  type MaandProdSamenvatting, type InsertMaandProdSamenvatting,
  type MaandProdLandmeter, type InsertMaandProdLandmeter,
  type MaandProdSamenvattingLm, type InsertMaandProdSamenvattingLm,
  type MaandProdOrInfo, type InsertMaandProdOrInfo,
  type MaandProdKmInfo, type InsertMaandProdKmInfo,
  type TrendKmBuiten, type InsertTrendKmBuiten,
  type TrendKmInfo, type InsertTrendKmInfo,
  type TrendOrInfo, type InsertTrendOrInfo,
  type TrendOrAlgemeen, type InsertTrendOrAlgemeen,
  type TrendOrNotaris, type InsertTrendOrNotaris,
  type TrendKartografenHist, type InsertTrendKartografenHist,
  helpContentTable, officialHolidays, snipperdagen, yearlyAwards, jobFunctions, kartografieProductie,
  maandProdKartograaf, maandProdSamenvatting,
  maandProdLandmeter, maandProdSamenvattingLm, maandProdOrInfo, maandProdKmInfo,
  maandProdOrNotaris, type MaandProdOrNotaris, type InsertMaandProdOrNotaris,
  trendKmBuiten, trendKmInfo, trendOrInfo, trendOrAlgemeen, trendOrNotaris, trendKartografenHist,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getNextKadasterId(): Promise<string>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  getAnnouncements(): Promise<Announcement[]>;
  getArchivedAnnouncements(): Promise<Announcement[]>;
  archiveAnnouncement(id: string): Promise<void>;
  createAnnouncement(ann: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  getDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;

  getAbsences(): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]>;
  createAbsenceCancellation(data: InsertAbsenceCancellation): Promise<AbsenceCancellation>;
  getAbsenceCancellationsByUser(userId: string): Promise<(AbsenceCancellation & { absenceType?: string; cancelledByName?: string | null })[]>;
  getAbsenceCancellationsByAbsence(absenceId: string): Promise<AbsenceCancellation[]>;
  getAllAbsenceCancellations(): Promise<(AbsenceCancellation & { absenceType?: string; userName?: string | null; userDepartment?: string | null; userRole?: string | null })[]>;
  getAbsencesByUser(userId: string): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]>;
  getAbsencesByDepartment(department: string): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]>;
  getAbsenceById(id: string): Promise<Absence | undefined>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  updateAbsenceStatus(id: string, status: string, approvedBy: string | null, cancelReason?: string, persoonlijkBesluit?: string | null): Promise<void>;
  deleteAbsence(id: string): Promise<void>;

  getRewards(): Promise<(Reward & { userName?: string })[]>;
  getRewardsByUser(userId: string): Promise<(Reward & { userName?: string })[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  getLeaderboard(): Promise<{ userId: string; userName: string; totalPoints: number }[]>;

  updateUserPermissions(id: string, permissions: string[]): Promise<User>;

  getApplications(): Promise<Application[]>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application>;
  deleteApplication(id: string): Promise<void>;

  getAppAccess(): Promise<(AppAccess & { userName?: string; appName?: string })[]>;
  createAppAccess(access: InsertAppAccess): Promise<AppAccess>;
  deleteAppAccess(id: string): Promise<void>;

  getDashboardStats(): Promise<{
    totalEmployees: number;
    temporaryEmployees: number;
    activeAbsences: number;
    upcomingEvents: number;
    totalRewardPoints: number;
    pendingAbsences: number;
  }>;

  getMessagesByUser(userId: string): Promise<(Message & { fromUserName?: string; toUserName?: string })[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  replyToMessage(id: string, reply: string): Promise<Message>;
  markMessageRead(id: string): Promise<void>;

  getAoProcedures(): Promise<(AoProcedure & { departmentName?: string })[]>;
  getAoProceduresByDepartment(departmentId: string): Promise<AoProcedure[]>;
  createAoProcedure(proc: InsertAoProcedure): Promise<AoProcedure>;
  deleteAoProcedure(id: string): Promise<void>;

  getAoInstructions(procedureId: string): Promise<AoInstruction[]>;
  createAoInstruction(instr: InsertAoInstruction): Promise<AoInstruction>;
  deleteAoInstruction(id: string): Promise<void>;

  getPositionHistoryByUser(userId: string): Promise<PositionHistory[]>;
  getPositionHistoryAll(): Promise<(PositionHistory & { userName?: string })[]>;
  createPositionHistory(entry: InsertPositionHistory): Promise<PositionHistory>;
  updatePositionHistory(id: string, data: Partial<InsertPositionHistory>): Promise<PositionHistory>;
  deletePositionHistory(id: string): Promise<void>;

  getPersonalDevelopmentByUser(userId: string): Promise<PersonalDevelopment[]>;
  createPersonalDevelopment(entry: InsertPersonalDevelopment): Promise<PersonalDevelopment>;
  updatePersonalDevelopment(id: string, data: Partial<InsertPersonalDevelopment>): Promise<PersonalDevelopment>;
  deletePersonalDevelopment(id: string): Promise<void>;

  getLegislationLinks(): Promise<LegislationLink[]>;
  createLegislationLink(link: InsertLegislationLink): Promise<LegislationLink>;
  deleteLegislationLink(id: string): Promise<void>;

  getCaoDocuments(): Promise<CaoDocument[]>;
  createCaoDocument(doc: InsertCaoDocument): Promise<CaoDocument>;
  deleteCaoDocument(id: string): Promise<void>;

  getSiteSetting(key: string): Promise<string | null>;
  setSiteSetting(key: string, value: string): Promise<void>;

  getFunctioneringReviews(): Promise<(FunctioneringReview & { userName?: string })[]>;
  getFunctioneringReviewsByUser(userId: string): Promise<FunctioneringReview[]>;
  getFunctioneringReviewsByYear(year: number): Promise<(FunctioneringReview & { userName?: string })[]>;
  getFunctioneringReviewByUserAndYear(userId: string, year: number): Promise<FunctioneringReview | undefined>;
  createFunctioneringReview(review: InsertFunctioneringReview): Promise<FunctioneringReview>;
  updateFunctioneringReview(id: string, data: Partial<InsertFunctioneringReview>): Promise<FunctioneringReview>;
  deleteFunctioneringReview(id: string): Promise<void>;

  getCompetenciesByFunctie(functie: string): Promise<Competency[]>;
  getAllCompetencies(): Promise<Competency[]>;
  createCompetency(comp: InsertCompetency): Promise<Competency>;
  updateCompetency(id: string, data: Partial<InsertCompetency>): Promise<Competency>;
  deleteCompetency(id: string): Promise<void>;

  getBeoordelingReviews(): Promise<(BeoordelingReview & { userName?: string })[]>;
  getBeoordelingReviewsByUser(userId: string): Promise<BeoordelingReview[]>;
  getBeoordelingReviewsByYear(year: number): Promise<(BeoordelingReview & { userName?: string })[]>;
  getBeoordelingReviewByUserAndYear(userId: string, year: number): Promise<BeoordelingReview | undefined>;
  createBeoordelingReview(review: InsertBeoordelingReview): Promise<BeoordelingReview>;
  updateBeoordelingReview(id: string, data: Partial<InsertBeoordelingReview>): Promise<BeoordelingReview>;
  deleteBeoordelingReview(id: string): Promise<void>;

  getBeoordelingScoresByReview(reviewId: string): Promise<(BeoordelingScore & { competencyName?: string })[]>;
  createBeoordelingScore(score: InsertBeoordelingScore): Promise<BeoordelingScore>;
  updateBeoordelingScore(id: string, data: Partial<InsertBeoordelingScore>): Promise<BeoordelingScore>;
  deleteBeoordelingScoresByReview(reviewId: string): Promise<void>;

  getJaarplanItemsByYear(year: number, afdeling?: string): Promise<JaarplanItem[]>;
  createJaarplanItem(item: InsertJaarplanItem): Promise<JaarplanItem>;
  updateJaarplanItem(id: string, data: Partial<InsertJaarplanItem>): Promise<JaarplanItem>;
  deleteJaarplanItem(id: string): Promise<void>;
  getJaarplanOnderdelen(jaarplanId: string): Promise<JaarplanOnderdeel[]>;
  createJaarplanOnderdeel(onderdeel: InsertJaarplanOnderdeel): Promise<JaarplanOnderdeel>;
  updateJaarplanOnderdeel(id: string, naam: string): Promise<JaarplanOnderdeel>;
  deleteJaarplanOnderdeel(id: string): Promise<void>;
  getJaarplanActies(jaarplanId: string): Promise<JaarplanActie[]>;
  getJaarplanActiesByOnderdeel(onderdeelId: string): Promise<JaarplanActie[]>;
  createJaarplanActie(actie: InsertJaarplanActie): Promise<JaarplanActie>;
  updateJaarplanActie(id: string, data: Partial<InsertJaarplanActie>): Promise<JaarplanActie>;
  deleteJaarplanActie(id: string): Promise<void>;

  getAllHelpContent(): Promise<HelpContent[]>;
  upsertHelpContent(data: InsertHelpContent): Promise<HelpContent>;

  getOfficialHolidays(year?: number): Promise<OfficialHoliday[]>;
  createOfficialHoliday(holiday: InsertOfficialHoliday): Promise<OfficialHoliday>;
  deleteOfficialHoliday(id: string): Promise<void>;
  deleteOfficialHolidaysByYear(year: number): Promise<void>;

  getSnipperdagen(year?: number): Promise<Snipperdag[]>;
  createSnipperdag(snipperdag: InsertSnipperdag): Promise<Snipperdag>;
  deleteSnipperdag(id: string): Promise<void>;

  getYearlyAwards(year?: number): Promise<YearlyAward[]>;
  createYearlyAward(award: InsertYearlyAward): Promise<YearlyAward>;
  deleteYearlyAward(id: string): Promise<void>;

  getJobFunctions(): Promise<JobFunction[]>;
  createJobFunction(data: InsertJobFunction): Promise<JobFunction>;
  updateJobFunction(id: string, data: Partial<InsertJobFunction>): Promise<JobFunction>;
  deleteJobFunction(id: string): Promise<void>;

  getKartografieProductie(): Promise<KartografieProductie[]>;
  bulkUpsertKartografieProductie(rows: InsertKartografieProductie[]): Promise<KartografieProductie[]>;
  deleteKartografieProductieByJaar(jaar: number): Promise<void>;

  getMaandProdKartograaf(jaar: number, maand: number): Promise<MaandProdKartograaf[]>;
  saveMaandProdKartograaf(rows: InsertMaandProdKartograaf[]): Promise<void>;
  getMaandProdSamenvatting(jaar: number, maand: number): Promise<MaandProdSamenvatting | undefined>;
  saveMaandProdSamenvatting(data: InsertMaandProdSamenvatting): Promise<MaandProdSamenvatting>;
  getMaandProdKartograafJaar(jaar: number): Promise<MaandProdKartograaf[]>;
  getAllMaandProdKartograaf(): Promise<MaandProdKartograaf[]>;
  getAllMaandProdSamenvatting(): Promise<MaandProdSamenvatting[]>;

  getMaandProdLandmeter(jaar: number, maand: number): Promise<MaandProdLandmeter[]>;
  getMaandProdLandmeterJaar(jaar: number): Promise<MaandProdLandmeter[]>;
  saveMaandProdLandmeter(rows: InsertMaandProdLandmeter[]): Promise<void>;
  bulkUpsertMaandProdLandmeter(rows: InsertMaandProdLandmeter[]): Promise<void>;
  getMaandProdSamenvattingLm(jaar: number, maand: number): Promise<MaandProdSamenvattingLm | undefined>;
  saveMaandProdSamenvattingLm(data: InsertMaandProdSamenvattingLm): Promise<MaandProdSamenvattingLm>;
  getAllMaandProdLandmeter(): Promise<MaandProdLandmeter[]>;
  getAllMaandProdSamenvattingLm(): Promise<MaandProdSamenvattingLm[]>;
  upsertTrendKmBuitenRow(data: InsertTrendKmBuiten): Promise<void>;

  getTrendKmBuiten(): Promise<TrendKmBuiten[]>;
  bulkUpsertTrendKmBuiten(rows: InsertTrendKmBuiten[]): Promise<void>;
  deleteTrendKmBuitenByJaar(jaar: number): Promise<void>;

  getMaandProdOrInfo(jaar: number): Promise<MaandProdOrInfo[]>;
  saveMaandProdOrInfo(rows: InsertMaandProdOrInfo[]): Promise<void>;
  upsertTrendOrInfoRow(data: InsertTrendOrInfo): Promise<void>;
  upsertTrendOrAlgemeenRow(data: InsertTrendOrAlgemeen): Promise<void>;

  getMaandProdOrNotaris(jaar: number, maand: number): Promise<MaandProdOrNotaris[]>;
  getMaandProdOrNotarisJaar(jaar: number): Promise<MaandProdOrNotaris[]>;
  saveMaandProdOrNotaris(rows: InsertMaandProdOrNotaris[]): Promise<void>;
  upsertTrendOrNotarisRow(data: InsertTrendOrNotaris): Promise<void>;

  getMaandProdKmInfo(jaar: number): Promise<MaandProdKmInfo[]>;
  saveMaandProdKmInfo(rows: InsertMaandProdKmInfo[]): Promise<void>;
  getAllMaandProdKmInfo(): Promise<MaandProdKmInfo[]>;
  upsertTrendKmInfoRow(data: InsertTrendKmInfo): Promise<void>;

  getTrendKmInfo(): Promise<TrendKmInfo[]>;
  bulkUpsertTrendKmInfo(rows: InsertTrendKmInfo[]): Promise<void>;
  deleteTrendKmInfoByJaar(jaar: number): Promise<void>;

  getTrendOrInfo(): Promise<TrendOrInfo[]>;
  bulkUpsertTrendOrInfo(rows: InsertTrendOrInfo[]): Promise<void>;
  deleteTrendOrInfoByJaar(jaar: number): Promise<void>;

  getTrendOrAlgemeen(): Promise<TrendOrAlgemeen[]>;
  bulkUpsertTrendOrAlgemeen(rows: InsertTrendOrAlgemeen[]): Promise<void>;
  deleteTrendOrAlgemeenByJaar(jaar: number): Promise<void>;

  getTrendOrNotaris(): Promise<TrendOrNotaris[]>;
  bulkUpsertTrendOrNotaris(rows: InsertTrendOrNotaris[]): Promise<void>;
  deleteTrendOrNotarisByJaar(jaar: number): Promise<void>;

  getTrendKartografenHist(): Promise<TrendKartografenHist[]>;
  bulkUpsertTrendKartografenHist(rows: InsertTrendKartografenHist[]): Promise<void>;
  upsertTrendKartografenHistRow(row: InsertTrendKartografenHist): Promise<void>;
  deleteTrendKartografenHistByJaar(jaar: number): Promise<void>;

  getWerktijden(userid?: string): Promise<Werktijden[]>;
  createWerktijden(record: InsertWerktijden): Promise<Werktijden>;
  bulkCreateWerktijden(records: InsertWerktijden[]): Promise<Werktijden[]>;
  deleteWerktijden(logid: number): Promise<void>;
  getOveruurAanvragen(): Promise<OveruurAanvraag[]>;
  createOveruurAanvraag(aanvraag: InsertOveruurAanvraag): Promise<OveruurAanvraag>;
  updateOveruurAanvraag(id: string, data: Partial<OveruurAanvraag>): Promise<OveruurAanvraag>;

  getImportLogs(): Promise<ImportLog[]>;
  createImportLog(log: InsertImportLog): Promise<ImportLog>;
  deleteImportLog(id: string): Promise<void>;

  getPrikklokEventLogs(importId?: string, limit?: number): Promise<PrikklokEventLog[]>;
  createPrikklokEventLogs(events: InsertPrikklokEventLog[]): Promise<void>;
  deleteWerktijdenByImport(importId: string): Promise<void>;

  getCorrectieverzoeken(userId?: string): Promise<Correctieverzoek[]>;
  createCorrectieverzoek(verzoek: InsertCorrectieverzoek): Promise<Correctieverzoek>;
  updateCorrectieverzoek(id: string, data: Partial<Correctieverzoek>): Promise<Correctieverzoek>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getNextKadasterId(): Promise<string> {
    const result = await db.execute(
      sql`SELECT COALESCE(MAX(NULLIF(kadaster_id, '')::integer), 0) + 1 AS next_id FROM users`
    );
    const rows = result.rows as any[];
    return String(rows[0]?.next_id ?? 1);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(events.date);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).where(eq(announcements.archived, false)).orderBy(desc(announcements.createdAt));
  }

  async getArchivedAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).where(eq(announcements.archived, true)).orderBy(desc(announcements.createdAt));
  }

  async archiveAnnouncement(id: string): Promise<void> {
    await db.update(announcements).set({ archived: true }).where(eq(announcements.id, id));
  }

  async createAnnouncement(ann: InsertAnnouncement): Promise<Announcement> {
    const [created] = await db.insert(announcements).values(ann).returning();
    return created;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updated] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments);
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const [created] = await db.insert(departments).values(dept).returning();
    return created;
  }

  async updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department> {
    const [updated] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
    return updated;
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  async getAbsences(): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]> {
    const result = await db
      .select({
        id: absences.id,
        userId: absences.userId,
        type: absences.type,
        startDate: absences.startDate,
        endDate: absences.endDate,
        reason: absences.reason,
        bvvdReason: absences.bvvdReason,
        halfDay: absences.halfDay,
        status: absences.status,
        approvedBy: absences.approvedBy,
        persoonlijkBesluit: absences.persoonlijkBesluit,
        createdAt: absences.createdAt,
        userName: users.fullName,
        userDepartment: users.department,
        userRole: users.role,
      })
      .from(absences)
      .leftJoin(users, eq(absences.userId, users.id))
      .orderBy(desc(absences.startDate));
    return result as any;
  }

  async getAbsencesByUser(userId: string): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]> {
    const result = await db
      .select({
        id: absences.id,
        userId: absences.userId,
        type: absences.type,
        startDate: absences.startDate,
        endDate: absences.endDate,
        reason: absences.reason,
        bvvdReason: absences.bvvdReason,
        halfDay: absences.halfDay,
        status: absences.status,
        approvedBy: absences.approvedBy,
        persoonlijkBesluit: absences.persoonlijkBesluit,
        createdAt: absences.createdAt,
        userName: users.fullName,
        userDepartment: users.department,
        userRole: users.role,
      })
      .from(absences)
      .leftJoin(users, eq(absences.userId, users.id))
      .where(eq(absences.userId, userId))
      .orderBy(desc(absences.startDate));
    return result as any;
  }

  async getAbsencesByDepartment(department: string): Promise<(Absence & { userName?: string; userDepartment?: string | null; userRole?: string })[]> {
    const result = await db
      .select({
        id: absences.id,
        userId: absences.userId,
        type: absences.type,
        startDate: absences.startDate,
        endDate: absences.endDate,
        reason: absences.reason,
        bvvdReason: absences.bvvdReason,
        halfDay: absences.halfDay,
        status: absences.status,
        approvedBy: absences.approvedBy,
        persoonlijkBesluit: absences.persoonlijkBesluit,
        createdAt: absences.createdAt,
        userName: users.fullName,
        userDepartment: users.department,
        userRole: users.role,
      })
      .from(absences)
      .leftJoin(users, eq(absences.userId, users.id))
      .where(eq(users.department, department))
      .orderBy(desc(absences.startDate));
    return result as any;
  }

  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const [created] = await db.insert(absences).values(absence).returning();
    return created;
  }

  async updateAbsenceStatus(id: string, status: string, approvedBy: string | null, cancelReason?: string, persoonlijkBesluit?: string | null): Promise<void> {
    const fields: any = { status: status as any, approvedBy };
    if (cancelReason !== undefined) fields.cancelReason = cancelReason;
    if (persoonlijkBesluit !== undefined) fields.persoonlijkBesluit = persoonlijkBesluit;
    await db.update(absences).set(fields).where(eq(absences.id, id));
  }

  async getAbsenceById(id: string): Promise<Absence | undefined> {
    const [absence] = await db.select().from(absences).where(eq(absences.id, id));
    return absence;
  }

  async deleteAbsence(id: string): Promise<void> {
    await db.delete(absenceCancellations).where(eq(absenceCancellations.absenceId, id));
    await db.delete(absences).where(eq(absences.id, id));
  }

  async createAbsenceCancellation(data: InsertAbsenceCancellation): Promise<AbsenceCancellation> {
    const [created] = await db.insert(absenceCancellations).values(data).returning();
    return created;
  }

  async getAbsenceCancellationsByUser(userId: string): Promise<(AbsenceCancellation & { absenceType?: string; cancelledByName?: string | null })[]> {
    const result = await db
      .select({
        id: absenceCancellations.id,
        absenceId: absenceCancellations.absenceId,
        cancelledDate: absenceCancellations.cancelledDate,
        cancelReason: absenceCancellations.cancelReason,
        cancelledBy: absenceCancellations.cancelledBy,
        affectsBalance: absenceCancellations.affectsBalance,
        createdAt: absenceCancellations.createdAt,
        absenceType: absences.type,
      })
      .from(absenceCancellations)
      .innerJoin(absences, eq(absenceCancellations.absenceId, absences.id))
      .where(eq(absences.userId, userId))
      .orderBy(desc(absenceCancellations.cancelledDate));
    return result as any;
  }

  async getAbsenceCancellationsByAbsence(absenceId: string): Promise<AbsenceCancellation[]> {
    return db.select().from(absenceCancellations).where(eq(absenceCancellations.absenceId, absenceId));
  }

  async getAllAbsenceCancellations(): Promise<(AbsenceCancellation & { absenceType?: string; userName?: string | null; userDepartment?: string | null; userRole?: string | null })[]> {
    const result = await db
      .select({
        id: absenceCancellations.id,
        absenceId: absenceCancellations.absenceId,
        cancelledDate: absenceCancellations.cancelledDate,
        cancelReason: absenceCancellations.cancelReason,
        cancelledBy: absenceCancellations.cancelledBy,
        affectsBalance: absenceCancellations.affectsBalance,
        createdAt: absenceCancellations.createdAt,
        absenceType: absences.type,
        userId: absences.userId,
        userName: users.fullName,
        userDepartment: users.department,
        userRole: users.role,
      })
      .from(absenceCancellations)
      .innerJoin(absences, eq(absenceCancellations.absenceId, absences.id))
      .leftJoin(users, eq(absences.userId, users.id))
      .orderBy(desc(absenceCancellations.cancelledDate));
    return result as any;
  }

  async getRewards(): Promise<(Reward & { userName?: string })[]> {
    const result = await db
      .select({
        id: rewards.id,
        userId: rewards.userId,
        points: rewards.points,
        reason: rewards.reason,
        awardedBy: rewards.awardedBy,
        awardedAt: rewards.awardedAt,
        userName: users.fullName,
      })
      .from(rewards)
      .leftJoin(users, eq(rewards.userId, users.id))
      .orderBy(desc(rewards.awardedAt));
    return result as any;
  }

  async getRewardsByUser(userId: string): Promise<(Reward & { userName?: string })[]> {
    const result = await db
      .select({
        id: rewards.id,
        userId: rewards.userId,
        points: rewards.points,
        reason: rewards.reason,
        awardedBy: rewards.awardedBy,
        awardedAt: rewards.awardedAt,
        userName: users.fullName,
      })
      .from(rewards)
      .leftJoin(users, eq(rewards.userId, users.id))
      .where(eq(rewards.userId, userId))
      .orderBy(desc(rewards.awardedAt));
    return result as any;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [created] = await db.insert(rewards).values(reward).returning();
    return created;
  }

  async getLeaderboard(): Promise<{ userId: string; userName: string; totalPoints: number }[]> {
    const result = await db
      .select({
        userId: rewards.userId,
        userName: users.fullName,
        totalPoints: sql<number>`sum(${rewards.points})::int`,
      })
      .from(rewards)
      .leftJoin(users, eq(rewards.userId, users.id))
      .groupBy(rewards.userId, users.fullName)
      .orderBy(sql`sum(${rewards.points}) desc`);
    return result as any;
  }

  async updateUserPermissions(id: string, permissions: string[]): Promise<User> {
    const [updated] = await db.update(users).set({ permissions }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getApplications(): Promise<Application[]> {
    return db.select().from(applications);
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(app).returning();
    return created;
  }

  async updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application> {
    const [updated] = await db.update(applications).set(data).where(eq(applications.id, id)).returning();
    return updated;
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(appAccess).where(eq(appAccess.applicationId, id));
    await db.delete(applications).where(eq(applications.id, id));
  }

  async getAppAccess(): Promise<(AppAccess & { userName?: string; appName?: string })[]> {
    const result = await db
      .select({
        id: appAccess.id,
        userId: appAccess.userId,
        applicationId: appAccess.applicationId,
        accessLevel: appAccess.accessLevel,
        grantedAt: appAccess.grantedAt,
        userName: users.fullName,
        appName: applications.name,
      })
      .from(appAccess)
      .leftJoin(users, eq(appAccess.userId, users.id))
      .leftJoin(applications, eq(appAccess.applicationId, applications.id));
    return result as any;
  }

  async createAppAccess(access: InsertAppAccess): Promise<AppAccess> {
    const [created] = await db.insert(appAccess).values(access).returning();
    return created;
  }

  async deleteAppAccess(id: string): Promise<void> {
    await db.delete(appAccess).where(eq(appAccess.id, id));
  }

  async getDashboardStats() {
    const [employeeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.active, true));
    const [temporaryEmployeeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.active, true), eq(users.role, "tijdelijk")));
    const today = new Date().toISOString().split("T")[0];
    const [activeAbsenceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(absences)
      .where(and(
        sql`${absences.endDate} >= ${today}`,
        eq(absences.status, "approved")
      ));
    const [pendingAbsenceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(absences)
      .where(eq(absences.status, "pending"));
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(sql`${events.date} >= ${today}`);
    const [rewardSum] = await db
      .select({ total: sql<number>`coalesce(sum(${rewards.points}), 0)::int` })
      .from(rewards);

    return {
      totalEmployees: employeeCount?.count || 0,
      temporaryEmployees: temporaryEmployeeCount?.count || 0,
      activeAbsences: activeAbsenceCount?.count || 0,
      upcomingEvents: eventCount?.count || 0,
      totalRewardPoints: rewardSum?.total || 0,
      pendingAbsences: pendingAbsenceCount?.count || 0,
    };
  }

  async getMessagesByUser(userId: string): Promise<(Message & { fromUserName?: string; toUserName?: string })[]> {
    const { alias } = await import("drizzle-orm/pg-core");
    const { or } = await import("drizzle-orm");
    const fromUser = alias(users, "from_user");
    const toUser = alias(users, "to_user");
    const result = await db
      .select({
        id: messages.id,
        fromUserId: messages.fromUserId,
        toUserId: messages.toUserId,
        subject: messages.subject,
        content: messages.content,
        reply: messages.reply,
        repliedAt: messages.repliedAt,
        read: messages.read,
        createdAt: messages.createdAt,
        fromUserName: fromUser.fullName,
        toUserName: toUser.fullName,
      })
      .from(messages)
      .leftJoin(fromUser, eq(messages.fromUserId, fromUser.id))
      .leftJoin(toUser, eq(messages.toUserId, toUser.id))
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.createdAt));
    return result as any;
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async replyToMessage(id: string, reply: string): Promise<Message> {
    const [updated] = await db.update(messages).set({ reply, repliedAt: new Date() }).where(eq(messages.id, id)).returning();
    return updated;
  }

  async markMessageRead(id: string): Promise<void> {
    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  }

  async getAoProcedures(): Promise<(AoProcedure & { departmentName?: string })[]> {
    const result = await db
      .select({
        id: aoProcedures.id,
        departmentId: aoProcedures.departmentId,
        title: aoProcedures.title,
        description: aoProcedures.description,
        departmentName: departments.name,
      })
      .from(aoProcedures)
      .leftJoin(departments, eq(aoProcedures.departmentId, departments.id));
    return result as any;
  }

  async getAoProceduresByDepartment(departmentId: string): Promise<AoProcedure[]> {
    return db.select().from(aoProcedures).where(eq(aoProcedures.departmentId, departmentId));
  }

  async createAoProcedure(proc: InsertAoProcedure): Promise<AoProcedure> {
    const [created] = await db.insert(aoProcedures).values(proc).returning();
    return created;
  }

  async deleteAoProcedure(id: string): Promise<void> {
    await db.delete(aoInstructions).where(eq(aoInstructions.procedureId, id));
    await db.delete(aoProcedures).where(eq(aoProcedures.id, id));
  }

  async getAoInstructions(procedureId: string): Promise<AoInstruction[]> {
    return db.select().from(aoInstructions).where(eq(aoInstructions.procedureId, procedureId)).orderBy(aoInstructions.sortOrder);
  }

  async createAoInstruction(instr: InsertAoInstruction): Promise<AoInstruction> {
    const [created] = await db.insert(aoInstructions).values(instr).returning();
    return created;
  }

  async deleteAoInstruction(id: string): Promise<void> {
    await db.delete(aoInstructions).where(eq(aoInstructions.id, id));
  }

  async getPositionHistoryByUser(userId: string): Promise<PositionHistory[]> {
    return db.select().from(positionHistory).where(eq(positionHistory.userId, userId)).orderBy(desc(positionHistory.startDate));
  }

  async getPositionHistoryAll(): Promise<(PositionHistory & { userName?: string })[]> {
    const result = await db
      .select({
        id: positionHistory.id,
        userId: positionHistory.userId,
        functionTitle: positionHistory.functionTitle,
        startDate: positionHistory.startDate,
        endDate: positionHistory.endDate,
        salary: positionHistory.salary,
        notes: positionHistory.notes,
        userName: users.fullName,
      })
      .from(positionHistory)
      .leftJoin(users, eq(positionHistory.userId, users.id))
      .orderBy(desc(positionHistory.startDate));
    return result as any;
  }

  async createPositionHistory(entry: InsertPositionHistory): Promise<PositionHistory> {
    const [created] = await db.insert(positionHistory).values(entry).returning();
    return created;
  }

  async updatePositionHistory(id: string, data: Partial<InsertPositionHistory>): Promise<PositionHistory> {
    const [updated] = await db.update(positionHistory).set(data).where(eq(positionHistory.id, id)).returning();
    return updated;
  }

  async deletePositionHistory(id: string): Promise<void> {
    await db.delete(positionHistory).where(eq(positionHistory.id, id));
  }

  async getPersonalDevelopmentByUser(userId: string): Promise<PersonalDevelopment[]> {
    return db.select().from(personalDevelopment).where(eq(personalDevelopment.userId, userId)).orderBy(desc(personalDevelopment.startDate));
  }

  async createPersonalDevelopment(entry: InsertPersonalDevelopment): Promise<PersonalDevelopment> {
    const [created] = await db.insert(personalDevelopment).values(entry).returning();
    return created;
  }

  async updatePersonalDevelopment(id: string, data: Partial<InsertPersonalDevelopment>): Promise<PersonalDevelopment> {
    const [updated] = await db.update(personalDevelopment).set(data).where(eq(personalDevelopment.id, id)).returning();
    return updated;
  }

  async deletePersonalDevelopment(id: string): Promise<void> {
    await db.delete(personalDevelopment).where(eq(personalDevelopment.id, id));
  }

  async getLegislationLinks(): Promise<LegislationLink[]> {
    return db.select().from(legislationLinks);
  }

  async createLegislationLink(link: InsertLegislationLink): Promise<LegislationLink> {
    const [created] = await db.insert(legislationLinks).values(link).returning();
    return created;
  }

  async deleteLegislationLink(id: string): Promise<void> {
    await db.delete(legislationLinks).where(eq(legislationLinks.id, id));
  }

  async getCaoDocuments(): Promise<CaoDocument[]> {
    return db.select().from(caoDocuments);
  }

  async createCaoDocument(doc: InsertCaoDocument): Promise<CaoDocument> {
    const [created] = await db.insert(caoDocuments).values(doc).returning();
    return created;
  }

  async deleteCaoDocument(id: string): Promise<void> {
    await db.delete(caoDocuments).where(eq(caoDocuments.id, id));
  }

  async getSiteSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return row?.value ?? null;
  }

  async setSiteSetting(key: string, value: string): Promise<void> {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }

  async getFunctioneringReviews(): Promise<(FunctioneringReview & { userName?: string })[]> {
    const result = await db
      .select({
        id: functioneringReviews.id,
        userId: functioneringReviews.userId,
        year: functioneringReviews.year,
        medewerker: functioneringReviews.medewerker,
        functie: functioneringReviews.functie,
        afdeling: functioneringReviews.afdeling,
        leidinggevende: functioneringReviews.leidinggevende,
        datum: functioneringReviews.datum,
        periode: functioneringReviews.periode,
        terugblikTaken: functioneringReviews.terugblikTaken,
        terugblikResultaten: functioneringReviews.terugblikResultaten,
        terugblikKnelpunten: functioneringReviews.terugblikKnelpunten,
        werkinhoud: functioneringReviews.werkinhoud,
        samenwerking: functioneringReviews.samenwerking,
        communicatie: functioneringReviews.communicatie,
        arbeidsomstandigheden: functioneringReviews.arbeidsomstandigheden,
        persoonlijkeOntwikkeling: functioneringReviews.persoonlijkeOntwikkeling,
        scholingswensen: functioneringReviews.scholingswensen,
        doelstelling1: functioneringReviews.doelstelling1,
        doelstelling1Termijn: functioneringReviews.doelstelling1Termijn,
        doelstelling2: functioneringReviews.doelstelling2,
        doelstelling2Termijn: functioneringReviews.doelstelling2Termijn,
        doelstelling3: functioneringReviews.doelstelling3,
        doelstelling3Termijn: functioneringReviews.doelstelling3Termijn,
        afspraken: functioneringReviews.afspraken,
        opmerkingMedewerker: functioneringReviews.opmerkingMedewerker,
        opmerkingLeidinggevende: functioneringReviews.opmerkingLeidinggevende,
        createdBy: functioneringReviews.createdBy,
        createdAt: functioneringReviews.createdAt,
        updatedAt: functioneringReviews.updatedAt,
        userName: users.fullName,
      })
      .from(functioneringReviews)
      .leftJoin(users, eq(functioneringReviews.userId, users.id))
      .orderBy(desc(functioneringReviews.year), desc(functioneringReviews.createdAt));
    return result as any;
  }

  async getFunctioneringReviewsByUser(userId: string): Promise<FunctioneringReview[]> {
    return db.select().from(functioneringReviews)
      .where(eq(functioneringReviews.userId, userId))
      .orderBy(desc(functioneringReviews.year));
  }

  async getFunctioneringReviewsByYear(year: number): Promise<(FunctioneringReview & { userName?: string })[]> {
    const result = await db
      .select({
        id: functioneringReviews.id,
        userId: functioneringReviews.userId,
        year: functioneringReviews.year,
        medewerker: functioneringReviews.medewerker,
        functie: functioneringReviews.functie,
        afdeling: functioneringReviews.afdeling,
        leidinggevende: functioneringReviews.leidinggevende,
        datum: functioneringReviews.datum,
        periode: functioneringReviews.periode,
        terugblikTaken: functioneringReviews.terugblikTaken,
        terugblikResultaten: functioneringReviews.terugblikResultaten,
        terugblikKnelpunten: functioneringReviews.terugblikKnelpunten,
        werkinhoud: functioneringReviews.werkinhoud,
        samenwerking: functioneringReviews.samenwerking,
        communicatie: functioneringReviews.communicatie,
        arbeidsomstandigheden: functioneringReviews.arbeidsomstandigheden,
        persoonlijkeOntwikkeling: functioneringReviews.persoonlijkeOntwikkeling,
        scholingswensen: functioneringReviews.scholingswensen,
        doelstelling1: functioneringReviews.doelstelling1,
        doelstelling1Termijn: functioneringReviews.doelstelling1Termijn,
        doelstelling2: functioneringReviews.doelstelling2,
        doelstelling2Termijn: functioneringReviews.doelstelling2Termijn,
        doelstelling3: functioneringReviews.doelstelling3,
        doelstelling3Termijn: functioneringReviews.doelstelling3Termijn,
        afspraken: functioneringReviews.afspraken,
        opmerkingMedewerker: functioneringReviews.opmerkingMedewerker,
        opmerkingLeidinggevende: functioneringReviews.opmerkingLeidinggevende,
        createdBy: functioneringReviews.createdBy,
        createdAt: functioneringReviews.createdAt,
        updatedAt: functioneringReviews.updatedAt,
        userName: users.fullName,
      })
      .from(functioneringReviews)
      .leftJoin(users, eq(functioneringReviews.userId, users.id))
      .where(eq(functioneringReviews.year, year))
      .orderBy(functioneringReviews.medewerker);
    return result as any;
  }

  async getFunctioneringReviewByUserAndYear(userId: string, year: number): Promise<FunctioneringReview | undefined> {
    const [review] = await db.select().from(functioneringReviews)
      .where(and(eq(functioneringReviews.userId, userId), eq(functioneringReviews.year, year)));
    return review;
  }

  async createFunctioneringReview(review: InsertFunctioneringReview): Promise<FunctioneringReview> {
    const [created] = await db.insert(functioneringReviews).values(review).returning();
    return created;
  }

  async updateFunctioneringReview(id: string, data: Partial<InsertFunctioneringReview>): Promise<FunctioneringReview> {
    const [updated] = await db.update(functioneringReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(functioneringReviews.id, id))
      .returning();
    return updated;
  }

  async deleteFunctioneringReview(id: string): Promise<void> {
    await db.delete(functioneringReviews).where(eq(functioneringReviews.id, id));
  }

  async getCompetenciesByFunctie(functie: string): Promise<Competency[]> {
    return db.select().from(competencies)
      .where(eq(competencies.functie, functie))
      .orderBy(competencies.sortOrder);
  }

  async getAllCompetencies(): Promise<Competency[]> {
    return db.select().from(competencies).orderBy(competencies.functie, competencies.sortOrder);
  }

  async createCompetency(comp: InsertCompetency): Promise<Competency> {
    const [created] = await db.insert(competencies).values(comp).returning();
    return created;
  }

  async updateCompetency(id: string, data: Partial<InsertCompetency>): Promise<Competency> {
    const [updated] = await db.update(competencies).set(data).where(eq(competencies.id, id)).returning();
    return updated;
  }

  async deleteCompetency(id: string): Promise<void> {
    await db.delete(beoordelingScores).where(eq(beoordelingScores.competencyId, id));
    await db.delete(competencies).where(eq(competencies.id, id));
  }

  async getBeoordelingReviews(): Promise<(BeoordelingReview & { userName?: string })[]> {
    const result = await db
      .select({
        id: beoordelingReviews.id,
        userId: beoordelingReviews.userId,
        year: beoordelingReviews.year,
        medewerker: beoordelingReviews.medewerker,
        functie: beoordelingReviews.functie,
        afdeling: beoordelingReviews.afdeling,
        beoordelaar: beoordelingReviews.beoordelaar,
        datum: beoordelingReviews.datum,
        periode: beoordelingReviews.periode,
        totalScore: beoordelingReviews.totalScore,
        afspraken: beoordelingReviews.afspraken,
        opmerkingMedewerker: beoordelingReviews.opmerkingMedewerker,
        opmerkingBeoordelaar: beoordelingReviews.opmerkingBeoordelaar,
        createdBy: beoordelingReviews.createdBy,
        createdAt: beoordelingReviews.createdAt,
        updatedAt: beoordelingReviews.updatedAt,
        userName: users.fullName,
      })
      .from(beoordelingReviews)
      .leftJoin(users, eq(beoordelingReviews.userId, users.id))
      .orderBy(desc(beoordelingReviews.year), desc(beoordelingReviews.createdAt));
    return result as any;
  }

  async getBeoordelingReviewsByUser(userId: string): Promise<BeoordelingReview[]> {
    return db.select().from(beoordelingReviews)
      .where(eq(beoordelingReviews.userId, userId))
      .orderBy(desc(beoordelingReviews.year));
  }

  async getBeoordelingReviewsByYear(year: number): Promise<(BeoordelingReview & { userName?: string })[]> {
    const result = await db
      .select({
        id: beoordelingReviews.id,
        userId: beoordelingReviews.userId,
        year: beoordelingReviews.year,
        medewerker: beoordelingReviews.medewerker,
        functie: beoordelingReviews.functie,
        afdeling: beoordelingReviews.afdeling,
        beoordelaar: beoordelingReviews.beoordelaar,
        datum: beoordelingReviews.datum,
        periode: beoordelingReviews.periode,
        totalScore: beoordelingReviews.totalScore,
        afspraken: beoordelingReviews.afspraken,
        opmerkingMedewerker: beoordelingReviews.opmerkingMedewerker,
        opmerkingBeoordelaar: beoordelingReviews.opmerkingBeoordelaar,
        createdBy: beoordelingReviews.createdBy,
        createdAt: beoordelingReviews.createdAt,
        updatedAt: beoordelingReviews.updatedAt,
        userName: users.fullName,
      })
      .from(beoordelingReviews)
      .leftJoin(users, eq(beoordelingReviews.userId, users.id))
      .where(eq(beoordelingReviews.year, year))
      .orderBy(beoordelingReviews.medewerker);
    return result as any;
  }

  async getBeoordelingReviewByUserAndYear(userId: string, year: number): Promise<BeoordelingReview | undefined> {
    const [review] = await db.select().from(beoordelingReviews)
      .where(and(eq(beoordelingReviews.userId, userId), eq(beoordelingReviews.year, year)));
    return review;
  }

  async createBeoordelingReview(review: InsertBeoordelingReview): Promise<BeoordelingReview> {
    const [created] = await db.insert(beoordelingReviews).values(review).returning();
    return created;
  }

  async updateBeoordelingReview(id: string, data: Partial<InsertBeoordelingReview>): Promise<BeoordelingReview> {
    const [updated] = await db.update(beoordelingReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(beoordelingReviews.id, id))
      .returning();
    return updated;
  }

  async deleteBeoordelingReview(id: string): Promise<void> {
    await db.delete(beoordelingScores).where(eq(beoordelingScores.reviewId, id));
    await db.delete(beoordelingReviews).where(eq(beoordelingReviews.id, id));
  }

  async getBeoordelingScoresByReview(reviewId: string): Promise<(BeoordelingScore & { competencyName?: string })[]> {
    const result = await db
      .select({
        id: beoordelingScores.id,
        reviewId: beoordelingScores.reviewId,
        competencyId: beoordelingScores.competencyId,
        score: beoordelingScores.score,
        toelichting: beoordelingScores.toelichting,
        competencyName: competencies.name,
      })
      .from(beoordelingScores)
      .leftJoin(competencies, eq(beoordelingScores.competencyId, competencies.id))
      .where(eq(beoordelingScores.reviewId, reviewId));
    return result as any;
  }

  async createBeoordelingScore(score: InsertBeoordelingScore): Promise<BeoordelingScore> {
    const [created] = await db.insert(beoordelingScores).values(score).returning();
    return created;
  }

  async updateBeoordelingScore(id: string, data: Partial<InsertBeoordelingScore>): Promise<BeoordelingScore> {
    const [updated] = await db.update(beoordelingScores).set(data).where(eq(beoordelingScores.id, id)).returning();
    return updated;
  }

  async deleteBeoordelingScoresByReview(reviewId: string): Promise<void> {
    await db.delete(beoordelingScores).where(eq(beoordelingScores.reviewId, reviewId));
  }

  async getJaarplanItemsByYear(year: number, afdeling?: string): Promise<JaarplanItem[]> {
    if (afdeling) {
      return await db.select().from(jaarplanItems)
        .where(and(eq(jaarplanItems.year, year), eq(jaarplanItems.afdeling, afdeling)));
    }
    return await db.select().from(jaarplanItems).where(eq(jaarplanItems.year, year));
  }

  async createJaarplanItem(item: InsertJaarplanItem): Promise<JaarplanItem> {
    const [created] = await db.insert(jaarplanItems).values(item).returning();
    return created;
  }

  async updateJaarplanItem(id: string, data: Partial<InsertJaarplanItem>): Promise<JaarplanItem> {
    const [updated] = await db.update(jaarplanItems).set({ ...data, updatedAt: new Date() }).where(eq(jaarplanItems.id, id)).returning();
    return updated;
  }

  async deleteJaarplanItem(id: string): Promise<void> {
    await db.delete(jaarplanActies).where(eq(jaarplanActies.jaarplanId, id));
    await db.delete(jaarplanOnderdelen).where(eq(jaarplanOnderdelen.jaarplanId, id));
    await db.delete(jaarplanItems).where(eq(jaarplanItems.id, id));
  }

  async getJaarplanOnderdelen(jaarplanId: string): Promise<JaarplanOnderdeel[]> {
    return await db.select().from(jaarplanOnderdelen)
      .where(eq(jaarplanOnderdelen.jaarplanId, jaarplanId))
      .orderBy(jaarplanOnderdelen.createdAt);
  }

  async createJaarplanOnderdeel(onderdeel: InsertJaarplanOnderdeel): Promise<JaarplanOnderdeel> {
    const [created] = await db.insert(jaarplanOnderdelen).values(onderdeel).returning();
    return created;
  }

  async updateJaarplanOnderdeel(id: string, naam: string): Promise<JaarplanOnderdeel> {
    const [updated] = await db.update(jaarplanOnderdelen).set({ naam }).where(eq(jaarplanOnderdelen.id, id)).returning();
    return updated;
  }

  async deleteJaarplanOnderdeel(id: string): Promise<void> {
    await db.delete(jaarplanActies).where(eq(jaarplanActies.onderdeelId, id));
    await db.delete(jaarplanOnderdelen).where(eq(jaarplanOnderdelen.id, id));
  }

  async getJaarplanActies(jaarplanId: string): Promise<JaarplanActie[]> {
    return await db.select().from(jaarplanActies)
      .where(eq(jaarplanActies.jaarplanId, jaarplanId))
      .orderBy(jaarplanActies.datum);
  }

  async getJaarplanActiesByOnderdeel(onderdeelId: string): Promise<JaarplanActie[]> {
    return await db.select().from(jaarplanActies)
      .where(eq(jaarplanActies.onderdeelId, onderdeelId))
      .orderBy(jaarplanActies.datum);
  }

  async createJaarplanActie(actie: InsertJaarplanActie): Promise<JaarplanActie> {
    const [created] = await db.insert(jaarplanActies).values(actie).returning();
    return created;
  }

  async updateJaarplanActie(id: string, data: Partial<InsertJaarplanActie>): Promise<JaarplanActie> {
    const [updated] = await db.update(jaarplanActies).set(data).where(eq(jaarplanActies.id, id)).returning();
    return updated;
  }

  async deleteJaarplanActie(id: string): Promise<void> {
    await db.delete(jaarplanActies).where(eq(jaarplanActies.id, id));
  }

  async getAllHelpContent(): Promise<HelpContent[]> {
    return db.select().from(helpContentTable);
  }

  async upsertHelpContent(data: InsertHelpContent): Promise<HelpContent> {
    const [existing] = await db.select().from(helpContentTable).where(eq(helpContentTable.pageRoute, data.pageRoute));
    if (existing) {
      const [updated] = await db.update(helpContentTable).set({ title: data.title, content: data.content }).where(eq(helpContentTable.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(helpContentTable).values(data).returning();
    return created;
  }

  async getOfficialHolidays(year?: number): Promise<OfficialHoliday[]> {
    if (year) {
      return db.select().from(officialHolidays).where(eq(officialHolidays.year, year)).orderBy(officialHolidays.date);
    }
    return db.select().from(officialHolidays).orderBy(officialHolidays.date);
  }

  async createOfficialHoliday(holiday: InsertOfficialHoliday): Promise<OfficialHoliday> {
    const [created] = await db.insert(officialHolidays).values(holiday).returning();
    return created;
  }

  async deleteOfficialHoliday(id: string): Promise<void> {
    await db.delete(officialHolidays).where(eq(officialHolidays.id, id));
  }

  async deleteOfficialHolidaysByYear(year: number): Promise<void> {
    await db.delete(officialHolidays).where(eq(officialHolidays.year, year));
  }

  async getSnipperdagen(year?: number): Promise<Snipperdag[]> {
    if (year) {
      return db.select().from(snipperdagen).where(eq(snipperdagen.year, year)).orderBy(snipperdagen.date);
    }
    return db.select().from(snipperdagen).orderBy(snipperdagen.date);
  }

  async createSnipperdag(snipperdag: InsertSnipperdag): Promise<Snipperdag> {
    const [created] = await db.insert(snipperdagen).values(snipperdag).returning();
    return created;
  }

  async deleteSnipperdag(id: string): Promise<void> {
    await db.delete(snipperdagen).where(eq(snipperdagen.id, id));
  }

  async getYearlyAwards(year?: number): Promise<YearlyAward[]> {
    if (year) {
      return await db.select().from(yearlyAwards).where(eq(yearlyAwards.year, year)).orderBy(desc(yearlyAwards.awardedAt));
    }
    return await db.select().from(yearlyAwards).orderBy(desc(yearlyAwards.awardedAt));
  }

  async createYearlyAward(award: InsertYearlyAward): Promise<YearlyAward> {
    const [created] = await db.insert(yearlyAwards).values(award).returning();
    return created;
  }

  async deleteYearlyAward(id: string): Promise<void> {
    await db.delete(yearlyAwards).where(eq(yearlyAwards.id, id));
  }

  async getJobFunctions(): Promise<JobFunction[]> {
    return await db.select().from(jobFunctions).orderBy(jobFunctions.departmentId, jobFunctions.sortOrder, jobFunctions.name);
  }

  async createJobFunction(data: InsertJobFunction): Promise<JobFunction> {
    const [created] = await db.insert(jobFunctions).values(data).returning();
    return created;
  }

  async updateJobFunction(id: string, data: Partial<InsertJobFunction>): Promise<JobFunction> {
    const [updated] = await db.update(jobFunctions).set(data).where(eq(jobFunctions.id, id)).returning();
    return updated;
  }

  async deleteJobFunction(id: string): Promise<void> {
    await db.delete(jobFunctions).where(eq(jobFunctions.id, id));
  }

  async getKartografieProductie(): Promise<KartografieProductie[]> {
    return await db.select().from(kartografieProductie).orderBy(kartografieProductie.jaar, kartografieProductie.maand);
  }

  async bulkUpsertKartografieProductie(rows: InsertKartografieProductie[]): Promise<KartografieProductie[]> {
    const results: KartografieProductie[] = [];
    for (const row of rows) {
      const existing = await db.select().from(kartografieProductie)
        .where(and(eq(kartografieProductie.jaar, row.jaar), eq(kartografieProductie.maand, row.maand)));
      if (existing.length > 0) {
        const [updated] = await db.update(kartografieProductie)
          .set({ binnengekomen: row.binnengekomen, afgehandeld: row.afgehandeld, gemiddeld: row.gemiddeld, kartografen: row.kartografen })
          .where(eq(kartografieProductie.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(kartografieProductie).values(row).returning();
        results.push(created);
      }
    }
    return results;
  }

  async deleteKartografieProductieByJaar(jaar: number): Promise<void> {
    await db.delete(kartografieProductie).where(eq(kartografieProductie.jaar, jaar));
  }

  async getMaandProdKartograaf(jaar: number, maand: number): Promise<MaandProdKartograaf[]> {
    return await db.select().from(maandProdKartograaf)
      .where(and(eq(maandProdKartograaf.jaar, jaar), eq(maandProdKartograaf.maand, maand)));
  }

  async saveMaandProdKartograaf(rows: InsertMaandProdKartograaf[]): Promise<void> {
    if (rows.length === 0) return;
    const { jaar, maand } = rows[0];
    await db.delete(maandProdKartograaf)
      .where(and(eq(maandProdKartograaf.jaar, jaar), eq(maandProdKartograaf.maand, maand)));
    if (rows.length > 0) {
      await db.insert(maandProdKartograaf).values(rows);
    }
  }

  async getMaandProdSamenvatting(jaar: number, maand: number): Promise<MaandProdSamenvatting | undefined> {
    const [row] = await db.select().from(maandProdSamenvatting)
      .where(and(eq(maandProdSamenvatting.jaar, jaar), eq(maandProdSamenvatting.maand, maand)));
    return row;
  }

  async saveMaandProdSamenvatting(data: InsertMaandProdSamenvatting): Promise<MaandProdSamenvatting> {
    const existing = await db.select().from(maandProdSamenvatting)
      .where(and(eq(maandProdSamenvatting.jaar, data.jaar), eq(maandProdSamenvatting.maand, data.maand)));
    if (existing.length > 0) {
      const [updated] = await db.update(maandProdSamenvatting)
        .set({ binnengekomen: data.binnengekomen, aantal_kartografen: data.aantal_kartografen })
        .where(eq(maandProdSamenvatting.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(maandProdSamenvatting).values(data).returning();
    return created;
  }

  async getMaandProdKartograafJaar(jaar: number): Promise<MaandProdKartograaf[]> {
    return await db.select().from(maandProdKartograaf)
      .where(eq(maandProdKartograaf.jaar, jaar))
      .orderBy(maandProdKartograaf.maand, maandProdKartograaf.kartograaf);
  }

  async getAllMaandProdKartograaf(): Promise<MaandProdKartograaf[]> {
    return await db.select().from(maandProdKartograaf)
      .orderBy(maandProdKartograaf.jaar, maandProdKartograaf.maand, maandProdKartograaf.kartograaf);
  }

  async getAllMaandProdSamenvatting(): Promise<MaandProdSamenvatting[]> {
    return await db.select().from(maandProdSamenvatting)
      .orderBy(maandProdSamenvatting.jaar, maandProdSamenvatting.maand);
  }

  async getMaandProdLandmeter(jaar: number, maand: number): Promise<MaandProdLandmeter[]> {
    return await db.select().from(maandProdLandmeter)
      .where(and(eq(maandProdLandmeter.jaar, jaar), eq(maandProdLandmeter.maand, maand)));
  }

  async getMaandProdLandmeterJaar(jaar: number): Promise<MaandProdLandmeter[]> {
    return await db.select().from(maandProdLandmeter)
      .where(eq(maandProdLandmeter.jaar, jaar))
      .orderBy(maandProdLandmeter.maand, maandProdLandmeter.landmeter);
  }

  async saveMaandProdLandmeter(rows: InsertMaandProdLandmeter[]): Promise<void> {
    if (rows.length === 0) return;
    const { jaar, maand } = rows[0];
    await db.delete(maandProdLandmeter).where(and(eq(maandProdLandmeter.jaar, jaar), eq(maandProdLandmeter.maand, maand)));
    await db.insert(maandProdLandmeter).values(rows);
  }

  async bulkUpsertMaandProdLandmeter(rows: InsertMaandProdLandmeter[]): Promise<void> {
    await this.bulkUpsertTrend(maandProdLandmeter, rows);
  }

  async getMaandProdSamenvattingLm(jaar: number, maand: number): Promise<MaandProdSamenvattingLm | undefined> {
    const [row] = await db.select().from(maandProdSamenvattingLm)
      .where(and(eq(maandProdSamenvattingLm.jaar, jaar), eq(maandProdSamenvattingLm.maand, maand)));
    return row;
  }

  async saveMaandProdSamenvattingLm(data: InsertMaandProdSamenvattingLm): Promise<MaandProdSamenvattingLm> {
    const existing = await this.getMaandProdSamenvattingLm(data.jaar, data.maand);
    if (existing) {
      const [updated] = await db.update(maandProdSamenvattingLm)
        .set({ binnengekomen: data.binnengekomen, aantal_landmeters: data.aantal_landmeters })
        .where(eq(maandProdSamenvattingLm.id, existing.id))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(maandProdSamenvattingLm).values(data).returning();
    return inserted;
  }

  async getAllMaandProdLandmeter(): Promise<MaandProdLandmeter[]> {
    return await db.select().from(maandProdLandmeter)
      .orderBy(maandProdLandmeter.jaar, maandProdLandmeter.maand, maandProdLandmeter.landmeter);
  }

  async getAllMaandProdSamenvattingLm(): Promise<MaandProdSamenvattingLm[]> {
    return await db.select().from(maandProdSamenvattingLm)
      .orderBy(maandProdSamenvattingLm.jaar, maandProdSamenvattingLm.maand);
  }

  async upsertTrendKmBuitenRow(data: InsertTrendKmBuiten): Promise<void> {
    const [existing] = await db.select().from(trendKmBuiten)
      .where(and(eq(trendKmBuiten.jaar, data.jaar), eq(trendKmBuiten.maand, data.maand)));
    if (existing) {
      await db.update(trendKmBuiten)
        .set({ binnengekomen: data.binnengekomen, afgehandeld: data.afgehandeld, uitbesteding: data.uitbesteding, gemiddeld: data.gemiddeld, landmeters: data.landmeters })
        .where(eq(trendKmBuiten.id, existing.id));
    } else {
      await db.insert(trendKmBuiten).values(data);
    }
  }

  async getMaandProdOrInfo(jaar: number): Promise<MaandProdOrInfo[]> {
    return await db.select().from(maandProdOrInfo).where(eq(maandProdOrInfo.jaar, jaar)).orderBy(maandProdOrInfo.maand);
  }
  async saveMaandProdOrInfo(rows: InsertMaandProdOrInfo[]): Promise<void> {
    if (rows.length === 0) return;
    const jaar = rows[0].jaar;
    const maanden = [...new Set(rows.map(r => r.maand))];
    for (const m of maanden) {
      await db.delete(maandProdOrInfo).where(and(eq(maandProdOrInfo.jaar, jaar), eq(maandProdOrInfo.maand, m)));
    }
    await db.insert(maandProdOrInfo).values(rows);
  }
  async upsertTrendOrInfoRow(data: InsertTrendOrInfo): Promise<void> {
    const [existing] = await db.select().from(trendOrInfo)
      .where(and(eq(trendOrInfo.jaar, data.jaar), eq(trendOrInfo.maand, data.maand)));
    if (existing) {
      await db.update(trendOrInfo)
        .set({ inzagen: data.inzagen, her_inzage: data.her_inzage, na_inzage: data.na_inzage, kadastaal_legger: data.kadastaal_legger, verklaring: data.verklaring, getuigschrift: data.getuigschrift })
        .where(eq(trendOrInfo.id, existing.id));
    } else {
      await db.insert(trendOrInfo).values(data);
    }
  }
  async upsertTrendOrAlgemeenRow(data: InsertTrendOrAlgemeen): Promise<void> {
    const [existing] = await db.select().from(trendOrAlgemeen)
      .where(and(eq(trendOrAlgemeen.jaar, data.jaar), eq(trendOrAlgemeen.maand, data.maand)));
    if (existing) {
      await db.update(trendOrAlgemeen)
        .set({ aktes: data.aktes, inschrijvingen: data.inschrijvingen, doorhalingen: data.doorhalingen, opheffingen: data.opheffingen, beslagen: data.beslagen, cessies: data.cessies })
        .where(eq(trendOrAlgemeen.id, existing.id));
    } else {
      await db.insert(trendOrAlgemeen).values(data);
    }
  }

  async getMaandProdOrNotaris(jaar: number, maand: number): Promise<MaandProdOrNotaris[]> {
    return await db.select().from(maandProdOrNotaris)
      .where(and(eq(maandProdOrNotaris.jaar, jaar), eq(maandProdOrNotaris.maand, maand)))
      .orderBy(maandProdOrNotaris.sort_order);
  }
  async getMaandProdOrNotarisJaar(jaar: number): Promise<MaandProdOrNotaris[]> {
    return await db.select().from(maandProdOrNotaris)
      .where(eq(maandProdOrNotaris.jaar, jaar))
      .orderBy(maandProdOrNotaris.maand, maandProdOrNotaris.sort_order);
  }
  async saveMaandProdOrNotaris(rows: InsertMaandProdOrNotaris[]): Promise<void> {
    if (rows.length === 0) return;
    const { jaar, maand } = rows[0];
    await db.delete(maandProdOrNotaris).where(and(eq(maandProdOrNotaris.jaar, jaar), eq(maandProdOrNotaris.maand, maand)));
    await db.insert(maandProdOrNotaris).values(rows);
  }
  async upsertTrendOrNotarisRow(data: InsertTrendOrNotaris): Promise<void> {
    const [existing] = await db.select().from(trendOrNotaris)
      .where(and(eq(trendOrNotaris.jaar, data.jaar), eq(trendOrNotaris.maand, data.maand), eq(trendOrNotaris.notaris_key, data.notaris_key)));
    if (existing) {
      await db.update(trendOrNotaris).set({ waarde: data.waarde }).where(eq(trendOrNotaris.id, existing.id));
    } else {
      await db.insert(trendOrNotaris).values(data);
    }
  }

  async getMaandProdKmInfo(jaar: number): Promise<MaandProdKmInfo[]> {
    return await db.select().from(maandProdKmInfo).where(eq(maandProdKmInfo.jaar, jaar)).orderBy(maandProdKmInfo.maand);
  }
  async saveMaandProdKmInfo(rows: InsertMaandProdKmInfo[]): Promise<void> {
    if (rows.length === 0) return;
    const jaar = rows[0].jaar;
    const maanden = [...new Set(rows.map(r => r.maand))];
    for (const m of maanden) {
      await db.delete(maandProdKmInfo).where(and(eq(maandProdKmInfo.jaar, jaar), eq(maandProdKmInfo.maand, m)));
    }
    await db.insert(maandProdKmInfo).values(rows);
  }
  async getAllMaandProdKmInfo(): Promise<MaandProdKmInfo[]> {
    return await db.select().from(maandProdKmInfo).orderBy(maandProdKmInfo.jaar, maandProdKmInfo.maand);
  }
  async upsertTrendKmInfoRow(data: InsertTrendKmInfo): Promise<void> {
    const [existing] = await db.select().from(trendKmInfo)
      .where(and(eq(trendKmInfo.jaar, data.jaar), eq(trendKmInfo.maand, data.maand)));
    if (existing) {
      await db.update(trendKmInfo)
        .set({ kkp: data.kkp, db: data.db, sa: data.sa, rm: data.rm, re: data.re, km: data.km, ik: data.ik })
        .where(eq(trendKmInfo.id, existing.id));
    } else {
      await db.insert(trendKmInfo).values(data);
    }
  }

  // ── Trend helpers (delete-then-insert per jaar) ───────────────────────────
  private async bulkUpsertTrend<T extends { jaar: number; maand: number }>(
    table: any, rows: T[]
  ): Promise<void> {
    if (rows.length === 0) return;
    const jaren = [...new Set(rows.map(r => r.jaar))];
    for (const jaar of jaren) {
      await db.delete(table).where(eq(table.jaar, jaar));
    }
    await db.insert(table).values(rows as any);
  }

  async getTrendKmBuiten(): Promise<TrendKmBuiten[]> {
    return await db.select().from(trendKmBuiten).orderBy(trendKmBuiten.jaar, trendKmBuiten.maand);
  }
  async bulkUpsertTrendKmBuiten(rows: InsertTrendKmBuiten[]): Promise<void> {
    await this.bulkUpsertTrend(trendKmBuiten, rows);
  }
  async deleteTrendKmBuitenByJaar(jaar: number): Promise<void> {
    await db.delete(trendKmBuiten).where(eq(trendKmBuiten.jaar, jaar));
  }

  async getTrendKmInfo(): Promise<TrendKmInfo[]> {
    return await db.select().from(trendKmInfo).orderBy(trendKmInfo.jaar, trendKmInfo.maand);
  }
  async bulkUpsertTrendKmInfo(rows: InsertTrendKmInfo[]): Promise<void> {
    await this.bulkUpsertTrend(trendKmInfo, rows);
  }
  async deleteTrendKmInfoByJaar(jaar: number): Promise<void> {
    await db.delete(trendKmInfo).where(eq(trendKmInfo.jaar, jaar));
  }

  async getTrendOrInfo(): Promise<TrendOrInfo[]> {
    return await db.select().from(trendOrInfo).orderBy(trendOrInfo.jaar, trendOrInfo.maand);
  }
  async bulkUpsertTrendOrInfo(rows: InsertTrendOrInfo[]): Promise<void> {
    await this.bulkUpsertTrend(trendOrInfo, rows);
  }
  async deleteTrendOrInfoByJaar(jaar: number): Promise<void> {
    await db.delete(trendOrInfo).where(eq(trendOrInfo.jaar, jaar));
  }

  async getTrendOrAlgemeen(): Promise<TrendOrAlgemeen[]> {
    return await db.select().from(trendOrAlgemeen).orderBy(trendOrAlgemeen.jaar, trendOrAlgemeen.maand);
  }
  async bulkUpsertTrendOrAlgemeen(rows: InsertTrendOrAlgemeen[]): Promise<void> {
    await this.bulkUpsertTrend(trendOrAlgemeen, rows);
  }
  async deleteTrendOrAlgemeenByJaar(jaar: number): Promise<void> {
    await db.delete(trendOrAlgemeen).where(eq(trendOrAlgemeen.jaar, jaar));
  }

  async getTrendOrNotaris(): Promise<TrendOrNotaris[]> {
    return await db.select().from(trendOrNotaris).orderBy(trendOrNotaris.jaar, trendOrNotaris.maand, trendOrNotaris.notaris_key);
  }
  async bulkUpsertTrendOrNotaris(rows: InsertTrendOrNotaris[]): Promise<void> {
    await this.bulkUpsertTrend(trendOrNotaris, rows);
  }
  async deleteTrendOrNotarisByJaar(jaar: number): Promise<void> {
    await db.delete(trendOrNotaris).where(eq(trendOrNotaris.jaar, jaar));
  }

  async getTrendKartografenHist(): Promise<TrendKartografenHist[]> {
    return await db.select().from(trendKartografenHist).orderBy(trendKartografenHist.jaar, trendKartografenHist.maand);
  }
  async bulkUpsertTrendKartografenHist(rows: InsertTrendKartografenHist[]): Promise<void> {
    await this.bulkUpsertTrend(trendKartografenHist, rows);
  }
  async upsertTrendKartografenHistRow(row: InsertTrendKartografenHist): Promise<void> {
    const existing = await db.select().from(trendKartografenHist)
      .where(and(eq(trendKartografenHist.jaar, row.jaar), eq(trendKartografenHist.maand, row.maand)));
    if (existing.length > 0) {
      await db.update(trendKartografenHist)
        .set({ egaleano: row.egaleano, jpieters: row.jpieters, nsambo: row.nsambo, binnengekomen: row.binnengekomen, afgehandeld: row.afgehandeld })
        .where(eq(trendKartografenHist.id, existing[0].id));
    } else {
      await db.insert(trendKartografenHist).values(row);
    }
  }
  async deleteTrendKartografenHistByJaar(jaar: number): Promise<void> {
    await db.delete(trendKartografenHist).where(eq(trendKartografenHist.jaar, jaar));
  }

  async getWerktijden(userid?: string): Promise<Werktijden[]> {
    if (userid) {
      return db.select().from(werktijden).where(eq(werktijden.userid, userid)).orderBy(desc(werktijden.checktime));
    }
    return db.select().from(werktijden).orderBy(desc(werktijden.checktime));
  }

  async createWerktijden(record: InsertWerktijden): Promise<Werktijden> {
    const [created] = await db.insert(werktijden).values(record).returning();
    return created;
  }

  async bulkCreateWerktijden(records: InsertWerktijden[]): Promise<Werktijden[]> {
    if (records.length === 0) return [];
    return db.insert(werktijden).values(records).returning();
  }

  async deleteWerktijden(logid: number): Promise<void> {
    await db.delete(werktijden).where(eq(werktijden.logid, logid));
  }

  async getOveruurAanvragen(): Promise<OveruurAanvraag[]> {
    return db.select().from(overuurAanvragen).orderBy(desc(overuurAanvragen.createdAt));
  }

  async createOveruurAanvraag(aanvraag: InsertOveruurAanvraag): Promise<OveruurAanvraag> {
    const [created] = await db.insert(overuurAanvragen).values(aanvraag).returning();
    return created;
  }

  async updateOveruurAanvraag(id: string, data: Partial<OveruurAanvraag>): Promise<OveruurAanvraag> {
    const [updated] = await db.update(overuurAanvragen).set(data).where(eq(overuurAanvragen.id, id)).returning();
    return updated;
  }

  async getImportLogs(): Promise<ImportLog[]> {
    return db.select().from(importLog).orderBy(desc(importLog.importedAt));
  }

  async createImportLog(log: InsertImportLog): Promise<ImportLog> {
    const [created] = await db.insert(importLog).values(log).returning();
    return created;
  }

  async getPrikklokEventLogs(importId?: string, limit = 500): Promise<PrikklokEventLog[]> {
    if (importId) {
      return db.select().from(prikklokEventLog)
        .where(eq(prikklokEventLog.importId, importId))
        .orderBy(prikklokEventLog.id)
        .limit(limit);
    }
    return db.select().from(prikklokEventLog).orderBy(desc(prikklokEventLog.id)).limit(limit);
  }

  async createPrikklokEventLogs(events: InsertPrikklokEventLog[]): Promise<void> {
    if (events.length === 0) return;
    await db.insert(prikklokEventLog).values(events);
  }

  async deleteWerktijdenByImport(importId: string): Promise<void> {
    await db.delete(werktijden).where(eq(werktijden.importId, importId));
  }

  async deleteImportLog(id: string): Promise<void> {
    // 1. Haal user+datum combinaties op uit het logboek van deze import
    //    (nodig om ook records zonder importId op te ruimen)
    const infoEvents = await db.select({
      userid: prikklokEventLog.userid,
      checktime: prikklokEventLog.checktime,
    })
    .from(prikklokEventLog)
    .where(and(
      eq(prikklokEventLog.importId, id),
      eq(prikklokEventLog.eventType, "info"),
      isNotNull(prikklokEventLog.userid),
      isNotNull(prikklokEventLog.checktime),
    ));

    // 2. Verwijder werktijden met matching importId (nieuwe records)
    await db.delete(werktijden).where(eq(werktijden.importId, id));

    // 3. Verwijder ook records zonder importId die op dezelfde user+datum vallen
    const userDates = new Set<string>();
    for (const e of infoEvents) {
      if (e.userid && e.checktime) {
        const date = (e.checktime as Date).toISOString().slice(0, 10);
        userDates.add(`${e.userid}::${date}`);
      }
    }
    for (const ud of Array.from(userDates)) {
      const [userid, date] = ud.split("::");
      await db.delete(werktijden).where(and(
        eq(werktijden.userid, userid),
        sql`date(${werktijden.checktime}) = ${date}::date`,
        isNull(werktijden.importId),
      ));
    }

    // 4. Verwijder event logs en de import-entry zelf
    await db.delete(prikklokEventLog).where(eq(prikklokEventLog.importId, id));
    await db.delete(importLog).where(eq(importLog.id, id));
  }

  async getCorrectieverzoeken(userId?: string): Promise<Correctieverzoek[]> {
    if (userId !== undefined) {
      return db.select().from(correctieverzoeken)
        .where(eq(correctieverzoeken.ingediendDoor, userId))
        .orderBy(desc(correctieverzoeken.createdAt));
    }
    return db.select().from(correctieverzoeken).orderBy(desc(correctieverzoeken.createdAt));
  }

  async createCorrectieverzoek(verzoek: InsertCorrectieverzoek): Promise<Correctieverzoek> {
    const [created] = await db.insert(correctieverzoeken).values(verzoek).returning();
    return created;
  }

  async updateCorrectieverzoek(id: string, data: Partial<Correctieverzoek>): Promise<Correctieverzoek> {
    const [updated] = await db.update(correctieverzoeken).set(data).where(eq(correctieverzoeken.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
