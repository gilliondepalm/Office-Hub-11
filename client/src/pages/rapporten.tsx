import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Users, Cake, Award, UserSearch, Clock } from "lucide-react";
import { FamilyIcon } from "@/components/family-icon";
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
import type { User, FamilyMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type UserExt = User & {
  kadasterId?: number | null;
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
  tijdelijk: "Tijdelijk",
};

function formatDateDutch(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
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

function SortHeader<T extends string>({
  label, field, current, dir, onClick, className,
}: {
  label: string;
  field: T;
  current: T;
  dir: "asc" | "desc";
  onClick: (f: T) => void;
  className?: string;
}) {
  const active = current === field;
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors${className ? ` ${className}` : ""}`}
      onClick={() => onClick(field)}
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

function useSortState<T extends string>(defaultField: T, defaultDir: "asc" | "desc" = "asc") {
  const [field, setField] = useState<T>(defaultField);
  const [dir, setDir] = useState<"asc" | "desc">(defaultDir);
  const handleSort = (f: T) => {
    if (field === f) setDir(d => d === "asc" ? "desc" : "asc");
    else { setField(f); setDir("asc"); }
  };
  return { field, dir, handleSort };
}

type VerjaardagenSortField = "kadasterId" | "naam" | "geboortedatum" | "leeftijd";

function VerjaardagenTab({ users }: { users: UserExt[] }) {
  const { field: sortField, dir: sortDir, handleSort } = useSortState<VerjaardagenSortField>("geboortedatum");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "vast" | "tijdelijk">("all");

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const typeFiltered = users.filter(u => {
    if (typeFilter === "vast") return u.role !== "tijdelijk";
    if (typeFilter === "tijdelijk") return u.role === "tijdelijk";
    return true;
  });

  const withBirthday = typeFiltered.filter(u => u.active && u.birthDate);
  const allSorted = [...typeFiltered.filter(u => u.active)].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const filtered = selectedUserId === "" ? withBirthday : withBirthday.filter(u => u.id === selectedUserId);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "kadasterId":
        cmp = ((a as any).kadasterId ?? 0) - ((b as any).kadasterId ?? 0);
        break;
      case "naam":
        cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "geboortedatum": {
        const [, am, ad] = a.birthDate!.split("-");
        const [, bm, bd] = b.birthDate!.split("-");
        cmp = am !== bm ? parseInt(am) - parseInt(bm) : parseInt(ad) - parseInt(bd);
        break;
      }
      case "leeftijd": {
        const ageA = today.getFullYear() - parseInt(a.birthDate!.split("-")[0]);
        const ageB = today.getFullYear() - parseInt(b.birthDate!.split("-")[0]);
        cmp = ageA - ageB;
        break;
      }
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-4">
      <div className="hidden print:block mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Kadaster Dashboard — Verjaardagen</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Verjaardagen van actieve medewerkers &middot; klik kolomkop om te sorteren
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setSelectedUserId(""); }}>
            <SelectTrigger className="w-48" data-testid="select-verjaardagen-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              <SelectItem value="vast">Vaste medewerkers</SelectItem>
              <SelectItem value="tijdelijk">Tijdelijke medewerkers</SelectItem>
            </SelectContent>
          </Select>
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48" data-testid="select-verjaardagen-person">
              <SelectValue placeholder="Kies een medewerker" />
            </SelectTrigger>
            <SelectContent>
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
              <SortHeader label="Kadaster ID" field="kadasterId" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Volledige naam" field="naam" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Geboortedatum" field="geboortedatum" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Leeftijd" field="leeftijd" current={sortField} dir={sortDir} onClick={handleSort} />
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
                    <TableCell className="text-sm font-mono">{(u as any).kadasterId ?? "—"}</TableCell>
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

type JubileumSortField = "naam" | "afdeling" | "startDate" | "dienstjaren";

function JubileaTab({ users }: { users: UserExt[] }) {
  const { field: sortField, dir: sortDir, handleSort } = useSortState<JubileumSortField>("dienstjaren", "desc");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "vast" | "tijdelijk">("all");

  const typeFiltered = users.filter(u => {
    if (typeFilter === "vast") return u.role !== "tijdelijk";
    if (typeFilter === "tijdelijk") return u.role === "tijdelijk";
    return true;
  });

  const withStart = typeFiltered.filter(u => u.active && u.startDate);
  const allSorted = [...typeFiltered.filter(u => u.active)].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const filtered = selectedUserId === "" ? withStart : withStart.filter(u => u.id === selectedUserId);

  const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "naam":
        cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "afdeling":
        cmp = (a.department || "").localeCompare(b.department || "", "nl");
        if (cmp === 0) cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "startDate":
        cmp = (a.startDate || "").localeCompare(b.startDate || "");
        break;
      case "dienstjaren":
        cmp = (yearsOfService(a.startDate) ?? 0) - (yearsOfService(b.startDate) ?? 0);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-4">
      <div className="hidden print:block mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Kadaster Dashboard — Jubilea</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Dienstjaren van actieve medewerkers &middot; klik kolomkop om te sorteren
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setSelectedUserId(""); }}>
            <SelectTrigger className="w-48" data-testid="select-jubilea-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              <SelectItem value="vast">Vaste medewerkers</SelectItem>
              <SelectItem value="tijdelijk">Tijdelijke medewerkers</SelectItem>
            </SelectContent>
          </Select>
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48" data-testid="select-jubilea-person">
              <SelectValue placeholder="Kies een medewerker" />
            </SelectTrigger>
            <SelectContent>
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
              <SortHeader label="Naam" field="naam" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Afdeling" field="afdeling" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Datum in Dienst" field="startDate" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Dienstjaren" field="dienstjaren" current={sortField} dir={sortDir} onClick={handleSort} />
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

type StatusSortField = "kadasterId" | "naam" | "afdeling" | "functie" | "startDate" | "endDate" | "birthDate" | "cedulaNr" | "telefoonnr" | "mobielnr" | "adres";

function StatusRapport({
  title,
  users,
  filterKey,
  selectedUserId,
}: {
  title: string;
  users: UserExt[];
  filterKey: "actief" | "inactief";
  selectedUserId: string;
}) {
  const { field: sortField, dir: sortDir, handleSort } = useSortState<StatusSortField>("naam");

  const filtered = users.filter(u => {
    const matchStatus = filterKey === "actief" ? u.active : !u.active;
    const matchPerson = selectedUserId === "all" || u.id === selectedUserId;
    return matchStatus && matchPerson;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "kadasterId":
        cmp = ((a as any).kadasterId ?? 0) - ((b as any).kadasterId ?? 0);
        break;
      case "naam":
        cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "afdeling":
        cmp = (a.department || "").localeCompare(b.department || "", "nl");
        if (cmp === 0) cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "functie":
        cmp = (a.functie || "").localeCompare(b.functie || "", "nl");
        break;
      case "startDate":
        cmp = (a.startDate || "").localeCompare(b.startDate || "");
        break;
      case "endDate":
        cmp = (a.endDate || "9999").localeCompare(b.endDate || "9999");
        break;
      case "birthDate":
        cmp = (a.birthDate || "").localeCompare(b.birthDate || "");
        break;
      case "cedulaNr":
        cmp = ((a as any).cedulaNr || "").localeCompare((b as any).cedulaNr || "", "nl");
        break;
      case "telefoonnr":
        cmp = ((a as any).telefoonnr || "").localeCompare((b as any).telefoonnr || "");
        break;
      case "mobielnr":
        cmp = ((a as any).mobielnr || "").localeCompare((b as any).mobielnr || "");
        break;
      case "adres":
        cmp = ((a as any).adres || "").localeCompare((b as any).adres || "", "nl");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const colCount = filterKey === "inactief" ? 11 : 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={filterKey === "actief" ? "default" : "secondary"} className="text-xs px-2 py-0.5">
          {filterKey === "actief" ? "Actief" : "Niet actief"}
        </Badge>
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">({sorted.length} medewerker{sorted.length !== 1 ? "s" : ""})</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Kadaster ID" field="kadasterId" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Naam" field="naam" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Afdeling" field="afdeling" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Functie" field="functie" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Datum in Dienst" field="startDate" current={sortField} dir={sortDir} onClick={handleSort} />
              {filterKey === "inactief" && (
                <SortHeader label="Datum uit Dienst" field="endDate" current={sortField} dir={sortDir} onClick={handleSort} />
              )}
              <SortHeader label="Geboortedatum" field="birthDate" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Cedulanr." field="cedulaNr" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Telefoonnr." field="telefoonnr" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Mobielnr." field="mobielnr" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Adres" field="adres" current={sortField} dir={sortDir} onClick={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">
                  Geen medewerkers gevonden
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => (
                <TableRow key={u.id} data-testid={`row-status-${filterKey}-${u.id}`} className="print:text-xs">
                  <TableCell className="text-sm font-mono print:py-1">{(u as any).kadasterId ?? "—"}</TableCell>
                  <TableCell className="font-medium print:py-1">{u.fullName}</TableCell>
                  <TableCell className="text-sm print:py-1">{u.department || "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{u.functie || "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{formatDateDutch(u.startDate)}</TableCell>
                  {filterKey === "inactief" && (
                    <TableCell className="text-sm print:py-1">{u.endDate ? formatDateDutch(u.endDate) : "—"}</TableCell>
                  )}
                  <TableCell className="text-sm print:py-1">{u.birthDate ? formatDateDutch(u.birthDate) : "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{(u as any).cedulaNr || "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{(u as any).telefoonnr || "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{(u as any).mobielnr || "—"}</TableCell>
                  <TableCell className="text-sm print:py-1">{(u as any).adres || "—"}</TableCell>
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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "vast" | "tijdelijk">("all");

  const typeFiltered = users.filter(u => {
    if (typeFilter === "vast") return u.role !== "tijdelijk";
    if (typeFilter === "tijdelijk") return u.role === "tijdelijk";
    return true;
  });

  const allSorted = [...typeFiltered].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  return (
    <div className="space-y-6">
      <div className="hidden print:block mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Kadaster Dashboard — Medewerker Informatie</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Actief en niet-actief personeel met volledige gegevens &middot; klik kolomkop om te sorteren
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setSelectedUserId(""); }}>
            <SelectTrigger className="w-48" data-testid="select-status-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medewerkers</SelectItem>
              <SelectItem value="vast">Vaste medewerkers</SelectItem>
              <SelectItem value="tijdelijk">Tijdelijke medewerkers</SelectItem>
            </SelectContent>
          </Select>
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48" data-testid="select-status-person">
              <SelectValue placeholder="Kies een medewerker" />
            </SelectTrigger>
            <SelectContent>
              {allSorted.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StatusRapport
        title="Actief personeel"
        users={typeFiltered}
        filterKey="actief"
        selectedUserId={selectedUserId}
      />

      <div className="border-t pt-6">
        <StatusRapport
          title="Niet-actief personeel"
          users={typeFiltered}
          filterKey="inactief"
          selectedUserId={selectedUserId}
        />
      </div>
    </div>
  );
}

type GezinSortField = "naam" | "afdeling";

function GezinTab({ users }: { users: UserExt[] }) {
  const { field: sortField, dir: sortDir, handleSort } = useSortState<GezinSortField>("naam");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const { data: allFamilyMembers, isLoading } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
    queryFn: () => apiRequest("GET", "/api/family-members").then(r => r.json()),
  });

  const activeNonTemp = users.filter(u => u.active && u.role !== "tijdelijk");
  const allSorted = [...activeNonTemp].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "", "nl")
  );

  const familyByUser: Record<string, FamilyMember[]> = {};
  (allFamilyMembers || []).forEach(m => {
    if (!familyByUser[m.userId]) familyByUser[m.userId] = [];
    familyByUser[m.userId].push(m);
  });

  const baseList = selectedUserId === "all" ? allSorted : allSorted.filter(u => u.id === selectedUserId);

  const sortedList = [...baseList].sort((a, b) => {
    let cmp = 0;
    if (sortField === "naam") cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
    else if (sortField === "afdeling") {
      cmp = (a.department || "").localeCompare(b.department || "", "nl");
      if (cmp === 0) cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const withFamily = sortedList.filter(u => (familyByUser[u.id] || []).length > 0);
  const withoutFamily = sortedList.filter(u => (familyByUser[u.id] || []).length === 0);

  return (
    <div className="space-y-4">
      <style>{`@media print { @page { size: A4 landscape; margin: 1cm; } }`}</style>
      <div className="hidden print:block mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Kadaster Dashboard — Gezinsrapport</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Gezinsgegevens van vaste medewerkers — partner en kinderen
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <UserSearch className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52" data-testid="select-gezin-person">
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

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : withFamily.length === 0 && selectedUserId !== "all" ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
          Geen gezinsgegevens geregistreerd voor deze medewerker.
        </div>
      ) : withFamily.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
          Er zijn nog geen gezinsgegevens ingevoerd.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <SortHeader label="Medewerker" field="naam" current={sortField} dir={sortDir} onClick={handleSort} className="w-44" />
                <SortHeader label="Afdeling" field="afdeling" current={sortField} dir={sortDir} onClick={handleSort} className="w-32" />
                <TableHead className="w-24">Relatie</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Geboortedatum</TableHead>
                <TableHead>Cedula nr.</TableHead>
                <TableHead>Nationaliteit</TableHead>
                <TableHead>Adres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withFamily.map(u => {
                const members = familyByUser[u.id] || [];
                const partner = members.filter(m => m.type === "partner");
                const kinderen = members.filter(m => m.type === "kind");
                const allMembers = [...partner, ...kinderen];
                return allMembers.map((m, idx) => (
                  <TableRow
                    key={m.id}
                    data-testid={`row-gezin-${m.id}`}
                    className={`print:text-xs${idx === 0 ? " border-t-2 border-t-muted" : ""}`}
                  >
                    <TableCell className="font-medium align-top text-sm print:py-1">
                      {idx === 0 ? u.fullName : ""}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground print:py-1">
                      {idx === 0 ? (u.department || "—") : ""}
                    </TableCell>
                    <TableCell className="align-top print:py-1">
                      <Badge
                        variant={m.type === "partner" ? "default" : "secondary"}
                        className="text-xs print:border print:bg-transparent print:text-black print:border-gray-400"
                      >
                        {m.type === "partner" ? "Partner" : "Kind"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium print:py-1">{m.naam}</TableCell>
                    <TableCell className="text-sm print:py-1">{m.geboortedatum ? formatDateDutch(m.geboortedatum) : "—"}</TableCell>
                    <TableCell className="text-sm font-mono print:py-1">{m.cedulaNr || "—"}</TableCell>
                    <TableCell className="text-sm print:py-1">{m.nationaliteit || "—"}</TableCell>
                    <TableCell className="text-sm print:py-1">{m.adres || "—"}</TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedUserId === "all" && withoutFamily.length > 0 && (
        <details className="print:hidden">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
            {withoutFamily.length} medewerker{withoutFamily.length !== 1 ? "s" : ""} zonder geregistreerde gezinsgegevens
          </summary>
          <div className="mt-2 text-sm text-muted-foreground pl-4 space-y-1">
            {withoutFamily.map(u => (
              <div key={u.id}>{u.fullName} — {u.department || "Geen afdeling"}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

type TijdelijkSortField = "kadasterId" | "naam" | "afdeling" | "functie" | "startDate" | "endDate" | "status";

function TijdelijkeTab({ users }: { users: UserExt[] }) {
  const { field: sortField, dir: sortDir, handleSort } = useSortState<TijdelijkSortField>("naam");
  const [statusFilter, setStatusFilter] = useState<"all" | "actief" | "inactief">("all");

  const tijdelijk = users.filter(u => u.role === "tijdelijk");

  const filtered = tijdelijk.filter(u => {
    if (statusFilter === "actief") return u.active;
    if (statusFilter === "inactief") return !u.active;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "kadasterId":
        cmp = ((a as any).kadasterId ?? 0) - ((b as any).kadasterId ?? 0);
        break;
      case "naam":
        cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "afdeling":
        cmp = (a.department || "").localeCompare(b.department || "", "nl");
        if (cmp === 0) cmp = (a.fullName || "").localeCompare(b.fullName || "", "nl");
        break;
      case "functie":
        cmp = (a.functie || "").localeCompare(b.functie || "", "nl");
        break;
      case "startDate":
        cmp = (a.startDate || "").localeCompare(b.startDate || "");
        break;
      case "endDate":
        cmp = (a.endDate || "9999").localeCompare(b.endDate || "9999");
        break;
      case "status":
        cmp = (a.active === b.active) ? 0 : a.active ? -1 : 1;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const activeCount = tijdelijk.filter(u => u.active).length;
  const inactiveCount = tijdelijk.filter(u => !u.active).length;

  return (
    <div className="space-y-4">
      <style>{`@media print { @page { size: A4 landscape; margin: 1cm; } }`}</style>
      <div className="hidden print:block mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">Kadaster Dashboard — Tijdelijke Medewerkers</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Overzicht tijdelijke medewerkers
          </p>
          <Badge variant="default" className="text-xs">{activeCount} actief</Badge>
          <Badge variant="secondary" className="text-xs">{inactiveCount} niet actief</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44" data-testid="select-tijdelijk-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle tijdelijk</SelectItem>
              <SelectItem value="actief">Alleen actief</SelectItem>
              <SelectItem value="inactief">Alleen niet actief</SelectItem>
            </SelectContent>
          </Select>
          <PrintButton label="Afdrukken" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Kadaster ID" field="kadasterId" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Naam" field="naam" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Afdeling" field="afdeling" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Functie" field="functie" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="In dienst" field="startDate" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Uit dienst" field="endDate" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortHeader label="Status" field="status" current={sortField} dir={sortDir} onClick={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {tijdelijk.length === 0
                    ? "Geen tijdelijke medewerkers geregistreerd"
                    : "Geen tijdelijke medewerkers gevonden voor dit filter"}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(u => (
                <TableRow
                  key={u.id}
                  data-testid={`row-tijdelijk-${u.id}`}
                  className={!u.active ? "opacity-60" : ""}
                >
                  <TableCell className="text-sm font-mono">{(u as any).kadasterId ?? "—"}</TableCell>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-sm">{u.department || "—"}</TableCell>
                  <TableCell className="text-sm">{u.functie || "—"}</TableCell>
                  <TableCell className="text-sm">{formatDateDutch(u.startDate)}</TableCell>
                  <TableCell className="text-sm">{u.endDate ? formatDateDutch(u.endDate) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "default" : "secondary"} className="text-xs">
                      {u.active ? "Actief" : "Niet actief"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
          imageSrc={rapportenPhoto?.value || "/uploads/App_pics/rapporten.jpg"}
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
          <Tabs defaultValue="medewerker-status">
            <TabsList className="mb-6 print:hidden flex-wrap h-auto gap-1">
              <TabsTrigger value="medewerker-status" data-testid="tab-medewerker-info">
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
              <TabsTrigger value="tijdelijk" data-testid="tab-tijdelijk">
                <Clock className="h-4 w-4 mr-2" />
                Tijdelijk
              </TabsTrigger>
              <TabsTrigger value="gezin" data-testid="tab-gezin">
                <FamilyIcon className="h-4 w-4 mr-2" />
                Gezin
              </TabsTrigger>
            </TabsList>
            <TabsContent value="medewerker-status">
              <MedewerkerStatusTab users={users || []} />
            </TabsContent>
            <TabsContent value="verjaardagen">
              <VerjaardagenTab users={users || []} />
            </TabsContent>
            <TabsContent value="jubilea">
              <JubileaTab users={users || []} />
            </TabsContent>
            <TabsContent value="tijdelijk">
              <TijdelijkeTab users={users || []} />
            </TabsContent>
            <TabsContent value="gezin">
              <GezinTab users={users || []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
