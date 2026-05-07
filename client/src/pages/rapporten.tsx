import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Users, Cake, Award, ActivitySquare, ArrowUpDown, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/page-hero";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { User } from "@shared/schema";

type UserExt = User & {
  kadasterId?: string | null;
  cedulaNr?: string | null;
  telefoonnr?: string | null;
  mobielnr?: string | null;
  adres?: string | null;
};

const roleLabels: Record<string, string> = {
  directeur: "Directeur",
  admin: "Beheerder",
  manager: "Manager",
  manager_az: "Beheerder AZ",
  employee: "Medewerker",
};

function formatDateDutch(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function birthdaySort(a: UserExt, b: UserExt) {
  if (!a.birthDate && !b.birthDate) return 0;
  if (!a.birthDate) return 1;
  if (!b.birthDate) return -1;
  const [, am, ad] = a.birthDate.split("-");
  const [, bm, bd] = b.birthDate.split("-");
  return am !== bm ? parseInt(am) - parseInt(bm) : parseInt(ad) - parseInt(bd);
}

function yearsOfService(startDate: string | null | undefined) {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) years--;
  return years;
}

function PrintButton({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
      data-testid="button-print"
    >
      <Printer className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

type InfoSortField = "afdeling" | "naam" | "voornamen" | "kadasterId";

function MedewerkerInfoTab({ users }: { users: UserExt[] }) {
  const [sortField, setSortField] = useState<InfoSortField>("naam");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const active = users.filter(u => u.active);
  const allSorted = [...active].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const filtered = selectedUserId === "all" ? active : active.filter(u => u.id === selectedUserId);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortField) {
      case "afdeling": {
        const deptCmp = (a.department || "").localeCompare(b.department || "", "nl");
        return deptCmp !== 0 ? deptCmp : (a.fullName || "").localeCompare(b.fullName || "", "nl");
      }
      case "naam":
        return (a.fullName || "").localeCompare(b.fullName || "", "nl");
      case "voornamen":
        return ((a as any).voornamen || a.fullName || "").localeCompare((b as any).voornamen || b.fullName || "", "nl");
      case "kadasterId":
        return ((a as any).kadasterId || "").localeCompare((b as any).kadasterId || "", "nl");
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Overzicht van medewerkergegevens — {active.length} actieve medewerkers
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52" data-testid="select-info-person">
              <SelectValue placeholder="Alle medewerkers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              {allSorted.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground ml-1" />
          <Select value={sortField} onValueChange={(v) => setSortField(v as InfoSortField)}>
            <SelectTrigger className="w-44" data-testid="select-info-sort">
              <SelectValue placeholder="Sorteren op…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="afdeling">Afdeling</SelectItem>
              <SelectItem value="naam">Naam</SelectItem>
              <SelectItem value="voornamen">Voornamen</SelectItem>
              <SelectItem value="kadasterId">Kadaster ID</SelectItem>
            </SelectContent>
          </Select>
          <PrintButton label="Afdrukken" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kadaster ID</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Afdeling</TableHead>
              <TableHead>Cedulanr.</TableHead>
              <TableHead>Telefoonnr.</TableHead>
              <TableHead>Mobielnr.</TableHead>
              <TableHead>Adres</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Geen medewerkers gevonden
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => (
                <TableRow key={u.id} data-testid={`row-medewerker-info-${u.id}`}>
                  <TableCell className="text-sm font-mono">{u.kadasterId || "—"}</TableCell>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-sm">{u.department || "—"}</TableCell>
                  <TableCell className="text-sm">{u.cedulaNr || "—"}</TableCell>
                  <TableCell className="text-sm">{u.telefoonnr || "—"}</TableCell>
                  <TableCell className="text-sm">{u.mobielnr || "—"}</TableCell>
                  <TableCell className="text-sm">{u.adres || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type SortField = "naam" | "geboortedatum";
type SortDir = "asc" | "desc";

function SortHeader({
  label, field, current, dir, onClick,
}: { label: string; field: SortField; current: SortField; dir: SortDir; onClick: (f: SortField) => void }) {
  const active = current === field;
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onClick(field)}
      data-testid={`sort-${field}`}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-xs text-muted-foreground">
          {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </span>
    </TableHead>
  );
}

function VerjaardagenTab({ users }: { users: UserExt[] }) {
  const [sortField, setSortField] = useState<SortField>("geboortedatum");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const withBirthday = users.filter(u => u.active && u.birthDate);
  const allSorted = [...users.filter(u => u.active)].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const filtered = selectedUserId === "all" ? withBirthday : withBirthday.filter(u => u.id === selectedUserId);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "naam") {
      cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
    } else {
      const [, am, ad] = a.birthDate!.split("-");
      const [, bm, bd] = b.birthDate!.split("-");
      cmp = am !== bm ? parseInt(am) - parseInt(bm) : parseInt(ad) - parseInt(bd);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Verjaardagen van actieve medewerkers — klik op kolomhoofd om te sorteren
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52" data-testid="select-verjaardagen-person">
              <SelectValue placeholder="Alle medewerkers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              {allSorted.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PrintButton label="Afdrukken" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kadaster ID</TableHead>
              <SortHeader label="Volledige naam" field="naam" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Geboortedatum" field="geboortedatum" current={sortField} dir={sortDir} onClick={handleSort} />
              <TableHead>Leeftijd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Geen geboortedatums ingevoerd
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => {
                const [, bm, bd] = u.birthDate!.split("-");
                const isToday = parseInt(bm) === todayMonth && parseInt(bd) === todayDay;
                const age = today.getFullYear() - parseInt(u.birthDate!.split("-")[0]);
                return (
                  <TableRow key={u.id} data-testid={`row-verjaardag-${u.id}`} className={isToday ? "bg-yellow-50 dark:bg-yellow-950/30" : ""}>
                    <TableCell className="text-sm font-mono">{u.kadasterId || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {u.fullName}
                      {isToday && <span className="ml-2 text-yellow-600">🎂</span>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDateDutch(u.birthDate)}</TableCell>
                    <TableCell className="text-sm">{age} jaar</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function JubileaTab({ users }: { users: UserExt[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const withStart = users.filter(u => u.active && u.startDate);
  const allSorted = [...users.filter(u => u.active)].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const filtered = selectedUserId === "all" ? withStart : withStart.filter(u => u.id === selectedUserId);

  const sorted = [...filtered].sort((a, b) => {
    const yA = yearsOfService(a.startDate) ?? 0;
    const yB = yearsOfService(b.startDate) ?? 0;
    return yB - yA;
  });

  const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Dienstjaren van actieve medewerkers — gesorteerd op hoogste aantal jaren
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52" data-testid="select-jubilea-person">
              <SelectValue placeholder="Alle medewerkers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              {allSorted.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PrintButton label="Afdrukken" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Afdeling</TableHead>
              <TableHead>Datum in Dienst</TableHead>
              <TableHead>Dienstjaren</TableHead>
              <TableHead className="print:hidden">Jubileum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Geen startdatums ingevoerd
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => {
                const years = yearsOfService(u.startDate) ?? 0;
                const nextMilestone = milestones.find(m => m > years);
                const isMilestone = milestones.includes(years);
                return (
                  <TableRow key={u.id} data-testid={`row-jubileum-${u.id}`} className={isMilestone ? "bg-amber-50 dark:bg-amber-950/30" : ""}>
                    <TableCell className="font-medium">
                      {u.fullName}
                      {isMilestone && <span className="ml-2 text-amber-600">🏆</span>}
                    </TableCell>
                    <TableCell className="text-sm">{u.department || "—"}</TableCell>
                    <TableCell className="text-sm">{formatDateDutch(u.startDate)}</TableCell>
                    <TableCell className="text-sm font-semibold">{years} jaar</TableCell>
                    <TableCell className="print:hidden text-sm text-muted-foreground">
                      {isMilestone
                        ? <Badge className="bg-amber-100 text-amber-800 border-amber-300">{years}-jarig jubileum!</Badge>
                        : nextMilestone
                        ? `${nextMilestone - years} jaar tot ${nextMilestone} jaar`
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type StatusSortField = "naam" | "afdeling" | "startDate" | "endDate" | "birthDate";

function sortUsers(list: UserExt[], field: StatusSortField): UserExt[] {
  return [...list].sort((a, b) => {
    switch (field) {
      case "naam":
        return (a.fullName || "").localeCompare(b.fullName || "", "nl");
      case "afdeling": {
        const deptCmp = (a.department || "").localeCompare(b.department || "", "nl");
        return deptCmp !== 0 ? deptCmp : (a.fullName || "").localeCompare(b.fullName || "", "nl");
      }
      case "startDate":
        return (a.startDate || "").localeCompare(b.startDate || "");
      case "endDate":
        return (a.endDate || "9999").localeCompare(b.endDate || "9999");
      case "birthDate":
        return (a.birthDate || "").localeCompare(b.birthDate || "");
      default:
        return 0;
    }
  });
}

function StatusRapport({
  title,
  users,
  sortField,
  filterKey,
  selectedUserId,
}: {
  title: string;
  users: UserExt[];
  sortField: StatusSortField;
  filterKey: "actief" | "inactief";
  selectedUserId: string;
}) {
  const filtered = users.filter(u => {
    const matchStatus = filterKey === "actief" ? u.active : !u.active;
    const matchPerson = selectedUserId === "all" || u.id === selectedUserId;
    return matchStatus && matchPerson;
  });
  const sorted = sortUsers(filtered, sortField);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Badge variant={filterKey === "actief" ? "default" : "secondary"} className="text-xs px-2 py-0.5">
            {filterKey === "actief" ? "Actief" : "Niet actief"}
          </Badge>
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">({sorted.length} medewerker{sorted.length !== 1 ? "s" : ""})</span>
        </div>
        <PrintButton label="Afdrukken" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Afdeling</TableHead>
              <TableHead>Functie</TableHead>
              <TableHead>Datum in Dienst</TableHead>
              {filterKey === "inactief" && <TableHead>Datum uit Dienst</TableHead>}
              <TableHead>Geboortedatum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filterKey === "inactief" ? 6 : 5} className="text-center text-muted-foreground py-8">
                  Geen medewerkers gevonden
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => (
                <TableRow key={u.id} data-testid={`row-status-${filterKey}-${u.id}`}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-sm">{u.department || "—"}</TableCell>
                  <TableCell className="text-sm">{u.functie || "—"}</TableCell>
                  <TableCell className="text-sm">{formatDateDutch(u.startDate)}</TableCell>
                  {filterKey === "inactief" && (
                    <TableCell className="text-sm">{u.endDate ? formatDateDutch(u.endDate) : "—"}</TableCell>
                  )}
                  <TableCell className="text-sm">{u.birthDate ? formatDateDutch(u.birthDate) : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MedewerkerStatusTab({ users }: { users: UserExt[] }) {
  const [sortField, setSortField] = useState<StatusSortField>("naam");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const allSorted = [...users].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Twee afzonderlijke rapporten: actief en niet-actief personeel. Kies de sorteervolgorde of selecteer een persoon.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52" data-testid="select-status-person">
              <SelectValue placeholder="Alle medewerkers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              {allSorted.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground ml-1" />
          <Select value={sortField} onValueChange={(v) => setSortField(v as StatusSortField)}>
            <SelectTrigger className="w-48" data-testid="select-status-sort">
              <SelectValue placeholder="Sorteren op…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="afdeling">Afdeling</SelectItem>
              <SelectItem value="naam">Persoon</SelectItem>
              <SelectItem value="startDate">Datum in dienst</SelectItem>
              <SelectItem value="endDate">Datum uit dienst</SelectItem>
              <SelectItem value="birthDate">Geboortedatum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <StatusRapport
        title="Actief personeel"
        users={users}
        sortField={sortField}
        filterKey="actief"
        selectedUserId={selectedUserId}
      />

      <div className="border-t pt-6">
        <StatusRapport
          title="Niet-actief personeel"
          users={users}
          sortField={sortField}
          filterKey="inactief"
          selectedUserId={selectedUserId}
        />
      </div>
    </div>
  );
}

export default function RapportenPage() {
  const { data: users, isLoading } = useQuery<UserExt[]>({ queryKey: ["/api/users"] });
  const { data: rapportenPhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings", "rapporten_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/rapporten_photo", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    const origTitle = document.title;
    const onBefore = () => { document.title = ""; };
    const onAfter  = () => { document.title = origTitle; };
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint",  onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint",  onAfter);
    };
  }, []);

  return (
    <div className="overflow-auto h-full">
      <div className="print:hidden">
        <PageHero
          title="Rapporten"
          subtitle="Overzichten en afdrukbare rapporten van medewerkergegevens"
          imageSrc={rapportenPhoto?.value || "/uploads/App_pics/rapporten.png"}
          imageAlt="rapporten"
        />
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="medewerker-info">
            <TabsList className="mb-6 print:hidden">
              <TabsTrigger value="medewerker-info" data-testid="tab-medewerker-info">
                <Users className="h-4 w-4 mr-2" />
                Medewerker info
              </TabsTrigger>
              <TabsTrigger value="verjaardagen" data-testid="tab-verjaardagen">
                <Cake className="h-4 w-4 mr-2" />
                Verjaardagen
              </TabsTrigger>
              <TabsTrigger value="jubilea" data-testid="tab-jubilea">
                <Award className="h-4 w-4 mr-2" />
                Jubilea
              </TabsTrigger>
              <TabsTrigger value="medewerker-status" data-testid="tab-medewerker-status">
                <ActivitySquare className="h-4 w-4 mr-2" />
                Medewerker status
              </TabsTrigger>
            </TabsList>
            <TabsContent value="medewerker-info">
              <MedewerkerInfoTab users={users || []} />
            </TabsContent>
            <TabsContent value="verjaardagen">
              <VerjaardagenTab users={users || []} />
            </TabsContent>
            <TabsContent value="jubilea">
              <JubileaTab users={users || []} />
            </TabsContent>
            <TabsContent value="medewerker-status">
              <MedewerkerStatusTab users={users || []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
