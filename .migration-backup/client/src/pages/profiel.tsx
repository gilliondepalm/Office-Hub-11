import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon, Mail, Building2, Shield, Clock, Award, CalendarDays, Cake, Briefcase, TrendingUp, GraduationCap, CheckCircle2, Circle, KeyRound } from "lucide-react";
import { nl } from "date-fns/locale";
import type { Absence, Reward, PositionHistory, PersonalDevelopment } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function ProfielPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [huidigWw, setHuidigWw] = useState("");
  const [nieuwWw, setNieuwWw] = useState("");
  const [bevestigWw, setBevestigWw] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (nieuwWw !== bevestigWw) throw new Error("Nieuwe wachtwoorden komen niet overeen");
      if (nieuwWw.length < 8) throw new Error("Nieuw wachtwoord moet minimaal 8 tekens bevatten");
      const res = await apiRequest("POST", "/api/auth/change-password", { currentPassword: huidigWw, newPassword: nieuwWw });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Fout bij wijzigen wachtwoord");
      }
    },
    onSuccess: () => {
      toast({ title: "Wachtwoord gewijzigd", description: "Uw wachtwoord is succesvol bijgewerkt." });
      setHuidigWw(""); setNieuwWw(""); setBevestigWw("");
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });

  const { data: myAbsences, isLoading: loadingAbsences } = useQuery<(Absence & { userName?: string })[]>({
    queryKey: ["/api/absences/mine"],
  });

  const { data: myRewards, isLoading: loadingRewards } = useQuery<(Reward & { userName?: string })[]>({
    queryKey: ["/api/rewards/mine"],
  });

  const { data: myPositionHistory, isLoading: loadingHistory } = useQuery<PositionHistory[]>({
    queryKey: ["/api/position-history/mine"],
  });

  const { data: myDevelopment, isLoading: loadingDev } = useQuery<PersonalDevelopment[]>({
    queryKey: ["/api/personal-development/mine"],
  });

  if (!user) return null;

  const initials = user.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const roleLabels: Record<string, string> = {
    admin: "Beheerder",
    manager: "Manager",
    employee: "Medewerker",
  };

  const statusLabels: Record<string, string> = {
    pending: "In afwachting",
    approved: "Goedgekeurd",
    rejected: "Afgewezen",
  };

  const typeLabels: Record<string, string> = {
    sick: "Ziekte",
    vacation: "Vakantie",
    personal: "Persoonlijk",
    other: "Overig",
  };

  const totalPoints = myRewards?.reduce((sum, r) => sum + r.points, 0) || 0;

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Mijn Profiel"
        subtitle="Uw persoonlijke gegevens en overzicht"
        imageSrc="/uploads/App_pics/profiel.png"
        imageAlt="profiel"
      />
      <div className="p-6 space-y-6">

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-16 w-16">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName || ""} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h2 className="text-xl font-bold" data-testid="text-profile-name">{user.fullName}</h2>
                <Badge variant="secondary" className="mt-1">{roleLabels[user.role] || user.role}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-profile-email">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-profile-dept">{user.department || "Geen afdeling"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">@{user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.active ? "Actief" : "Inactief"}</span>
                </div>
                {user.birthDate && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-profile-birthdate">{formatDate(user.birthDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Wachtwoord wijzigen</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Huidig wachtwoord</label>
              <Input
                type="password"
                value={huidigWw}
                onChange={e => setHuidigWw(e.target.value)}
                placeholder="Huidig wachtwoord"
                data-testid="input-huidig-wachtwoord"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nieuw wachtwoord</label>
              <Input
                type="password"
                value={nieuwWw}
                onChange={e => setNieuwWw(e.target.value)}
                placeholder="Min. 8 tekens"
                data-testid="input-nieuw-wachtwoord"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Bevestig nieuw wachtwoord</label>
              <Input
                type="password"
                value={bevestigWw}
                onChange={e => setBevestigWw(e.target.value)}
                placeholder="Herhaal nieuw wachtwoord"
                data-testid="input-bevestig-wachtwoord"
              />
            </div>
          </div>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => changePasswordMutation.mutate()}
            disabled={changePasswordMutation.isPending || !huidigWw || !nieuwWw || !bevestigWw}
            data-testid="button-wijzig-wachtwoord"
          >
            {changePasswordMutation.isPending ? "Opslaan..." : "Wachtwoord wijzigen"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Mijn Verzuim</h3>
            <Badge variant="secondary" className="ml-auto text-xs">{myAbsences?.length || 0}</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingAbsences ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : !myAbsences?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen verzuimregistraties</p>
            ) : (
              <div className="space-y-2">
                {myAbsences.map((absence) => (
                  <div key={absence.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate" data-testid={`my-absence-${absence.id}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{typeLabels[absence.type] || absence.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(absence.startDate)} t/m {formatDate(absence.endDate)}
                      </p>
                      {absence.reason && <p className="text-xs text-muted-foreground mt-0.5">{absence.reason}</p>}
                    </div>
                    <Badge
                      variant={absence.status === "approved" ? "default" : absence.status === "rejected" ? "destructive" : "outline"}
                      className="text-xs shrink-0"
                    >
                      {statusLabels[absence.status] || absence.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Award className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Mijn Beloningen</h3>
            <Badge variant="secondary" className="ml-auto text-xs">{totalPoints} punten</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingRewards ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : !myRewards?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nog geen beloningen ontvangen</p>
            ) : (
              <div className="space-y-2">
                {myRewards.map((reward) => (
                  <div key={reward.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate" data-testid={`my-reward-${reward.id}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{reward.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reward.awardedAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">+{reward.points}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Mijn Functie & Salarisontwikkeling</h3>
          <Badge variant="secondary" className="ml-auto text-xs">{myPositionHistory?.length || 0}</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingHistory ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !myPositionHistory?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Geen functiehistorie beschikbaar</p>
          ) : (
            <div className="space-y-2">
              {myPositionHistory.map((entry, idx) => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-md ${idx === 0 ? "bg-primary/5" : "hover-elevate"}`} data-testid={`my-position-${entry.id}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{entry.functionTitle}</p>
                      {!entry.endDate && <Badge variant="default" className="text-xs">Huidig</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.startDate)}
                      {" - "}
                      {entry.endDate
                        ? formatDate(entry.endDate)
                        : "heden"}
                    </p>
                    {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                  </div>
                  {entry.salary && (
                    <span className="text-sm font-medium shrink-0 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      XCG {new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(entry.salary)} /mnd
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Mijn Persoonlijke Ontwikkeling</h3>
          <Badge variant="secondary" className="ml-auto text-xs">{myDevelopment?.length || 0}</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingDev ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !myDevelopment?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Geen opleidingen/trainingen beschikbaar</p>
          ) : (
            <div className="space-y-2">
              {myDevelopment.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-md hover-elevate" data-testid={`my-dev-${entry.id}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <p className="text-sm font-medium">{entry.trainingName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.startDate)}
                      {" - "}
                      {entry.endDate
                        ? formatDate(entry.endDate)
                        : "heden"}
                    </p>
                  </div>
                  <Badge variant={entry.completed ? "default" : "outline"} className="text-xs shrink-0">
                    {entry.completed ? "Afgerond" : "Lopend"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Mijn Toegang</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2 flex-wrap">
            {user.permissions?.map((p) => (
              <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
            )) || <p className="text-sm text-muted-foreground">Geen modules toegewezen</p>}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
