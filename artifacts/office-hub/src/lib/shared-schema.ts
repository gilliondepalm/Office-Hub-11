import { z } from "zod";

export type User = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: "directeur" | "admin" | "manager" | "manager_az" | "employee" | "tijdelijk";
  department: string | null;
  avatar: string | null;
  active: boolean;
  permissions: string[] | null;
  startDate: string | null;
  endDate: string | null;
  birthDate: string | null;
  vacationDaysTotal: number | null;
  vacationDaysSaldoOud: number | null;
  phoneExtension: string | null;
  functie: string | null;
  kadasterId: string | null;
  cedulaNr: string | null;
  telefoonnr: string | null;
  mobielnr: string | null;
  adres: string | null;
  voornamen: string | null;
  voorvoegsel: string | null;
  achternaam: string | null;
  vacationDaysCancel: number | null;
  titelsVoor: string[] | null;
  titelsAchter: string[] | null;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  category: string | null;
  createdBy: string | null;
  createdAt: Date;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  pdfUrl: string | null;
  createdBy: string | null;
  createdAt: Date;
  archived: boolean;
};

export type Department = {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
};

export type Absence = {
  id: string;
  userId: string;
  type: "sick" | "vacation" | "personal" | "other" | "bvvd" | "persoonlijk";
  startDate: string;
  endDate: string;
  reason: string | null;
  bvvdReason: string | null;
  halfDay: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy: string | null;
  deductVacation: boolean | null;
  cancelReason: string | null;
  persoonlijkBesluit: string | null;
  createdAt: Date;
};

export type AbsenceCancellation = {
  id: string;
  absenceId: string;
  cancelledDate: string;
  cancelReason: string | null;
  cancelledBy: string | null;
  affectsBalance: boolean | null;
  createdAt: Date;
};

export type Reward = {
  id: string;
  userId: string;
  points: number;
  reason: string;
  awardedBy: string | null;
  awardedAt: Date;
};

export type Application = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  path: string | null;
  icon: string | null;
};

export type AppAccess = {
  id: string;
  userId: string;
  applicationId: string;
  accessLevel: string;
  grantedAt: Date;
};

export type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject: string;
  content: string;
  reply: string | null;
  repliedAt: Date | null;
  read: boolean;
  createdAt: Date;
};

export type AoProcedure = {
  id: string;
  departmentId: string;
  title: string;
  description: string | null;
};

export type AoInstruction = {
  id: string;
  procedureId: string;
  title: string;
  content: string;
  sortOrder: number;
};

export type PositionHistory = {
  id: string;
  userId: string;
  functionTitle: string;
  startDate: string;
  endDate: string | null;
  salary: number | null;
  beginSchaal: number | null;
  eindSchaal: number | null;
  notes: string | null;
};

export type PersonalDevelopment = {
  id: string;
  userId: string;
  trainingName: string;
  startDate: string;
  endDate: string | null;
  completed: boolean;
};

export type LegislationLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  pdfUrl: string | null;
};

export type CaoDocument = {
  id: string;
  chapterNumber: string;
  title: string;
  documentUrl: string;
};

export type FunctioneringReview = {
  id: string;
  userId: string;
  year: number;
  medewerker: string;
  functie: string | null;
  afdeling: string | null;
  leidinggevende: string | null;
  datum: string;
  periode: string | null;
  terugblikTaken: string | null;
  terugblikResultaten: string | null;
  terugblikKnelpunten: string | null;
  werkinhoud: string | null;
  samenwerking: string | null;
  communicatie: string | null;
  arbeidsomstandigheden: string | null;
  persoonlijkeOntwikkeling: string | null;
  scholingswensen: string | null;
  doelstelling1: string | null;
  doelstelling1Termijn: string | null;
  doelstelling2: string | null;
  doelstelling2Termijn: string | null;
  doelstelling3: string | null;
  doelstelling3Termijn: string | null;
  afspraken: string | null;
  opmerkingMedewerker: string | null;
  opmerkingLeidinggevende: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Competency = {
  id: string;
  functie: string;
  name: string;
  norm1: string;
  norm2: string;
  norm3: string;
  norm4: string;
  norm5: string;
  sortOrder: number;
};

export type BeoordelingReview = {
  id: string;
  userId: string;
  year: number;
  medewerker: string;
  functie: string | null;
  afdeling: string | null;
  beoordelaar: string | null;
  datum: string;
  periode: string | null;
  totalScore: string | null;
  afspraken: string | null;
  opmerkingMedewerker: string | null;
  opmerkingBeoordelaar: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BeoordelingScore = {
  id: string;
  reviewId: string;
  competencyId: string;
  score: number | null;
  toelichting: string | null;
};

export type JaarplanItem = {
  id: string;
  afdeling: string;
  year: number;
  afspraken: string;
  startDatum: string | null;
  eindDatum: string | null;
  status: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JaarplanOnderdeel = {
  id: string;
  jaarplanId: string;
  naam: string;
  createdAt: Date;
};

export type JaarplanActie = {
  id: string;
  jaarplanId: string;
  onderdeelId: string | null;
  datum: string;
  actie: string;
  status: string | null;
  createdBy: string | null;
  createdAt: Date;
};

export type HelpContent = {
  id: string;
  pageRoute: string;
  title: string;
  content: string;
};

export type Snipperdag = {
  id: string;
  name: string;
  date: string;
  year: number;
  createdBy: string | null;
  createdAt: Date;
};

export type OfficialHoliday = {
  id: string;
  name: string;
  date: string;
  year: number;
  createdBy: string | null;
};

export type YearlyAward = {
  id: string;
  year: number;
  type: string;
  name: string;
  photo: string | null;
  awardedBy: string | null;
  awardedAt: Date;
};

export type JobFunction = {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  sortOrder: number;
  descriptionFilePath: string | null;
  beginSchaal: number | null;
  eindSchaal: number | null;
  createdAt: Date;
};

export type KartografieProductie = {
  id: number;
  jaar: number;
  maand: string;
  binnengekomen: number;
  afgehandeld: number;
  gemiddeld: number;
  kartografen: number;
};

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "directeur";
}

export function canManageVacation(role?: string | null): boolean {
  return role === "admin" || role === "directeur" || role === "manager_az";
}

export const loginSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});
