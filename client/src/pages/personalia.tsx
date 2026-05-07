import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Users, Mail, Building2, Pencil, UserCheck, UserX, CalendarDays, Briefcase, TrendingUp, Trash2, GraduationCap, CheckCircle2, Circle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { User, Department, PositionHistory, PersonalDevelopment, JobFunction } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { formatDate } from "@/lib/dateUtils";

const titelEntrySchema = z.object({
  tekst: z.string().min(1, "Titel mag niet leeg zijn"),
  positie: z.enum(["voor", "achter"]),
});
type TitelEntry = z.infer<typeof titelEntrySchema>;

const userFormSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(8, "Minimaal 8 tekens"),
  voornamen: z.string().min(1, "Voornamen zijn verplicht"),
  voorvoegsel: z.string().optional(),
  achternaam: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").or(z.literal("")).optional(),
  role: z.string().default("employee"),
  department: z.string().optional(),
  startDate: z.string().min(1, "Datum in dienst is verplicht"),
  birthDate: z.string().optional(),
  phoneExtension: z.string().max(4, "Maximaal 4 cijfers").optional(),
  functie: z.string().optional(),
  kadasterId: z.string().optional(),
  cedulaNr: z.string().optional(),
  telefoonnr: z.string().optional(),
  mobielnr: z.string().optional(),
  adres: z.string().optional(),
}).refine((data) => {
  if (data.birthDate && data.startDate && data.birthDate > data.startDate) return false;
  return true;
}, { message: "Geboortedatum mag niet na datum in dienst zijn", path: ["birthDate"] });

const editFormSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().optional().refine(val => !val || val.length >= 8, { message: "Minimaal 8 tekens" }),
  voornamen: z.string().min(1, "Voornamen zijn verplicht"),
  voorvoegsel: z.string().optional(),
  achternaam: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").or(z.literal("")).optional(),
  role: z.string(),
  department: z.string().optional(),
  startDate: z.string().min(1, "Datum in dienst is verplicht"),
  birthDate: z.string().optional(),
  phoneExtension: z.string().max(4, "Maximaal 4 cijfers").optional(),
  functie: z.string().optional(),
  kadasterId: z.string().optional(),
  cedulaNr: z.string().optional(),
  telefoonnr: z.string().optional(),
  mobielnr: z.string().optional(),
  adres: z.string().optional(),
}).refine((data) => {
  if (data.birthDate && data.startDate && data.birthDate > data.startDate) return false;
  return true;
}, { message: "Geboortedatum mag niet na datum in dienst zijn", path: ["birthDate"] });

function buildTitelPayload(titels: TitelEntry[] | undefined) {
  const voor = (titels ?? []).filter(t => t.positie === "voor" && t.tekst.trim()).map(t => t.tekst.trim());
  const achter = (titels ?? []).filter(t => t.positie === "achter" && t.tekst.trim()).map(t => t.tekst.trim());
  return { titelsVoor: voor.length ? voor : null, titelsAchter: achter.length ? achter : null };
}

function bestaandeTitels(user: User): TitelEntry[] {
  const voor = user.titelsVoor ?? [];
  const achter = user.titelsAchter ?? [];
  return [
    ...voor.map(t => ({ tekst: t, positie: "voor" as const })),
    ...achter.map(t => ({ tekst: t, positie: "achter" as const })),
  ];
}

function formatNaamMetTitels(user: User): string {
  const voor = user.titelsVoor ?? [];
  const achter = user.titelsAchter ?? [];
  const naam = [user.voornamen ?? "", user.voorvoegsel ?? "", user.achternaam ?? ""]
    .filter(Boolean).join(" ") || user.fullName;
  let result = "";
  if (voor.length) result += voor.join(" ") + " ";
  result += naam;
  if (achter.length) result += ", " + achter.join(", ");
  return result.trim();
}

function TitelsField({
  titels,
  onChange,
}: {
  titels: TitelEntry[];
  onChange: (t: TitelEntry[]) => void;
}) {
  const voegToe = () => onChange([...titels, { tekst: "", positie: "voor" }]);
  const verwijder = (i: number) => onChange(titels.filter((_, idx) => idx !== i));
  const wijzig = (i: number, veld: keyof TitelEntry, waarde: string) => {
    const kopie = titels.map((t, idx) => idx === i ? { ...t, [veld]: waarde } : t);
    onChange(kopie);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Titels</span>
        <Button type="button" variant="outline" size="sm" onClick={voegToe} data-testid="button-add-titel">
          <Plus className="h-3 w-3 mr-1" />
          Titel toevoegen
        </Button>
      </div>
      {titels.length === 0 && (
        <p className="text-xs text-muted-foreground">Geen titels toegevoegd</p>
      )}
      {titels.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={t.tekst}
            onChange={e => wijzig(i, "tekst", e.target.value)}
            placeholder="bijv. Dr., MSc, Ir."
            className="flex-1"
            data-testid={`input-titel-tekst-${i}`}
          />
          <Select value={t.positie} onValueChange={v => wijzig(i, "positie", v)}>
            <SelectTrigger className="w-36" data-testid={`select-titel-positie-${i}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="voor">Voor naam</SelectItem>
              <SelectItem value="achter">Achter naam</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="icon" onClick={() => verwijder(i)} data-testid={`button-remove-titel-${i}`}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  );
}

const deactivateFormSchema = z.object({
  endDate: z.string().min(1, "Datum uit dienst is verplicht"),
});

function EditDialog({
  user,
  departments,
  allUsers,
  open,
  onOpenChange,
}: {
  user: User;
  departments: Department[] | undefined;
  allUsers: User[] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { data: jobFunctionList } = useQuery<JobFunction[]>({ queryKey: ["/api/job-functions"] });
  const [editTitels, setEditTitels] = useState<TitelEntry[]>(() => bestaandeTitels(user));

  useEffect(() => {
    if (open) {
      setEditTitels(bestaandeTitels(user));
    }
  }, [open, user.id]);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      username: user.username,
      password: "",
      voornamen: (user as any).voornamen || "",
      voorvoegsel: (user as any).voorvoegsel || "",
      achternaam: (user as any).achternaam || "",
      email: user.email,
      role: user.role,
      department: user.department || "",
      startDate: user.startDate || "",
      birthDate: user.birthDate || "",
      phoneExtension: user.phoneExtension || "",
      functie: user.functie || "",
      kadasterId: (user as any).kadasterId || "",
      cedulaNr: (user as any).cedulaNr || "",
      telefoonnr: (user as any).telefoonnr || "",
      mobielnr: (user as any).mobielnr || "",
      adres: (user as any).adres || "",
    },
  });
  const watchEditStartDate = form.watch("startDate");

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof editFormSchema>) => {
      if (data.kadasterId) {
        const duplicate = (allUsers ?? []).find(
          (u) => u.id !== user.id && (u as any).kadasterId === data.kadasterId
        );
        if (duplicate) {
          throw new Error(`Userid "${data.kadasterId}" is al in gebruik door ${(duplicate as any).voornamen ?? duplicate.username}`);
        }
      }
      const fullName = [data.voornamen, data.voorvoegsel, data.achternaam].filter(Boolean).join(" ");
      const { titelsVoor, titelsAchter } = buildTitelPayload(editTitels);
      const payload: Record<string, any> = {
        username: data.username,
        fullName,
        voornamen: data.voornamen,
        voorvoegsel: data.voorvoegsel || null,
        achternaam: data.achternaam,
        email: data.email || "",
        role: data.role,
        department: data.department || null,
        startDate: data.startDate,
        birthDate: data.birthDate || null,
        phoneExtension: data.phoneExtension || null,
        functie: (data.functie === "none" || !data.functie) ? null : data.functie,
        kadasterId: data.kadasterId || null,
        cedulaNr: data.cedulaNr || null,
        telefoonnr: data.telefoonnr || null,
        mobielnr: data.mobielnr || null,
        adres: data.adres || null,
        titelsVoor,
        titelsAchter,
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }
      await apiRequest("PATCH", `/api/users/${user.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Medewerker bijgewerkt" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Fout bij bijwerken", description: err.message, variant: "destructive" });
    },
  });

  const watchedDept = useWatch({ control: form.control, name: "department" });
  const editDeptId = departments?.find((d) => d.name === watchedDept)?.id ?? null;
  const editFunctions = editDeptId
    ? (jobFunctionList?.filter((f) => f.departmentId === editDeptId) ?? [])
    : (jobFunctionList ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medewerker Bewerken</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gebruikersnaam</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-username" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Wachtwoord</FormLabel>
                  <FormControl><Input {...field} type="password" placeholder="Laat leeg om niet te wijzigen" data-testid="input-edit-password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-[1fr_120px_1fr] gap-3">
              <FormField control={form.control} name="voornamen" render={({ field }) => (
                <FormItem>
                  <FormLabel>Voornamen</FormLabel>
                  <FormControl><Input {...field} placeholder="bijv. Jan" data-testid="input-edit-voornamen" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="voorvoegsel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Voorvoegsel</FormLabel>
                  <FormControl><Input {...field} placeholder="de, van…" data-testid="input-edit-voorvoegsel" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="achternaam" render={({ field }) => (
                <FormItem>
                  <FormLabel>Achternaam</FormLabel>
                  <FormControl><Input {...field} placeholder="bijv. Vries" data-testid="input-edit-achternaam" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <TitelsField titels={editTitels} onChange={setEditTitels} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input {...field} type="email" data-testid="input-edit-email" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Medewerker</SelectItem>
                      <SelectItem value="tijdelijk">Tijdelijk</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="manager_az">Beheerder AZ</SelectItem>
                      <SelectItem value="admin">Beheerder</SelectItem>
                      <SelectItem value="directeur">Directeur</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Afdeling</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-department"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum in Dienst</FormLabel>
                  <FormControl><Input {...field} type="date" data-testid="input-edit-startdate" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Geboortedatum</FormLabel>
                  <FormControl><Input {...field} type="date" max={watchEditStartDate || undefined} data-testid="input-edit-birthdate" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="phoneExtension" render={({ field }) => (
              <FormItem>
                <FormLabel>Toestelnummer</FormLabel>
                <FormControl><Input {...field} maxLength={4} placeholder="bijv. 1011" data-testid="input-edit-phone-extension" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="functie" render={({ field }) => (
              <FormItem>
                <FormLabel>Functie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="input-edit-functie"><SelectValue placeholder="Selecteer functie" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">— Geen functie —</SelectItem>
                    {editFunctions.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((f) => (
                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="kadasterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Userid</FormLabel>
                  <FormControl><Input {...field} placeholder="bijv. 1001" data-testid="input-edit-userid" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cedulaNr" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cedulanr.</FormLabel>
                  <FormControl><Input {...field} placeholder="Cedula nummer" data-testid="input-edit-cedula-nr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="telefoonnr" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefoonnr.</FormLabel>
                  <FormControl><Input {...field} placeholder="bijv. +5999 123 4567" data-testid="input-edit-telefoonnr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mobielnr" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobielnr.</FormLabel>
                  <FormControl><Input {...field} placeholder="bijv. +5999 987 6543" data-testid="input-edit-mobielnr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="adres" render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl><Input {...field} placeholder="Straat en huisnummer, Woonplaats" data-testid="input-edit-adres" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-save-edit">
              {mutation.isPending ? "Opslaan..." : "Wijzigingen Opslaan"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof deactivateFormSchema>>({
    resolver: zodResolver(deactivateFormSchema),
    defaultValues: {
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof deactivateFormSchema>) => {
      await apiRequest("PATCH", `/api/users/${user.id}`, {
        active: false,
        endDate: data.endDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: `${formatNaamMetTitels(user)} is nu inactief` });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Fout bij deactiveren", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Medewerker Deactiveren</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Vul de datum uit dienst in voor <span className="font-medium text-foreground">{formatNaamMetTitels(user)}</span>.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="endDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Datum uit Dienst</FormLabel>
                <FormControl><Input {...field} type="date" data-testid="input-end-date" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" variant="destructive" className="w-full" disabled={mutation.isPending} data-testid="button-confirm-deactivate">
              {mutation.isPending ? "Deactiveren..." : "Deactiveren"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const positionFormSchema = z.object({
  functionTitle: z.string().min(1, "Functie is verplicht"),
  startDate: z.string().min(1, "Startdatum is verplicht"),
  endDate: z.string().optional(),
  beginSchaal: z.string().optional(),
  eindSchaal: z.string().optional(),
  notes: z.string().optional(),
});

function PositionHistoryDialog({
  user,
  open,
  onOpenChange,
  isAdmin,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PositionHistory | null>(null);

  const { data: history, isLoading } = useQuery<PositionHistory[]>({
    queryKey: ["/api/position-history/user", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/position-history/user/${user.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fout bij ophalen");
      return res.json();
    },
    enabled: open,
  });

  const { data: jobFunctions } = useQuery<JobFunction[]>({
    queryKey: ["/api/job-functions"],
    enabled: open && isAdmin,
  });

  const form = useForm<z.infer<typeof positionFormSchema>>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: { functionTitle: "", startDate: "", endDate: "", beginSchaal: "", eindSchaal: "", notes: "" },
  });

  const watchedTitle = form.watch("functionTitle");

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof positionFormSchema>) => {
      await apiRequest("POST", "/api/position-history", {
        userId: user.id,
        functionTitle: data.functionTitle,
        startDate: data.startDate,
        endDate: data.endDate || null,
        beginSchaal: data.beginSchaal ? parseInt(data.beginSchaal) : null,
        eindSchaal: data.eindSchaal ? parseInt(data.eindSchaal) : null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-history/user", user.id] });
      toast({ title: "Functiehistorie toegevoegd" });
      setAddOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Fout bij toevoegen", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof positionFormSchema> }) => {
      await apiRequest("PATCH", `/api/position-history/${id}`, {
        functionTitle: data.functionTitle,
        startDate: data.startDate,
        endDate: data.endDate || null,
        beginSchaal: data.beginSchaal ? parseInt(data.beginSchaal) : null,
        eindSchaal: data.eindSchaal ? parseInt(data.eindSchaal) : null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-history/user", user.id] });
      toast({ title: "Functiehistorie bijgewerkt" });
      setEditEntry(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Fout bij bijwerken", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/position-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/position-history/user", user.id] });
      toast({ title: "Verwijderd" });
    },
  });

  useEffect(() => {
    if (!watchedTitle || !jobFunctions || editEntry) return;
    const match = jobFunctions.find((f) => f.name === watchedTitle);
    if (match) {
      if (match.beginSchaal != null) form.setValue("beginSchaal", String(match.beginSchaal));
      if (match.eindSchaal != null) form.setValue("eindSchaal", String(match.eindSchaal));
    }
  }, [watchedTitle, jobFunctions, editEntry]);

  const formatSchaal = (begin: number | null, eind: number | null) => {
    const fmt = (v: number) => new Intl.NumberFormat("nl-NL").format(v);
    if (begin != null && eind != null) return `${fmt(begin)} – ${fmt(eind)}`;
    if (begin != null) return `v.a. ${fmt(begin)}`;
    if (eind != null) return `t/m ${fmt(eind)}`;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Functie & Schaalhistorie - {formatNaamMetTitels(user)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((entry, idx) => (
              <Card key={entry.id} className={idx === 0 ? "border-primary/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium" data-testid={`text-position-title-${entry.id}`}>{entry.functionTitle}</p>
                        {!entry.endDate && <Badge variant="default" className="text-xs">Huidig</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(entry.startDate)}
                          {" - "}
                          {entry.endDate
                            ? formatDate(entry.endDate)
                            : "heden"}
                        </span>
                        {formatSchaal(entry.beginSchaal ?? null, entry.eindSchaal ?? null) && (
                          <span className="text-sm font-medium flex items-center gap-1" data-testid={`text-schaal-${entry.id}`}>
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            Schaal {formatSchaal(entry.beginSchaal ?? null, entry.eindSchaal ?? null)}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditEntry(entry);
                            setAddOpen(false);
                            form.reset({
                              functionTitle: entry.functionTitle,
                              startDate: entry.startDate,
                              endDate: entry.endDate || "",
                              beginSchaal: entry.beginSchaal != null ? String(entry.beginSchaal) : "",
                              eindSchaal: entry.eindSchaal != null ? String(entry.eindSchaal) : "",
                              notes: entry.notes || "",
                            });
                          }}
                          data-testid={`button-edit-position-${entry.id}`}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-position-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen functiehistorie beschikbaar</p>
        )}

        {isAdmin && (
          <div className="mt-2">
            {(addOpen || editEntry) ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">{editEntry ? "Functie Bewerken" : "Nieuwe Functie Toevoegen"}</p>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((d) => {
                      if (editEntry) {
                        updateMutation.mutate({ id: editEntry.id, data: d });
                      } else {
                        createMutation.mutate(d);
                      }
                    })} className="space-y-3">
                      <FormField control={form.control} name="functionTitle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Functietitel</FormLabel>
                          <FormControl><Input {...field} placeholder="bijv. Senior Developer" data-testid="input-position-title" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="startDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Startdatum</FormLabel>
                            <FormControl><Input {...field} type="date" data-testid="input-position-start" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="endDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Einddatum</FormLabel>
                            <FormControl><Input {...field} type="date" placeholder="Leeg = huidig" data-testid="input-position-end" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="beginSchaal" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Begin schaal</FormLabel>
                            <FormControl><Input {...field} type="number" placeholder="bijv. 2500" data-testid="input-position-begin-schaal" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="eindSchaal" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Eind schaal</FormLabel>
                            <FormControl><Input {...field} type="number" placeholder="bijv. 4000" data-testid="input-position-eind-schaal" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opmerking</FormLabel>
                          <FormControl><Input {...field} placeholder="bijv. Promotie" data-testid="input-position-notes" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-position">
                          {(createMutation.isPending || updateMutation.isPending) ? "Opslaan..." : editEntry ? "Wijzigen" : "Toevoegen"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditEntry(null); form.reset(); }}>
                          Annuleren
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => { setAddOpen(true); form.reset({ functionTitle: "", startDate: "", endDate: "", beginSchaal: "", eindSchaal: "", notes: "" }); }} className="w-full" data-testid="button-add-position">
                <Plus className="h-4 w-4 mr-2" />
                Functie Toevoegen
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const devFormSchema = z.object({
  trainingName: z.string().min(1, "Naam opleiding/training is verplicht"),
  startDate: z.string().min(1, "Startdatum is verplicht"),
  endDate: z.string().optional(),
  completed: z.boolean().default(false),
});

function PersonalDevelopmentDialog({
  user,
  open,
  onOpenChange,
  isAdmin,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PersonalDevelopment | null>(null);

  const form = useForm<z.infer<typeof devFormSchema>>({
    resolver: zodResolver(devFormSchema),
    defaultValues: { trainingName: "", startDate: "", endDate: "", completed: false },
  });

  const { data: devEntries, isLoading } = useQuery<PersonalDevelopment[]>({
    queryKey: ["/api/personal-development/user", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/personal-development/user/${user.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fout bij laden");
      return res.json();
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof devFormSchema>) => {
      await apiRequest("POST", "/api/personal-development", {
        userId: user.id,
        trainingName: data.trainingName,
        startDate: data.startDate,
        endDate: data.endDate || null,
        completed: data.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-development/user", user.id] });
      toast({ title: "Opleiding toegevoegd" });
      setAddOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Fout bij toevoegen", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof devFormSchema> }) => {
      await apiRequest("PATCH", `/api/personal-development/${id}`, {
        trainingName: data.trainingName,
        startDate: data.startDate,
        endDate: data.endDate || null,
        completed: data.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-development/user", user.id] });
      toast({ title: "Opleiding bijgewerkt" });
      setEditEntry(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Fout bij bijwerken", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/personal-development/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-development/user", user.id] });
      toast({ title: "Verwijderd" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Persoonlijke Ontwikkeling - {formatNaamMetTitels(user)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : devEntries && devEntries.length > 0 ? (
          <div className="space-y-3">
            {devEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <p className="font-medium" data-testid={`text-dev-name-${entry.id}`}>{entry.trainingName}</p>
                        <Badge variant={entry.completed ? "default" : "outline"} className="text-xs">
                          {entry.completed ? "Afgerond" : "Lopend"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(entry.startDate)}
                        {" - "}
                        {entry.endDate
                          ? formatDate(entry.endDate)
                          : "heden"}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditEntry(entry);
                            setAddOpen(false);
                            form.reset({
                              trainingName: entry.trainingName,
                              startDate: entry.startDate,
                              endDate: entry.endDate || "",
                              completed: entry.completed,
                            });
                          }}
                          data-testid={`button-edit-dev-${entry.id}`}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-dev-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen opleidingen/trainingen beschikbaar</p>
        )}

        {isAdmin && (
          <div className="mt-2">
            {(addOpen || editEntry) ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">{editEntry ? "Opleiding Bewerken" : "Nieuwe Opleiding Toevoegen"}</p>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((d) => {
                      if (editEntry) {
                        updateMutation.mutate({ id: editEntry.id, data: d });
                      } else {
                        createMutation.mutate(d);
                      }
                    })} className="space-y-3">
                      <FormField control={form.control} name="trainingName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opleiding / Training</FormLabel>
                          <FormControl><Input {...field} placeholder="bijv. ITIL Foundation" data-testid="input-dev-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="startDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Van</FormLabel>
                            <FormControl><Input {...field} type="date" data-testid="input-dev-start" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="endDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tot</FormLabel>
                            <FormControl><Input {...field} type="date" data-testid="input-dev-end" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="completed" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dev-completed"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Afgerond</FormLabel>
                        </FormItem>
                      )} />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-dev">
                          {(createMutation.isPending || updateMutation.isPending) ? "Opslaan..." : editEntry ? "Wijzigen" : "Toevoegen"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditEntry(null); form.reset(); }}>
                          Annuleren
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => { setAddOpen(true); form.reset({ trainingName: "", startDate: "", endDate: "", completed: false }); }} className="w-full" data-testid="button-add-dev">
                <Plus className="h-4 w-4 mr-2" />
                Opleiding Toevoegen
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InlinePositionHistory({ user }: { user: User }) {
  const { data: history, isLoading } = useQuery<PositionHistory[]>({
    queryKey: ["/api/position-history/user", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/position-history/user/${user.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fout bij ophalen");
      return res.json();
    },
  });

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Functie & Schaalhistorie</h3>
          <Badge variant="secondary" className="ml-auto text-xs">{history?.length || 0}</Badge>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !history?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen functiehistorie beschikbaar</p>
        ) : (
          <div className="space-y-2">
            {history.map((entry, idx) => (
              <div key={entry.id} className={`p-3 rounded-md ${idx === 0 ? "bg-primary/5" : "hover-elevate"}`} data-testid={`inline-position-${entry.id}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{entry.functionTitle}</p>
                  {!entry.endDate && <Badge variant="default" className="text-xs">Huidig</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(entry.startDate)}
                    {" - "}
                    {entry.endDate
                      ? formatDate(entry.endDate)
                      : "heden"}
                  </span>
                  {(entry.beginSchaal != null || entry.eindSchaal != null) && (
                    <span className="text-xs font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      Schaal {entry.beginSchaal != null && entry.eindSchaal != null
                        ? `${new Intl.NumberFormat("nl-NL").format(entry.beginSchaal)} – ${new Intl.NumberFormat("nl-NL").format(entry.eindSchaal)}`
                        : entry.beginSchaal != null
                          ? `v.a. ${new Intl.NumberFormat("nl-NL").format(entry.beginSchaal)}`
                          : `t/m ${new Intl.NumberFormat("nl-NL").format(entry.eindSchaal!)}`}
                    </span>
                  )}
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InlinePersonalDevelopment({ user }: { user: User }) {
  const { data: devEntries, isLoading } = useQuery<PersonalDevelopment[]>({
    queryKey: ["/api/personal-development/user", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/personal-development/user/${user.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fout bij laden");
      return res.json();
    },
  });

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Persoonlijke Ontwikkeling</h3>
          <Badge variant="secondary" className="ml-auto text-xs">{devEntries?.length || 0}</Badge>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !devEntries?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen opleidingen/trainingen beschikbaar</p>
        ) : (
          <div className="space-y-2">
            {devEntries.map((entry) => (
              <div key={entry.id} className="p-3 rounded-md hover-elevate" data-testid={`inline-dev-${entry.id}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <p className="text-sm font-medium">{entry.trainingName}</p>
                  <Badge variant={entry.completed ? "default" : "outline"} className="text-xs">
                    {entry.completed ? "Afgerond" : "Lopend"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <CalendarDays className="h-3 w-3 inline mr-1" />
                  {formatDate(entry.startDate)}
                  {" - "}
                  {entry.endDate
                    ? formatDate(entry.endDate)
                    : "heden"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PersonaliaPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitels, setCreateTitels] = useState<TitelEntry[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [devUser, setDevUser] = useState<User | null>(null);
  const [personelTab, setPersonelTab] = useState<"actief" | "tijdelijk" | "oud">("actief");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const canEditPersonalia = isAdminRole(currentUser?.role) || currentUser?.role === "manager_az";

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: nextUserIdData } = useQuery<{ nextId: string }>({
    queryKey: ["/api/users/next-userid"],
    enabled: createOpen,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: jobFunctionList } = useQuery<JobFunction[]>({
    queryKey: ["/api/job-functions"],
  });

  const createForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "", password: "",
      voornamen: "", voorvoegsel: "", achternaam: "",
      email: "", role: "employee", department: "",
      startDate: new Date().toISOString().split("T")[0],
      birthDate: "", phoneExtension: "", functie: "",
      kadasterId: "", cedulaNr: "", telefoonnr: "", mobielnr: "", adres: "",
    },
  });
  const watchCreateStartDate = createForm.watch("startDate");

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const fullName = [data.voornamen, data.voorvoegsel, data.achternaam].filter(Boolean).join(" ");
      const { titelsVoor, titelsAchter } = buildTitelPayload(createTitels);
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        fullName,
        voornamen: data.voornamen,
        voorvoegsel: data.voorvoegsel || null,
        achternaam: data.achternaam,
        email: data.email || "",
        department: data.department || null,
        birthDate: data.birthDate || null,
        phoneExtension: data.phoneExtension || null,
        functie: (data.functie === "none" || !data.functie) ? null : data.functie,
        cedulaNr: data.cedulaNr || null,
        telefoonnr: data.telefoonnr || null,
        mobielnr: data.mobielnr || null,
        adres: data.adres || null,
        titelsVoor,
        titelsAchter,
        avatar: null,
        active: true,
        endDate: null,
      });
      return res.json();
    },
    onSuccess: (newUser: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/next-userid"] });
      toast({
        title: "Medewerker aangemaakt",
        description: newUser?.kadasterId ? `Userid: ${newUser.kadasterId}` : undefined,
      });
      setCreateOpen(false);
      setCreateTitels([]);
      createForm.reset();
    },
    onError: (err: any) => {
      toast({ title: "Fout bij aanmaken", description: err.message, variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/users/${id}`, {
        active: true,
        endDate: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Medewerker geactiveerd" });
    },
    onError: (err: any) => {
      toast({ title: "Fout bij activeren", description: err.message, variant: "destructive" });
    },
  });

  const roleLabels: Record<string, string> = {
    admin: "Beheerder",
    manager: "Manager",
    manager_az: "Beheerder AZ",
    employee: "Medewerker",
    directeur: "Directeur",
    tijdelijk: "Tijdelijk",
  };

  const createWatchedDept = useWatch({ control: createForm.control, name: "department" });
  const createDeptId = departments?.find((d) => d.name === createWatchedDept)?.id ?? null;
  const createFunctions = createDeptId
    ? (jobFunctionList?.filter((f) => f.departmentId === createDeptId) ?? [])
    : (jobFunctionList ?? []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Personalia"
        subtitle={canEditPersonalia ? "Overzicht van alle medewerkers" : "Uw persoonlijke gegevens"}
        imageSrc="/uploads/App_pics/personalia.png"
        imageAlt="personalia"
      />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-end gap-4 flex-wrap">
        {canEditPersonalia && (personelTab === "actief" || personelTab === "tijdelijk") && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user" onClick={() => {
                createForm.setValue("role", personelTab === "tijdelijk" ? "tijdelijk" : "employee");
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {personelTab === "tijdelijk" ? "Nieuw Tijdelijk Personeelslid" : "Nieuwe Medewerker"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{personelTab === "tijdelijk" ? "Nieuw Tijdelijk Personeelslid" : "Nieuwe Medewerker"}</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-[1fr_120px_1fr] gap-3">
                    <FormField control={createForm.control} name="voornamen" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornamen</FormLabel>
                        <FormControl><Input {...field} placeholder="bijv. Jan" data-testid="input-user-voornamen" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="voorvoegsel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voorvoegsel</FormLabel>
                        <FormControl><Input {...field} placeholder="de, van…" data-testid="input-user-voorvoegsel" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="achternaam" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam</FormLabel>
                        <FormControl><Input {...field} placeholder="bijv. Vries" data-testid="input-user-achternaam" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <TitelsField titels={createTitels} onChange={setCreateTitels} />
                  <FormField control={createForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl><Input {...field} type="email" data-testid="input-user-email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gebruikersnaam</FormLabel>
                        <FormControl><Input {...field} data-testid="input-user-username" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wachtwoord</FormLabel>
                        <FormControl><Input {...field} type="password" data-testid="input-user-password" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Medewerker</SelectItem>
                            <SelectItem value="tijdelijk">Tijdelijk</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="manager_az">Beheerder AZ</SelectItem>
                            <SelectItem value="admin">Beheerder</SelectItem>
                            <SelectItem value="directeur">Directeur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Afdeling</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user-department"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((d) => (
                              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum in Dienst</FormLabel>
                        <FormControl><Input {...field} type="date" data-testid="input-user-startdate" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="birthDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortedatum</FormLabel>
                        <FormControl><Input {...field} type="date" max={watchCreateStartDate || undefined} data-testid="input-user-birthdate" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={createForm.control} name="phoneExtension" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toestelnummer</FormLabel>
                      <FormControl><Input {...field} maxLength={4} placeholder="bijv. 1011" data-testid="input-user-phone-extension" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={createForm.control} name="functie" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="input-user-functie"><SelectValue placeholder="Selecteer functie" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">— Geen functie —</SelectItem>
                          {createFunctions.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((f) => (
                            <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Userid</label>
                      <div className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground mt-1.5 font-medium" data-testid="display-new-userid">
                        {nextUserIdData?.nextId ?? "—"}
                      </div>
                    </div>
                    <FormField control={createForm.control} name="cedulaNr" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cedulanr.</FormLabel>
                        <FormControl><Input {...field} placeholder="Cedula nummer" data-testid="input-user-cedula-nr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={createForm.control} name="telefoonnr" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefoonnr.</FormLabel>
                        <FormControl><Input {...field} placeholder="bijv. +5999 123 4567" data-testid="input-user-telefoonnr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="mobielnr" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobielnr.</FormLabel>
                        <FormControl><Input {...field} placeholder="bijv. +5999 987 6543" data-testid="input-user-mobielnr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={createForm.control} name="adres" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl><Input {...field} placeholder="Straat en huisnummer, Woonplaats" data-testid="input-user-adres" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-user">
                    {createMutation.isPending ? "Opslaan..." : "Medewerker Opslaan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {editUser && (
        <EditDialog
          user={editUser}
          departments={departments}
          allUsers={users}
          open={!!editUser}
          onOpenChange={(open) => { if (!open) setEditUser(null); }}
        />
      )}

      {deactivateUser && (
        <DeactivateDialog
          user={deactivateUser}
          open={!!deactivateUser}
          onOpenChange={(open) => { if (!open) setDeactivateUser(null); }}
        />
      )}

      {historyUser && (
        <PositionHistoryDialog
          user={historyUser}
          open={!!historyUser}
          onOpenChange={(open) => { if (!open) setHistoryUser(null); }}
          isAdmin={canEditPersonalia}
        />
      )}

      {devUser && (
        <PersonalDevelopmentDialog
          user={devUser}
          open={!!devUser}
          onOpenChange={(open) => { if (!open) setDevUser(null); }}
          isAdmin={canEditPersonalia}
        />
      )}

      {canEditPersonalia && (
        <div className="flex gap-1 border-b" data-testid="tabs-personalia">
          {([
            { key: "actief", label: "Vaste Medewerkers" },
            { key: "tijdelijk", label: "Tijdelijk Personeel" },
            { key: "oud", label: "Oud Medewerkers" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPersonelTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                personelTab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-personeel-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(() => {
        const allVisible = canEditPersonalia ? users : users?.filter(u => u.id === currentUser?.id);
        const visibleUsers = canEditPersonalia
          ? (personelTab === "oud"
              ? allVisible?.filter(u => !u.active)
              : personelTab === "tijdelijk"
              ? allVisible?.filter(u => u.active !== false && u.role === "tijdelijk")
              : allVisible?.filter(u => u.active !== false && u.role !== "tijdelijk"))
          : allVisible?.filter(u => u.active !== false);
        const emptyMsg = personelTab === "oud"
          ? "Geen voormalige medewerkers"
          : personelTab === "tijdelijk"
          ? "Geen tijdelijk personeel gevonden"
          : "Geen medewerkers gevonden";
        if (!visibleUsers || visibleUsers.length === 0) return (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{emptyMsg}</p>
            </CardContent>
          </Card>
        );
        {
          const grouped: Record<string, User[]> = {};
          visibleUsers.forEach((u) => {
            const dept = u.department || "Geen afdeling";
            if (!grouped[dept]) grouped[dept] = [];
            grouped[dept].push(u);
          });

          const sortedDeptNames = Object.keys(grouped).sort((a, b) => {
            if (a === "Geen afdeling") return 1;
            if (b === "Geen afdeling") return -1;
            return a.localeCompare(b, "nl");
          });

          sortedDeptNames.forEach((dept) => {
            grouped[dept].sort((a, b) => {
              const aIsManager = a.role === "manager" || isAdminRole(a.role);
              const bIsManager = b.role === "manager" || isAdminRole(b.role);
              if (aIsManager && !bIsManager) return -1;
              if (!aIsManager && bIsManager) return 1;
              return a.fullName.localeCompare(b.fullName, "nl");
            });
          });

          return (
            <div className="space-y-6">
              {sortedDeptNames.map((deptName) => (
                <div key={deptName}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold" data-testid={`text-department-${deptName}`}>{deptName}</h2>
                    <Badge variant="outline" className="text-xs">{grouped[deptName].length}</Badge>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medewerker</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Functie</TableHead>
                              <TableHead>Toestel</TableHead>
                              <TableHead>Rol</TableHead>
                              <TableHead>Geboortedatum</TableHead>
                              <TableHead>In Dienst</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Acties</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grouped[deptName].map((u) => {
                              const initials = u.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                              const isManager = u.role === "manager" || isAdminRole(u.role);
                              return (
                                <TableRow key={u.id} className={!u.active ? "opacity-60" : ""} data-testid={`row-user-${u.id}`}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className={`text-xs ${isManager ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{initials}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm" data-testid={`text-fullname-${u.id}`}>{formatNaamMetTitels(u)}</p>
                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      {u.email}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground" data-testid={`text-functie-${u.id}`}>
                                      {u.functie || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground" data-testid={`text-phone-ext-${u.id}`}>
                                      {u.phoneExtension || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={isManager ? "default" : "secondary"} className="text-xs">
                                      {roleLabels[u.role] || u.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {u.birthDate ? (
                                      <span className="text-sm">
                                        {formatDate(u.birthDate)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      {u.startDate ? (
                                        <span className="flex items-center gap-1 text-sm">
                                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                          {formatDate(u.startDate)}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                      )}
                                      {u.endDate && (
                                        <span className="text-xs text-muted-foreground">
                                          Uit: {formatDate(u.endDate)}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={u.active ? "default" : "outline"} className="text-xs" data-testid={`status-user-${u.id}`}>
                                      {u.active ? "Actief" : "Inactief"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                      {(canEditPersonalia || currentUser?.id === u.id) && (
                                        <>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setHistoryUser(u)}
                                            data-testid={`button-history-user-${u.id}`}
                                            title="Functie & Schalen"
                                          >
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setDevUser(u)}
                                            data-testid={`button-dev-user-${u.id}`}
                                            title="Persoonlijke Ontwikkeling"
                                          >
                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        </>
                                      )}
                                      {canEditPersonalia && (
                                        <>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setEditUser(u)}
                                            data-testid={`button-edit-user-${u.id}`}
                                          >
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                          {u.id !== currentUser?.id && (
                                            u.active ? (
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setDeactivateUser(u)}
                                                data-testid={`button-deactivate-user-${u.id}`}
                                              >
                                                <UserX className="h-4 w-4 text-muted-foreground" />
                                              </Button>
                                            ) : (
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => activateMutation.mutate(u.id)}
                                                disabled={activateMutation.isPending}
                                                data-testid={`button-activate-user-${u.id}`}
                                              >
                                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                              </Button>
                                            )
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {currentUser?.role !== "admin" && currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InlinePositionHistory user={currentUser as User} />
                  <InlinePersonalDevelopment user={currentUser as User} />
                </div>
              )}
            </div>
          );
        }
      })()}
      </div>
    </div>
  );
}
