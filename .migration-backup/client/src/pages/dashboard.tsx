import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Camera,
  UserX,
  Building2,
  CalendarX,
  Timer,
  LogOut,
  Activity,
  Hourglass,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Announcement, Absence } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateShort } from "@/lib/dateUtils";
import { useAankondigingenNotifications } from "@/pages/aankondigingen";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  color: string;
  iconBg: string;
}) {
  return (
    <Card className="overflow-hidden border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const { newAnnouncementsCount, unreadMessagesCount, newMessagesCount } = useAankondigingenNotifications();
  const totalNieuweItems = newAnnouncementsCount + Math.max(unreadMessagesCount, newMessagesCount ?? 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: dashboardPhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings", "dashboard_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/dashboard_photo", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/site-settings/dashboard-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings", "dashboard_photo"] });
      toast({ title: "Foto bijgewerkt", description: "De dashboardfoto is succesvol gewijzigd." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Het uploaden van de foto is mislukt.", variant: "destructive" });
    },
  });

  const uploadLoginPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/site-settings/login-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings/public", "login_photo"] });
      toast({ title: "Foto bijgewerkt", description: "De inlogpagina foto is succesvol gewijzigd." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Het uploaden van de foto is mislukt.", variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleLoginPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLoginPhotoMutation.mutate(file);
    }
  };

  const { data: stats, isLoading } = useQuery<{
    totalEmployees: number;
    temporaryEmployees: number;
    activeAbsences: number;
    upcomingEvents: number;
    totalRewardPoints: number;
    pendingAbsences: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: vacationBalance } = useQuery<{
    userId: string;
    userName: string;
    totalDays: number;
    geplandDays: number;
    toegekendDays: number;
    opgenomenDays: number;
    sickDays: number;
    remainingDays: number;
  }[]>({
    queryKey: ["/api/vacation-balance"],
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: absences } = useQuery<(Absence & { userName?: string })[]>({
    queryKey: [isAdmin ? "/api/absences" : "/api/absences/mine"],
  });

  const isManagerOrAdmin = isAdmin || user?.role === "manager";

  const { data: performanceData, isLoading: perfLoading } = useQuery<{
    months: {
      month: string;
      label: string;
      werkdagen: number;
      verzuim: number;
      teLaat: number;
      teVroegUit: number;
      saldoMinuten: number;
    }[];
  }>({
    queryKey: ["/api/werktijden/my-performance"],
    enabled: !isManagerOrAdmin,
  });

  const { data: todayAbsences, isLoading: todayLoading } = useQuery<{
    date: string;
    totalAbsent: number;
    departments: {
      managerName: string;
      managerRole: string;
      department: string;
      employees: { name: string; type: string; status: string; halfDay: string | null }[];
    }[];
  }>({
    queryKey: ["/api/absences/today"],
    enabled: isManagerOrAdmin,
  });

  const recentAnnouncements = announcements?.slice(0, 4) || [];
  const pendingAbsences = absences?.filter((a) => a.status === "pending").slice(0, 5) || [];

  const myBalance = vacationBalance?.find(b => b.userId === user?.id);
  const now = new Date();
  const currentYear = now.getFullYear();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Goedemorgen";
    if (hour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const photoSrc = dashboardPhoto?.value || "/uploads/App_pics/dashboard.png";

  return (
    <div className="overflow-auto h-full">
      <div className="relative h-52 overflow-hidden">
        <img
          src={photoSrc}
          alt="Dashboard"
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-dashboard-photo"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(152,40%,18%/0.9)] via-[hsl(152,35%,22%/0.8)] to-[hsl(152,30%,25%/0.6)]" />
        <div className="relative z-10 h-full flex items-center px-8">
          <div className="space-y-2 flex-1 bg-black/30 backdrop-blur-sm rounded-lg px-5 py-3 w-fit">
            <p className="text-[hsl(48,96%,53%)] font-semibold text-sm tracking-wide uppercase drop-shadow-md">{greeting()}</p>
            <h1 className="text-3xl font-bold text-white drop-shadow-md" data-testid="text-dashboard-title">
              {user?.fullName}
            </h1>
            <p className="text-white/85 text-sm max-w-lg drop-shadow-sm">
              Welkom bij het Kadaster Dashboard. Hier vindt u een overzicht van uw kantooromgeving.
            </p>
          </div>
          {isAdmin && (
            <div className="shrink-0 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                data-testid="input-dashboard-photo"
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                data-testid="button-change-photo"
              >
                <Camera className="h-4 w-4" />
                {uploadPhotoMutation.isPending ? "Uploaden..." : "Dashboard foto"}
              </Button>
              <input
                ref={loginFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLoginPhotoChange}
                data-testid="input-login-photo"
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                onClick={() => loginFileInputRef.current?.click()}
                disabled={uploadLoginPhotoMutation.isPending}
                data-testid="button-change-login-photo"
              >
                <Camera className="h-4 w-4" />
                {uploadLoginPhotoMutation.isPending ? "Uploaden..." : "Inlogpagina foto"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <Card className="overflow-hidden border border-border/60">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-6 flex-1">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Medewerkers</p>
                      <p className="text-3xl font-bold tracking-tight" data-testid="stat-medewerkers">{stats?.totalEmployees || 0}</p>
                      <p className="text-xs text-muted-foreground">Actieve medewerkers</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Tijdelijk</p>
                      <p className="text-3xl font-bold tracking-tight" data-testid="stat-tijdelijke-medewerkers">{stats?.temporaryEmployees || 0}</p>
                      <p className="text-xs text-muted-foreground">Tijdelijke medewerkers</p>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Mijn afwezigheid</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border/60 p-2.5" data-testid="stat-my-sick">
                      <p className="text-xs text-muted-foreground">Ziekte {currentYear}</p>
                      <p className="text-lg font-bold mt-0.5">{myBalance?.sickDays ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-2.5" data-testid="stat-my-vacation">
                      <p className="text-xs text-muted-foreground">Vakantiesaldo</p>
                      <p className="text-lg font-bold mt-0.5">{myBalance?.remainingDays ?? 0} <span className="text-xs font-normal text-muted-foreground">/ {myBalance?.totalDays ?? 0}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Card className="border border-border/60">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDate(new Date().toISOString())}</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isManagerOrAdmin && (
          <Card className="border border-border/60" data-testid="card-today-absences">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                  <UserX className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-sm">Vandaag Afwezig</h3>
                {todayAbsences?.date && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(todayAbsences.date)}
                  </span>
                )}
              </div>
              <Badge variant={todayAbsences?.totalAbsent ? "destructive" : "secondary"} className="text-xs">
                {todayAbsences?.totalAbsent ?? 0} afwezig
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              {todayLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : !todayAbsences || todayAbsences.totalAbsent === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Alle medewerkers zijn vandaag aanwezig</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAbsences.departments.map((dept) => {
                    const typeLabels: Record<string, string> = {
                      sick: "Ziekte", vacation: "Vakantie", personal: "Persoonlijk", bvvd: "Bijzonder verlof", other: "Overig",
                    };
                    const typeColors: Record<string, string> = {
                      sick: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
                      vacation: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                      personal: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
                      bvvd: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                      other: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
                    };
                    const roleLabels: Record<string, string> = { admin: "Beheerder", manager: "Manager", directeur: "Directeur" };
                    return (
                      <div key={dept.department} className="rounded-lg border border-border/60 p-3" data-testid={`dept-absence-${dept.department}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{dept.department}</span>
                          <span className="text-xs text-muted-foreground">
                            — {dept.managerName}{dept.managerRole ? ` (${roleLabels[dept.managerRole] || dept.managerRole})` : ""}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dept.employees.map((emp, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-muted/40" data-testid={`absent-employee-${idx}`}>
                              <span className="text-sm">{emp.name}</span>
                              <div className="flex items-center gap-1.5">
                                {emp.halfDay && (
                                  <Badge variant="outline" className="text-xs">
                                    {emp.halfDay === "morning" ? "Ochtend" : "Middag"}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={`text-xs ${typeColors[emp.type] || ""}`}>
                                  {typeLabels[emp.type] || emp.type}
                                </Badge>
                                {emp.status === "pending" && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                    In afwachting
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAdmin ? (
            <Card className="border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Afwezigheden Personeel</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{(() => { const ya = (absences || []).filter(a => new Date(a.startDate).getFullYear() === currentYear); return ya.length; })()}</Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {(() => {
                  const yearAbsences = (absences || []).filter(a => new Date(a.startDate).getFullYear() === currentYear);
                  const byCat: Record<string, number> = {};
                  yearAbsences.forEach(a => { byCat[a.type] = (byCat[a.type] || 0) + 1; });
                  const catLabels: Record<string, string> = { sick: "Ziekte", vacation: "Vakantie", personal: "Persoonlijk", bvvd: "Bijzonder verlof", other: "Overig" };
                  const catOrder = ["sick", "vacation", "bvvd", "personal", "other"];
                  const cats = catOrder.filter(c => byCat[c]);
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2" data-testid="admin-absence-overview">
                        <div className="rounded-lg border border-border/60 p-3 col-span-2">
                          <p className="text-xs text-muted-foreground font-medium">Totaal meldingen personeel {currentYear}</p>
                          <p className="text-2xl font-bold mt-1">{yearAbsences.length}</p>
                        </div>
                        {cats.map(cat => (
                          <div key={cat} className="rounded-lg border border-border/60 p-2.5" data-testid={`stat-cat-${cat}`}>
                            <p className="text-xs text-muted-foreground font-medium">{catLabels[cat]}</p>
                            <p className="text-lg font-bold mt-0.5">{byCat[cat]}</p>
                          </div>
                        ))}
                      </div>
                      {cats.length === 0 && (
                        <div className="flex flex-col items-center py-4 text-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">Geen meldingen dit jaar</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Mijn Afwezigheden</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{absences?.length || 0}</Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 p-3" data-testid="stat-sick-count">
                    <p className="text-xs text-muted-foreground font-medium">Ziekte meldingen {currentYear}</p>
                    <p className="text-2xl font-bold mt-1">{myBalance?.sickDays ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3" data-testid="stat-vacation-balance">
                    <p className="text-xs text-muted-foreground font-medium">Saldo vakantiedagen {currentYear}</p>
                    <p className="text-2xl font-bold mt-1">{myBalance?.remainingDays ?? 0} <span className="text-sm font-normal text-muted-foreground">/ {myBalance?.totalDays ?? 0}</span></p>
                  </div>
                </div>
                {(absences || []).length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                      <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Geen afwezigheden</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(absences || []).slice(0, 5).map((absence) => {
                      const statusColors: Record<string, string> = {
                        pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                        approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                        rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
                      };
                      const statusLabels: Record<string, string> = {
                        pending: "In afwachting",
                        approved: "Goedgekeurd",
                        rejected: "Afgewezen",
                      };
                      const typeLabels: Record<string, string> = {
                        sick: "Ziekte", vacation: "Vakantie", personal: "Persoonlijk", bvvd: "Bijzonder verlof", other: "Overig",
                      };
                      return (
                        <div key={absence.id} className="flex items-center gap-3 p-2.5 rounded-lg hover-elevate" data-testid={`absence-item-${absence.id}`}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{typeLabels[absence.type] || absence.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateShort(absence.startDate)} t/m {formatDateShort(absence.endDate)}
                            </p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-xs ${statusColors[absence.status] || ""}`}>
                            {statusLabels[absence.status] || absence.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm">Recente Aankondigingen</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {totalNieuweItems > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center" data-testid="badge-dashboard-notifications">
                    {totalNieuweItems}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">{recentAnnouncements.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen aankondigingen</p>
              ) : (
                <div className="space-y-2">
                  {recentAnnouncements.map((ann) => (
                    <div key={ann.id} className="flex items-start gap-3 p-2.5 rounded-lg hover-elevate" data-testid={`announcement-item-${ann.id}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        ann.priority === "high"
                          ? "bg-red-100 dark:bg-red-900/20"
                          : ann.priority === "medium"
                          ? "bg-amber-100 dark:bg-amber-900/20"
                          : "bg-muted"
                      }`}>
                        {ann.priority === "high" ? (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{ann.title}</p>
                          {ann.pinned && <Badge variant="secondary" className="text-xs">Vastgezet</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ann.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!isManagerOrAdmin && (
          <Card className="border border-border/60" data-testid="card-werktijden-performance">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm">Mijn Werktijden Prestaties</h3>
              </div>
              <span className="text-xs text-muted-foreground">Laatste 6 maanden</span>
            </CardHeader>
            <CardContent className="pt-0">
              {perfLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : !performanceData?.months?.length ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Geen prikklokgegevens beschikbaar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1.5 px-1 pb-1">
                    <span className="text-xs font-medium text-muted-foreground">Maand</span>
                    <div className="flex items-center gap-1 justify-center">
                      <CalendarX className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center">Niet geklokt</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <Timer className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center">Te laat</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <LogOut className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center">Te vroeg weg</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <Hourglass className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center">Uren</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <Hourglass className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center">Min</span>
                    </div>
                  </div>
                  {performanceData.months.map((m) => {
                    const badge = (n: number, testId: string) => {
                      const color = n === 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        : n <= 2
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
                      return (
                        <div className="flex justify-center" data-testid={testId}>
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md border text-sm font-semibold ${color}`}>
                            {n}
                          </span>
                        </div>
                      );
                    };
                    const saldoColor = m.saldoMinuten >= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
                    const isCurrentMonth = m.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                    return (
                      <div
                        key={m.month}
                        className={`grid grid-cols-6 gap-1.5 items-center rounded-lg px-2 py-2 ${isCurrentMonth ? "bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/40" : "bg-muted/30"}`}
                        data-testid={`perf-month-${m.month}`}
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">{m.label.replace(/\s\d{4}$/, "")}</p>
                          <p className="text-xs text-muted-foreground">{m.werkdagen} werkdagen</p>
                        </div>
                        {badge(m.verzuim, `perf-verzuim-${m.month}`)}
                        {badge(m.teLaat, `perf-telaat-${m.month}`)}
                        {badge(m.teVroegUit, `perf-tevroeg-${m.month}`)}
                        <div className="flex justify-center" data-testid={`perf-saldo-uren-${m.month}`}>
                          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md border text-sm font-semibold ${saldoColor}`}>
                            {(m.saldoMinuten >= 0 ? "+" : "−")}{Math.floor(Math.abs(m.saldoMinuten) / 60)}u
                          </span>
                        </div>
                        <div className="flex justify-center" data-testid={`perf-saldo-min-${m.month}`}>
                          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md border text-sm font-semibold ${saldoColor}`}>
                            {String(Math.abs(m.saldoMinuten) % 60).padStart(2, "0")}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1 px-1">
                    Groen = goed &nbsp;·&nbsp; Oranje = aandacht nodig &nbsp;·&nbsp; Rood = actie vereist
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Verzoek in Afwachting</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{pendingAbsences.length}</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                {pendingAbsences.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                      <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Geen openstaande verzoeken</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingAbsences.map((absence) => {
                      const typeLabels: Record<string, string> = {
                        sick: "Ziekte", vacation: "Vakantie", personal: "Persoonlijk", bvvd: "Bijzonder verlof", other: "Overig",
                      };
                      return (
                        <div key={absence.id} className="flex items-center gap-3 p-2.5 rounded-lg hover-elevate" data-testid={`pending-absence-${absence.id}`}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{(absence as any).userName || "Medewerker"}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeLabels[absence.type] || absence.type} - {formatDateShort(absence.startDate)} t/m {formatDateShort(absence.endDate)}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                            In afwachting
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
