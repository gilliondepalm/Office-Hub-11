import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { User, Absence } from "@shared/schema";

// ── helpers ─────────────────────────────────────────────────────────────────

function countWorkingDays(start: Date, end: Date, yearStart: Date, yearEnd: Date): number {
  const from = start < yearStart ? new Date(yearStart) : new Date(start);
  const to = end > yearEnd ? new Date(yearEnd) : new Date(end);
  if (from > to) return 0;
  let count = 0;
  const cur = new Date(from);
  while (cur <= to) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function workingDaysInYear(year: number): number {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function isActiveOnDate(user: User, date: Date): boolean {
  if (!user.startDate) return false;
  const start = new Date(user.startDate + "T00:00:00");
  if (start > date) return false;
  if (user.endDate) {
    const end = new Date(user.endDate + "T00:00:00");
    if (end < date) return false;
  }
  return true;
}

function getAgeAtDate(birthDate: string | null | undefined, date: Date): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T00:00:00");
  let age = date.getFullYear() - birth.getFullYear();
  const m = date.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && date.getDate() < birth.getDate())) age--;
  return age < 0 ? null : age;
}

function getAgeGroup(age: number): AgeGroupKey {
  if (age <= 24) return "0–24";
  if (age <= 34) return "25–34";
  if (age <= 44) return "35–44";
  if (age <= 54) return "45–54";
  return "55+";
}

type AgeGroupKey = "0–24" | "25–34" | "35–44" | "45–54" | "55+";
const AGE_GROUPS: AgeGroupKey[] = ["0–24", "25–34", "35–44", "45–54", "55+"];

interface SickStats {
  totalDays: number;
  totalSpells: number;
  percentage: number;
  gemiddeldeDuur: number;
  perMedewerker: { userId: string; name: string; days: number; spells: number }[];
}

function computeSickStats(
  absences: Absence[],
  userMap: Map<string, User>,
  year: number,
  avgHeadcount: number,
): SickStats {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalWorkingDays = workingDaysInYear(year);

  const sickAbsences = absences.filter(
    (a) => a.type === "sick" && a.status === "approved" && a.startDate && a.endDate,
  );

  const byUser = new Map<string, { days: number; spells: number }>();
  let totalDays = 0;
  let totalSpells = 0;

  for (const a of sickAbsences) {
    const aStart = parseInt(a.startDate.slice(0, 4));
    const aEnd = parseInt(a.endDate.slice(0, 4));
    if (aStart > year || aEnd < year) continue;

    const start = new Date(a.startDate + "T00:00:00");
    const end = new Date(a.endDate + "T00:00:00");
    let days = countWorkingDays(start, end, yearStart, yearEnd);
    if (days <= 0) continue;
    if (a.halfDay && days === 1) days = 0.5;

    const ex = byUser.get(a.userId) || { days: 0, spells: 0 };
    byUser.set(a.userId, { days: ex.days + days, spells: ex.spells + 1 });
    totalDays += days;
    totalSpells++;
  }

  const perMedewerker = Array.from(byUser.entries())
    .map(([userId, stat]) => ({
      userId,
      name: userMap.get(userId)?.fullName || userId,
      days: stat.days,
      spells: stat.spells,
    }))
    .sort((a, b) => b.days - a.days);

  const beschikbaar = avgHeadcount * totalWorkingDays;
  const percentage = beschikbaar > 0 ? (totalDays / beschikbaar) * 100 : 0;
  const gemiddeldeDuur = totalSpells > 0 ? totalDays / totalSpells : 0;

  return { totalDays, totalSpells, percentage, gemiddeldeDuur, perMedewerker };
}

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  muted = false,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Card className={muted ? "bg-muted/20" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <p className={`text-3xl font-bold tracking-tight ${muted ? "text-muted-foreground" : ""}`}>
          {value}
        </p>
        {sub && <div className="text-sm">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function RelativeTrend({
  current,
  previous,
  prevYear,
}: {
  current: number;
  previous: number;
  prevYear: number;
}) {
  if (previous === 0 && current === 0)
    return <span className="text-xs text-muted-foreground">Geen data beschikbaar</span>;
  if (previous === 0)
    return <span className="text-xs text-muted-foreground">Geen data vorig jaar ({prevYear})</span>;

  const diff = current - previous;
  const relativePct = Math.abs((diff / previous) * 100);

  if (Math.abs(diff) < 0.0001)
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" /> Gelijk aan {prevYear}
      </span>
    );

  const isUp = diff > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-red-600" : "text-green-600"}`}>
      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {isUp ? "Toename" : "Afname"} {relativePct.toFixed(1)}% t.o.v. {prevYear}
    </span>
  );
}

// ── main page ────────────────────────────────────────────────────────────────

export default function JaarverslagPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { user } = useAuth();

  const isManager =
    isAdminRole(user?.role) || user?.role === "manager" || user?.role === "manager_az";

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allAbsences = [], isLoading: absencesLoading } = useQuery<Absence[]>({
    queryKey: ["/api/absences"],
    enabled: isManager,
  });

  const loading = usersLoading || (isManager && absencesLoading);

  const data = useMemo(() => {
    if (!allUsers.length) return null;

    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const beginUsers = allUsers.filter((u) => isActiveOnDate(u, jan1));
    const eindUsers = allUsers.filter((u) => isActiveOnDate(u, dec31));

    const countGender = (list: User[], g: string) =>
      list.filter((u) => (u as any).gender === g).length;

    const ageGroups: Record<AgeGroupKey, { man: number; vrouw: number }> = {
      "0–24": { man: 0, vrouw: 0 },
      "25–34": { man: 0, vrouw: 0 },
      "35–44": { man: 0, vrouw: 0 },
      "45–54": { man: 0, vrouw: 0 },
      "55+": { man: 0, vrouw: 0 },
    };

    for (const u of eindUsers) {
      const age = getAgeAtDate(u.birthDate, dec31);
      if (age === null) continue;
      const grp = getAgeGroup(age);
      const g = (u as any).gender as string | undefined;
      if (g === "man") ageGroups[grp].man++;
      else if (g === "vrouw") ageGroups[grp].vrouw++;
    }

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const avgHeadcount = (beginUsers.length + eindUsers.length) / 2;

    const prevJan1 = new Date(year - 1, 0, 1);
    const prevDec31 = new Date(year - 1, 11, 31);
    const prevBegin = allUsers.filter((u) => isActiveOnDate(u, prevJan1));
    const prevEind = allUsers.filter((u) => isActiveOnDate(u, prevDec31));
    const prevAvg = (prevBegin.length + prevEind.length) / 2;

    const sickThis = computeSickStats(allAbsences, userMap, year, avgHeadcount);
    const sickPrev = computeSickStats(allAbsences, userMap, year - 1, prevAvg);

    return {
      beginJaar: beginUsers.length,
      eindJaar: eindUsers.length,
      beginMan: countGender(beginUsers, "man"),
      beginVrouw: countGender(beginUsers, "vrouw"),
      eindMan: countGender(eindUsers, "man"),
      eindVrouw: countGender(eindUsers, "vrouw"),
      ageGroups,
      sick: sickThis,
      sickPrev,
    };
  }, [allUsers, allAbsences, year]);

  const years = Array.from({ length: Math.max(currentYear - 2019, 1) }, (_, i) => currentYear - i);

  const ageGroupTotals = AGE_GROUPS.reduce(
    (acc, g) => ({
      man: acc.man + (data?.ageGroups[g]?.man ?? 0),
      vrouw: acc.vrouw + (data?.ageGroups[g]?.vrouw ?? 0),
    }),
    { man: 0, vrouw: 0 },
  );

  return (
    <div className="flex-1 overflow-auto">
      <PageHero
        title="Jaarverslag"
        subtitle="Personeels- en verzuimstatistieken"
        imageSrc="/uploads/App_pics/rapporten.png"
      />

      <div className="p-6 space-y-5 max-w-5xl">

        {/* ── year selector ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Overzicht voor jaar:</span>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── tabs ───────────────────────────────────────────────────── */}
        <Tabs defaultValue="medewerkers" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="medewerkers">Aantal medewerkers</TabsTrigger>
            <TabsTrigger value="ziekteverzuim">Ziekteverzuim</TabsTrigger>
          </TabsList>

          {/* ── tab 1: Medewerkers ─────────────────────────────────── */}
          <TabsContent value="medewerkers" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title={`Aantal per 1 januari ${year}`}
                    value={data?.beginJaar ?? "—"}
                    sub={<span className="text-muted-foreground">medewerkers in dienst</span>}
                  />
                  <StatCard
                    title={`Aantal per 31 december ${year}`}
                    value={data?.eindJaar ?? "—"}
                    sub={<span className="text-muted-foreground">medewerkers in dienst</span>}
                  />
                  <StatCard
                    title={`Man / Vrouw per 1 januari ${year}`}
                    value={
                      <span>
                        {data?.beginMan ?? 0}
                        <span className="text-muted-foreground text-xl mx-1.5">/</span>
                        {data?.beginVrouw ?? 0}
                      </span>
                    }
                  />
                  <StatCard
                    title={`Man / Vrouw per 31 december ${year}`}
                    value={
                      <span>
                        {data?.eindMan ?? 0}
                        <span className="text-muted-foreground text-xl mx-1.5">/</span>
                        {data?.eindVrouw ?? 0}
                      </span>
                    }
                  />
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Leeftijdsgroepen per 31 december {year} — man / vrouw
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">Leeftijdsgroep</TableHead>
                          <TableHead className="text-center">Man</TableHead>
                          <TableHead className="text-center">Vrouw</TableHead>
                          <TableHead className="text-center pr-4">Totaal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {AGE_GROUPS.map((grp) => {
                          const g = data?.ageGroups[grp] ?? { man: 0, vrouw: 0 };
                          return (
                            <TableRow key={grp}>
                              <TableCell className="pl-4 font-medium">{grp} jaar</TableCell>
                              <TableCell className="text-center">{g.man}</TableCell>
                              <TableCell className="text-center">{g.vrouw}</TableCell>
                              <TableCell className="text-center font-semibold pr-4">{g.man + g.vrouw}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/30 font-semibold border-t-2">
                          <TableCell className="pl-4">Totaal</TableCell>
                          <TableCell className="text-center">{ageGroupTotals.man}</TableCell>
                          <TableCell className="text-center">{ageGroupTotals.vrouw}</TableCell>
                          <TableCell className="text-center pr-4">{data?.eindJaar ?? 0}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── tab 2: Ziekteverzuim ───────────────────────────────── */}
          <TabsContent value="ziekteverzuim" className="space-y-4 pb-8">
            {!isManager ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Alleen managers en beheerders hebben toegang tot verzuimgegevens.
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (
              <>
                {/* 2×2 stat grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ziekteverzuim percentage — {year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-bold tracking-tight">
                        {(data?.sick.percentage ?? 0).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data?.sick.totalDays ?? 0} ziektedagen · {data?.sick.totalSpells ?? 0} meldingen
                      </p>
                      <RelativeTrend
                        current={data?.sick.percentage ?? 0}
                        previous={data?.sickPrev.percentage ?? 0}
                        prevYear={year - 1}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Gemiddelde duur van de ziektedagen — {year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-bold tracking-tight">
                        {(data?.sick.gemiddeldeDuur ?? 0).toFixed(1)}{" "}
                        <span className="text-lg font-normal text-muted-foreground">dagen</span>
                      </p>
                      <p className="text-xs text-muted-foreground">per ziektegeval</p>
                      <RelativeTrend
                        current={data?.sick.gemiddeldeDuur ?? 0}
                        previous={data?.sickPrev.gemiddeldeDuur ?? 0}
                        prevYear={year - 1}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ziekteverzuim percentage afgelopen jaar — {year - 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-bold tracking-tight text-muted-foreground">
                        {(data?.sickPrev.percentage ?? 0).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data?.sickPrev.totalDays ?? 0} ziektedagen · {data?.sickPrev.totalSpells ?? 0} meldingen
                      </p>
                      <RelativeTrend
                        current={data?.sick.percentage ?? 0}
                        previous={data?.sickPrev.percentage ?? 0}
                        prevYear={year - 1}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Gemiddelde duur afgelopen jaar — {year - 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-bold tracking-tight text-muted-foreground">
                        {(data?.sickPrev.gemiddeldeDuur ?? 0).toFixed(1)}{" "}
                        <span className="text-lg font-normal text-muted-foreground">dagen</span>
                      </p>
                      <p className="text-xs text-muted-foreground">per ziektegeval</p>
                      <RelativeTrend
                        current={data?.sick.gemiddeldeDuur ?? 0}
                        previous={data?.sickPrev.gemiddeldeDuur ?? 0}
                        prevYear={year - 1}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Per medewerker table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Duur ziekteverzuim per medewerker — {year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(data?.sick.perMedewerker?.length ?? 0) === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Geen goedgekeurde ziekteverzuimmeldingen gevonden voor {year}.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">Medewerker</TableHead>
                            <TableHead className="text-right">Ziektedagen</TableHead>
                            <TableHead className="text-right">Meldingen</TableHead>
                            <TableHead className="text-right pr-4">Gem. duur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.sick.perMedewerker.map((row) => (
                            <TableRow key={row.userId}>
                              <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                              <TableCell className="text-right">{row.days}</TableCell>
                              <TableCell className="text-right">{row.spells}</TableCell>
                              <TableCell className="text-right pr-4">
                                {row.spells > 0 ? (row.days / row.spells).toFixed(1) : "—"} d
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
