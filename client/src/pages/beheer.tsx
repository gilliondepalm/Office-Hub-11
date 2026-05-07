import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { PageHero } from "@/components/page-hero";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, Save, Users, Camera, ImageIcon, KeyRound,
  Building2, Briefcase, Plus, Trash2, Pencil,
  FileText, Upload, ArrowUp, ArrowDown, ListOrdered, ExternalLink,
  CheckCircle2, XCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Department, JobFunction } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "kalender", label: "Evenementen Kalender" },
  { key: "aankondigingen", label: "Aankondigingen" },
  { key: "organisatie", label: "Organisatie" },
  { key: "personalia", label: "Personalia" },
  { key: "verzuim", label: "Verlof" },
  { key: "beloningen", label: "Beloningen" },
  { key: "applicaties", label: "Applicaties" },
  { key: "productie", label: "Productie" },
  { key: "rapporten", label: "Rapporten" },
  { key: "werktijden", label: "Werktijden" },
  { key: "beheer", label: "Beheer (Admin)" },
];

type SafeUser = Omit<User, "password">;

const departmentFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional(),
});

const jobFunctionFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  beginSchaal: z.string().optional(),
  eindSchaal: z.string().optional(),
});

// ─── Dialogs ─────────────────────────────────────────────────────────────────

function PermissionsDialog({
  user, open, onOpenChange,
}: { user: SafeUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(user.permissions || []);

  const mutation = useMutation({
    mutationFn: async (permissions: string[]) => {
      await apiRequest("PATCH", `/api/users/${user.id}/permissions`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Rechten bijgewerkt" });
      onOpenChange(false);
    },
    onError: () => { toast({ title: "Fout bij opslaan", variant: "destructive" }); },
  });

  const toggleModule = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Rechten Beheren</DialogTitle></DialogHeader>
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm" data-testid="text-perm-user">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email} &middot; {user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={() => setSelected(ALL_MODULES.map((m) => m.key))} data-testid="button-select-all">Alles selecteren</Button>
          <Button variant="outline" size="sm" onClick={() => setSelected([])} data-testid="button-clear-all">Alles wissen</Button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {ALL_MODULES.map((mod) => (
            <label key={mod.key} className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`perm-toggle-${mod.key}`}>
              <Checkbox checked={selected.includes(mod.key)} onCheckedChange={() => toggleModule(mod.key)} />
              <span className="text-sm">{mod.label}</span>
            </label>
          ))}
        </div>
        <Button className="w-full mt-4" onClick={() => mutation.mutate(selected)} disabled={mutation.isPending} data-testid="button-save-permissions">
          <Save className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Opslaan..." : "Rechten Opslaan"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user, open, onOpenChange,
}: { user: SafeUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("PATCH", `/api/users/${user.id}`, { password });
    },
    onSuccess: () => {
      toast({ title: "Wachtwoord gereset" });
      setNewPassword(""); setConfirmPassword(""); onOpenChange(false);
    },
    onError: () => { toast({ title: "Fout bij resetten", variant: "destructive" }); },
  });

  const handleSave = () => {
    if (!newPassword.trim()) { toast({ title: "Vul een nieuw wachtwoord in", variant: "destructive" }); return; }
    if (newPassword.length < 8) { toast({ title: "Wachtwoord moet minimaal 8 tekens bevatten", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Wachtwoorden komen niet overeen", variant: "destructive" }); return; }
    mutation.mutate(newPassword);
  };

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Wachtwoord Resetten</DialogTitle></DialogHeader>
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm" data-testid="text-reset-user">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nieuw wachtwoord</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nieuw wachtwoord" data-testid="input-new-password" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Bevestig wachtwoord</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Herhaal wachtwoord" data-testid="input-confirm-password" />
          </div>
        </div>
        <Button className="w-full mt-4" onClick={handleSave} disabled={mutation.isPending} data-testid="button-save-password">
          <KeyRound className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Opslaan..." : "Wachtwoord Resetten"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Rechten ─────────────────────────────────────────────────────────────

function RechtenTab() {
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [resetUser, setResetUser] = useState<SafeUser | null>(null);
  const loginPhotoInputRef = useRef<HTMLInputElement>(null);
  const rapportenPhotoInputRef = useRef<HTMLInputElement>(null);
  const productiePhotoInputRef = useRef<HTMLInputElement>(null);
  const pasfotoInputRef = useRef<HTMLInputElement>(null);
  const [pasfotoUserId, setPasfotoUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadPasfotoMutation = useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/users/${userId}/avatar`, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Upload mislukt");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Pasfoto bijgewerkt" });
      setPasfotoUserId(null);
    },
    onError: (err: any) => { toast({ title: err.message || "Fout bij uploaden pasfoto", variant: "destructive" }); },
  });

  const { data: allUsers, isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  const { data: loginPhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings", "login_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/login_photo", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const uploadLoginPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/site-settings/login-photo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings", "login_photo"] });
      toast({ title: "Inlogfoto bijgewerkt", description: "De achtergrondafbeelding van de inlogpagina is gewijzigd." });
    },
    onError: () => { toast({ title: "Fout", description: "Het uploaden van de foto is mislukt.", variant: "destructive" }); },
  });

  const { data: rapportenPhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings", "rapporten_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/rapporten_photo", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const uploadRapportenPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/site-settings/rapporten-photo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings", "rapporten_photo"] });
      toast({ title: "Rapportenfoto bijgewerkt", description: "De achtergrondafbeelding van de Rapporten pagina is gewijzigd." });
    },
    onError: () => { toast({ title: "Fout", description: "Het uploaden van de foto is mislukt.", variant: "destructive" }); },
  });

  const { data: productiePhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings", "productie_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/productie_photo", { credentials: "include" });
      if (!res.ok) return { value: null };
      return res.json();
    },
  });

  const uploadProductiePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/site-settings/productie-photo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings", "productie_photo"] });
      toast({ title: "Productiefoto bijgewerkt", description: "De achtergrondafbeelding van de Productie pagina is gewijzigd." });
    },
    onError: () => { toast({ title: "Fout", description: "Het uploaden van de foto is mislukt.", variant: "destructive" }); },
  });

  const roleLabels: Record<string, string> = {
    directeur: "Directeur", admin: "Beheerder", manager: "Manager", employee: "Medewerker",
  };
  const roleBadgeVariant = (role: string) => {
    if (role === "directeur" || role === "admin") return "default" as const;
    if (role === "manager") return "secondary" as const;
    return "outline" as const;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={pasfotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pasfotoUserId) uploadPasfotoMutation.mutate({ userId: pasfotoUserId, file });
          e.target.value = "";
        }}
        data-testid="input-pasfoto"
      />
      {editUser && (
        <PermissionsDialog user={editUser} open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }} />
      )}
      {resetUser && (
        <ResetPasswordDialog user={resetUser} open={!!resetUser} onOpenChange={(open) => { if (!open) setResetUser(null); }} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Gebruikers & Rechten</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {allUsers?.filter((u) => u.active !== false).map((u) => {
              const initials = u.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
              const permCount = u.permissions?.length || 0;
              return (
                <div key={u.id} className="p-3 rounded-md hover-elevate" data-testid={`user-row-${u.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      {u.avatar && <AvatarImage src={u.avatar} alt={u.fullName || ""} className="object-cover" />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" data-testid={`text-user-name-${u.id}`}>{u.fullName}</span>
                        <Badge variant={roleBadgeVariant(u.role)} className="text-xs shrink-0">{roleLabels[u.role] || u.role}</Badge>
                        {!u.active && <Badge variant="outline" className="text-xs shrink-0">Inactief</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{u.department || "Geen afdeling"}</span>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground">{permCount} module{permCount !== 1 ? "s" : ""} toegang</span>
                      </div>
                      {(u.permissions?.length || 0) > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {u.permissions?.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => { setPasfotoUserId(u.id); pasfotoInputRef.current?.click(); }} disabled={uploadPasfotoMutation.isPending && pasfotoUserId === u.id} data-testid={`button-pasfoto-${u.id}`}>
                        <Camera className="h-4 w-4 mr-1" />Pasfoto
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setResetUser(u)} data-testid={`button-reset-pw-${u.id}`}>
                        <KeyRound className="h-4 w-4 mr-1" />Wachtwoord
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditUser(u)} data-testid={`button-edit-perms-${u.id}`}>
                        <Shield className="h-4 w-4 mr-1" />Rechten
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Inlogpagina Achtergrondafbeelding</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
              <img
                src={loginPhoto?.value || "/uploads/App_pics/login.png"}
                alt="Inlogpagina achtergrond"
                className="w-full h-full object-cover"
                data-testid="img-login-photo-preview"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deze afbeelding wordt getoond als achtergrond op de inlogpagina. Wordt opgeslagen als <code className="text-xs bg-muted px-1 rounded">uploads/App_pics/login.png</code>.</p>
              <input ref={loginPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLoginPhotoMutation.mutate(f); }} data-testid="input-login-photo" />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => loginPhotoInputRef.current?.click()} disabled={uploadLoginPhotoMutation.isPending} data-testid="button-change-login-photo">
                <Camera className="h-4 w-4" />
                {uploadLoginPhotoMutation.isPending ? "Uploaden..." : "Foto wijzigen"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Rapporten Pagina Achtergrondafbeelding</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
              <img
                src={rapportenPhoto?.value || "/uploads/App_pics/rapporten.png"}
                alt="Rapporten achtergrond"
                className="w-full h-full object-cover"
                data-testid="img-rapporten-photo-preview"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deze afbeelding wordt getoond als hero-achtergrond op de Rapporten pagina.</p>
              <input
                ref={rapportenPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRapportenPhotoMutation.mutate(f); }}
                data-testid="input-rapporten-photo"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => rapportenPhotoInputRef.current?.click()}
                disabled={uploadRapportenPhotoMutation.isPending}
                data-testid="button-change-rapporten-photo"
              >
                <Camera className="h-4 w-4" />
                {uploadRapportenPhotoMutation.isPending ? "Uploaden..." : "Foto wijzigen"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Productie Pagina Achtergrondafbeelding</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
              <img
                src={productiePhoto?.value || "/uploads/App_pics/productie.png"}
                alt="Productie achtergrond"
                className="w-full h-full object-cover"
                data-testid="img-productie-photo-preview"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deze afbeelding wordt getoond als hero-achtergrond op de Productie pagina. Wordt opgeslagen als <code className="text-xs bg-muted px-1 rounded">uploads/App_pics/productie.png</code>.</p>
              <input
                ref={productiePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductiePhotoMutation.mutate(f); }}
                data-testid="input-productie-photo"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => productiePhotoInputRef.current?.click()}
                disabled={uploadProductiePhotoMutation.isPending}
                data-testid="button-change-productie-photo"
              >
                <Camera className="h-4 w-4" />
                {uploadProductiePhotoMutation.isPending ? "Uploaden..." : "Foto wijzigen"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Onderhoud Afdelingen ────────────────────────────────────────────────

function AfdelingenTab() {
  const [open, setOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: departments, isLoading } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const form = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof departmentFormSchema>) => {
      await apiRequest("POST", "/api/departments", { ...data, description: data.description || null, managerId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Afdeling aangemaakt" });
      setOpen(false); form.reset();
    },
    onError: () => { toast({ title: "Fout bij aanmaken", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/departments/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Afdeling verwijderd" });
    },
  });

  const editForm = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const editMutation = useMutation({
    mutationFn: async (data: z.infer<typeof departmentFormSchema> & { id: string }) => {
      await apiRequest("PATCH", `/api/departments/${data.id}`, { name: data.name, description: data.description || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Afdeling bijgewerkt" });
      setEditDept(null);
    },
    onError: () => { toast({ title: "Fout bij bijwerken", variant: "destructive" }); },
  });

  const openEdit = (dept: Department) => {
    editForm.reset({ name: dept.name, description: dept.description || "" });
    setEditDept(dept);
  };

  const getMemberCount = (deptName: string) => users?.filter((u) => u.department === deptName).length || 0;
  const getManager = (managerId: string | null) => {
    if (!managerId || !users) return null;
    return users.find((u) => u.id === managerId);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdminRole(user?.role) && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-department">
                <Plus className="h-4 w-4 mr-2" />Nieuwe Afdeling
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nieuwe Afdeling</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl><Input {...field} data-testid="input-department-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl><Textarea {...field} data-testid="input-department-description" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-department">
                    {createMutation.isPending ? "Opslaan..." : "Afdeling Opslaan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {(!departments || departments.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen afdelingen gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const memberCount = getMemberCount(dept.name);
            const manager = getManager(dept.managerId);
            return (
              <Card key={dept.id} className="hover-elevate">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm" data-testid={`text-department-${dept.id}`}>{dept.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Users className="h-3 w-3" />
                          {memberCount} {memberCount === 1 ? "medewerker" : "medewerkers"}
                        </div>
                      </div>
                    </div>
                    {isAdminRole(user?.role) && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(dept)} data-testid={`button-edit-department-${dept.id}`}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(dept.id)} data-testid={`button-delete-department-${dept.id}`}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{dept.description}</p>
                  )}
                  {manager && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Manager: <span className="font-medium text-foreground">{manager.fullName}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editDept} onOpenChange={(v) => { if (!v) setEditDept(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Afdeling Bewerken</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => editDept && editMutation.mutate({ ...d, id: editDept.id }))} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Naam</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-department-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl><Textarea {...field} data-testid="input-edit-department-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-submit-edit-department">
                {editMutation.isPending ? "Opslaan..." : "Wijzigingen Opslaan"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Onderhoud Functies ──────────────────────────────────────────────────

function FunctiesTab() {
  const [open, setOpen] = useState(false);
  const [editFunc, setEditFunc] = useState<JobFunction | null>(null);
  const [showRang, setShowRang] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: jobFunctionList, isLoading } = useQuery<JobFunction[]>({ queryKey: ["/api/job-functions"] });
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const form = useForm<z.infer<typeof jobFunctionFormSchema>>({
    resolver: zodResolver(jobFunctionFormSchema),
    defaultValues: { name: "", description: "", departmentId: "", beginSchaal: "", eindSchaal: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFunctionFormSchema>) => {
      await apiRequest("POST", "/api/job-functions", {
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId && data.departmentId !== "none" ? data.departmentId : null,
        sortOrder: 0,
        beginSchaal: data.beginSchaal || null,
        eindSchaal: data.eindSchaal || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-functions"] });
      toast({ title: "Functie aangemaakt" });
      setOpen(false); form.reset({ name: "", description: "", departmentId: "", beginSchaal: "", eindSchaal: "" });
    },
    onError: () => { toast({ title: "Fout bij aanmaken", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/job-functions/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-functions"] });
      toast({ title: "Functie verwijderd" });
    },
  });

  const editForm = useForm<z.infer<typeof jobFunctionFormSchema>>({
    resolver: zodResolver(jobFunctionFormSchema),
    defaultValues: { name: "", description: "", departmentId: "", beginSchaal: "", eindSchaal: "" },
  });

  const editMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFunctionFormSchema> & { id: string }) => {
      await apiRequest("PATCH", `/api/job-functions/${data.id}`, {
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId && data.departmentId !== "none" ? data.departmentId : null,
        beginSchaal: data.beginSchaal || null,
        eindSchaal: data.eindSchaal || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-functions"] });
      toast({ title: "Functie bijgewerkt" });
      setEditFunc(null);
    },
    onError: () => { toast({ title: "Fout bij bijwerken", variant: "destructive" }); },
  });

  const uploadDescriptionMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/job-functions/${id}/upload-description`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload mislukt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-functions"] });
      toast({ title: "Omschrijving geüpload" });
      setUploadingFor(null);
    },
    onError: () => { toast({ title: "Upload mislukt", variant: "destructive" }); setUploadingFor(null); },
  });

  const handleFileSelect = useCallback((funcId: string, file: File) => {
    setUploadingFor(funcId);
    uploadDescriptionMutation.mutate({ id: funcId, file });
  }, [uploadDescriptionMutation]);

  const openEdit = (func: JobFunction) => {
    editForm.reset({
      name: func.name,
      description: func.description || "",
      departmentId: func.departmentId || "",
      beginSchaal: func.beginSchaal != null ? String(func.beginSchaal) : "",
      eindSchaal: func.eindSchaal != null ? String(func.eindSchaal) : "",
    });
    setEditFunc(func);
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return null;
    return departments?.find((d) => d.id === deptId)?.name ?? null;
  };

  const existingNames = [...new Set(jobFunctionList?.map((f) => f.name) ?? [])];

  const grouped = (() => {
    if (!jobFunctionList) return [];
    const map = new Map<string | null, JobFunction[]>();
    for (const f of jobFunctionList) {
      const key = f.departmentId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    const result: { deptId: string | null; deptName: string; funcs: JobFunction[] }[] = [];
    map.forEach((funcs, deptId) => {
      const deptName = deptId ? (getDeptName(deptId) ?? "Onbekende Afdeling") : "Geen Afdeling";
      result.push({ deptId, deptName, funcs: [...funcs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) });
    });
    result.sort((a, b) => {
      if (a.deptId === null) return 1;
      if (b.deptId === null) return -1;
      return a.deptName.localeCompare(b.deptName);
    });
    return result;
  })();

  const functionFormContent = (control: any, testPrefix: string) => (
    <>
      <FormField control={control} name="departmentId" render={({ field }) => (
        <FormItem>
          <FormLabel>Afdeling</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger data-testid={`${testPrefix}-dept`}><SelectValue placeholder="Selecteer afdeling" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">— Geen afdeling —</SelectItem>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Naam</FormLabel>
          <FormControl>
            <Input
              {...field}
              list="functies-datalist"
              placeholder="Kies bestaande functie of typ nieuwe naam"
              data-testid={`${testPrefix}-name`}
            />
          </FormControl>
          <datalist id="functies-datalist">
            {existingNames.map((n) => <option key={n} value={n} />)}
          </datalist>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="beginSchaal" render={({ field }) => (
          <FormItem>
            <FormLabel>Begin schaal</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="bijv. 2500" data-testid={`${testPrefix}-begin-schaal`} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={control} name="eindSchaal" render={({ field }) => (
          <FormItem>
            <FormLabel>Eind schaal</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="bijv. 4000" data-testid={`${testPrefix}-eind-schaal`} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>Omschrijving (optioneel)</FormLabel>
          <FormControl><Textarea {...field} rows={3} placeholder="Beschrijf de functie..." data-testid={`${testPrefix}-desc`} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          Beheer functies per afdeling. Functies zijn beschikbaar als keuzelijst in Personalia.
          Upload een omschrijvingsdocument per functie en gebruik <strong>Rang</strong> om de volgorde in het Organogram in te stellen.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setShowRang(true)} data-testid="button-rang">
            <ListOrdered className="h-4 w-4 mr-2" />Rang
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-job-function">
                <Plus className="h-4 w-4 mr-2" />Functie Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Onderhoud Functies – Toevoegen</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  {functionFormContent(form.control, "input-job-function")}
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-job-function">
                    {createMutation.isPending ? "Opslaan..." : "Functie Opslaan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen functies gevonden</p>
            <p className="text-sm text-muted-foreground mt-1">Klik op "Functie Toevoegen" om te beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ deptId, deptName, funcs }) => (
            <div key={deptId ?? "none"}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{deptName}</h3>
                <Badge variant="outline" className="text-xs">{funcs.length} {funcs.length === 1 ? "functie" : "functies"}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {funcs.map((func) => (
                  <Card key={func.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" data-testid={`text-job-function-${func.id}`}>{func.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Omschrijving uploaden"
                            onClick={() => { setUploadingFor(func.id); fileInputRef.current?.click(); }}
                            disabled={uploadingFor === func.id}
                            data-testid={`button-upload-func-${func.id}`}
                          >
                            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(func)} data-testid={`button-edit-job-function-${func.id}`}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(func.id)} data-testid={`button-delete-job-function-${func.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      {(func.beginSchaal != null || func.eindSchaal != null) && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <span className="font-medium text-foreground/70">Schaal:</span>
                          {func.beginSchaal != null ? new Intl.NumberFormat("nl-NL").format(func.beginSchaal) : "—"}
                          {" – "}
                          {func.eindSchaal != null ? new Intl.NumberFormat("nl-NL").format(func.eindSchaal) : "—"}
                        </p>
                      )}
                      {func.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{func.description}</p>
                      )}
                      {func.descriptionFilePath && (
                        <a
                          href={func.descriptionFilePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                          data-testid={`link-func-desc-${func.id}`}
                        >
                          <FileText className="h-3 w-3" />
                          Omschrijving bekijken
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingFor) handleFileSelect(uploadingFor, file);
          e.target.value = "";
        }}
        data-testid="input-func-desc-file"
      />

      <Dialog open={!!editFunc} onOpenChange={(v) => { if (!v) setEditFunc(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Onderhoud Functies – Bewerken</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => editFunc && editMutation.mutate({ ...d, id: editFunc.id }))} className="space-y-4">
              {functionFormContent(editForm.control, "input-edit-job-function")}
              <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-submit-edit-job-function">
                {editMutation.isPending ? "Opslaan..." : "Wijzigingen Opslaan"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <RangDialog
        open={showRang}
        onOpenChange={setShowRang}
        departments={departments}
        jobFunctionList={jobFunctionList}
      />
    </div>
  );
}

// ─── Rang Dialog ──────────────────────────────────────────────────────────────

function RangDialog({
  open,
  onOpenChange,
  departments,
  jobFunctionList,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: Department[] | undefined;
  jobFunctionList: JobFunction[] | undefined;
}) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [localOrder, setLocalOrder] = useState<JobFunction[]>([]);
  const { toast } = useToast();
  const { data: users } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  const deptFunctions = jobFunctionList?.filter((f) => f.departmentId === (selectedDeptId || null)) ?? [];

  useEffect(() => {
    setLocalOrder([...deptFunctions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
  }, [selectedDeptId, jobFunctionList]);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...localOrder];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLocalOrder(next);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = localOrder.map((f, i) => ({ id: f.id, sortOrder: i }));
      await apiRequest("PATCH", "/api/job-functions/bulk-sort-order", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-functions"] });
      toast({ title: "Rangvolgorde opgeslagen" });
      onOpenChange(false);
    },
    onError: () => { toast({ title: "Fout bij opslaan", variant: "destructive" }); },
  });

  const activeUsers = users?.filter((u) => u.active !== false) ?? [];
  const getUsersForFunc = (funcName: string) =>
    activeUsers.filter((u) => u.department === (departments?.find((d) => d.id === selectedDeptId)?.name) && u.functie === funcName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Rangvolgorde instellen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Afdeling</label>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger data-testid="select-rang-dept"><SelectValue placeholder="Selecteer afdeling" /></SelectTrigger>
              <SelectContent>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDeptId && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Gebruik de pijlen om de volgorde van functies (en het personeel) in het Organogram aan te passen.
              </p>
              {localOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">Geen functies voor deze afdeling</p>
              ) : (
                <div className="space-y-1">
                  {localOrder.map((func, i) => {
                    const funcUsers = getUsersForFunc(func.name);
                    return (
                      <div key={func.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30" data-testid={`rang-row-${func.id}`}>
                        <span className="text-xs text-muted-foreground w-5 text-center font-mono">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{func.name}</p>
                          {funcUsers.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {funcUsers.map((u) => u.fullName).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0} data-testid={`button-rang-up-${func.id}`}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === localOrder.length - 1} data-testid={`button-rang-down-${func.id}`}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={!selectedDeptId || saveMutation.isPending}
              data-testid="button-save-rang"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Opslaan..." : "Rangvolgorde Opslaan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Prikklok Koppeling Tab ───────────────────────────────────────────────────

interface PrikklokRow {
  userid: string;
  name: string;
}

function PrikklokOverzichtTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prikklokRows, setPrikklokRows] = useState<PrikklokRow[]>([]);
  const [search, setSearch] = useState("");

  const { data: allUsers = [] } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  const kadasterMap = useMemo(() => {
    const m: Record<string, SafeUser> = {};
    for (const u of allUsers as any[]) {
      if (u.kadasterId) m[u.kadasterId] = u as SafeUser;
    }
    return m;
  }, [allUsers]);

  function parseCSV(text: string): PrikklokRow[] {
    const clean = text.replace(/^\uFEFF/, "");
    const lines = clean.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const firstLine = lines[0];
    const sep = firstLine.includes("\t") ? "\t"
              : firstLine.includes(";")  ? ";"
              : ",";
    const headers = firstLine.split(sep).map((h) => h.trim().toLowerCase().replace(/['"]/g, "").replace(/^\uFEFF/, ""));
    const useridIdx = headers.findIndex((h) => ["userid", "pin", "id", "user_id", "personeelsnr"].includes(h));
    const nameIdx   = headers.findIndex((h) => ["name", "naam", "fullname", "full_name", "volledige naam"].includes(h));
    if (useridIdx === -1) return [];
    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        return { userid: cols[useridIdx] || "", name: nameIdx >= 0 ? cols[nameIdx] || "" : "" };
      })
      .filter((r) => r.userid);
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setPrikklokRows(rows);
      if (rows.length === 0) {
        toast({
          title: "Geen geldige rijen gevonden",
          description: "Controleer of het bestand een userid-kolom bevat. Ondersteunde separatoren: tab, puntkomma of komma.",
          variant: "destructive",
        });
      } else {
        toast({ title: `${rows.length} medewerkers ingelezen uit prikklok CSV` });
      }
    };
    reader.readAsText(file, "utf-8");
  }

  const gevondenCount   = prikklokRows.filter((r) => kadasterMap[r.userid]).length;
  const nietGevondenCount = prikklokRows.length - gevondenCount;

  const displayedRows = useMemo(() => {
    if (!search.trim()) return prikklokRows;
    const q = search.trim().toLowerCase();
    return prikklokRows.filter((r) => r.userid.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [prikklokRows, search]);

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader className="pb-3">
          <p className="font-semibold text-sm">Prikklok medewerkers inlezen</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload een CSV-medewerkerexport van het prikklok-systeem om te controleren welke userids bekend zijn in de applicatie.
            De userid wordt toegekend via <strong>Personalia → Nieuwe Medewerker</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-prikklok-csv"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">Sleep een CSV-bestand hierheen of klik om te uploaden</p>
            <p className="text-xs text-muted-foreground mt-1">
              Prikklok gebruikersexport — <strong>userid</strong> en <strong>Name</strong> worden ingelezen
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            data-testid="input-prikklok-csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          {prikklokRows.length > 0 && (
            <div className="flex gap-3 text-xs text-center">
              <div className="flex-1 rounded-lg bg-muted/50 py-2">
                <div className="font-semibold text-base">{prikklokRows.length}</div>
                <div className="text-muted-foreground">Ingelezen</div>
              </div>
              <div className="flex-1 rounded-lg bg-green-50 dark:bg-green-950/20 py-2">
                <div className="font-semibold text-base text-green-700 dark:text-green-400">{gevondenCount}</div>
                <div className="text-muted-foreground">Gevonden</div>
              </div>
              <div className="flex-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 py-2">
                <div className="font-semibold text-base text-amber-700 dark:text-amber-400">{nietGevondenCount}</div>
                <div className="text-muted-foreground">Niet gevonden</div>
              </div>
            </div>
          )}

          {/* CSV formaat uitleg */}
          <div className="rounded-lg bg-muted/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prikklok CSV-exportformaat (medewerkers)</p>
            <p className="text-xs text-muted-foreground">
              De prikklok exporteert een CSV met de onderstaande kolommen. Alleen{" "}
              <span className="font-semibold text-foreground bg-primary/10 px-1 rounded">userid</span> en{" "}
              <span className="font-semibold text-foreground bg-primary/10 px-1 rounded">Name</span>{" "}
              worden door de app ingelezen — alle overige kolommen worden genegeerd.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { name: "userid",      used: true  },
                { name: "UserCode",    used: false },
                { name: "Name",        used: true  },
                { name: "Sex",         used: false },
                { name: "Pwd",         used: false },
                { name: "Deptid",      used: false },
                { name: "Nation",      used: false },
                { name: "Birthday",    used: false },
                { name: "EmployDate",  used: false },
                { name: "Telephone",   used: false },
                { name: "Duty",        used: false },
                { name: "NativePlace", used: false },
                { name: "IDCard",      used: false },
                { name: "Address",     used: false },
                { name: "Mobile",      used: false },
                { name: "Educated",    used: false },
                { name: "Polity",      used: false },
                { name: "Specialty",   used: false },
                { name: "IsAtt",       used: false },
                { name: "Isovertime",  used: false },
                { name: "Isrest",      used: false },
                { name: "Remark",      used: false },
                { name: "MgFlag",      used: false },
                { name: "Cardnum",     used: false },
                { name: "Picture",     used: false },
                { name: "UserFlag",    used: false },
                { name: "Groupid",     used: false },
                { name: "ClassFlag",   used: false },
                { name: "OtherInfo",   used: false },
                { name: "Machineid",   used: false },
                { name: "Rate",        used: false },
                { name: "Desempeño",   used: false },
                { name: "Empleado",    used: false },
                { name: "MOT",         used: false },
                { name: "Salary",      used: false },
                { name: "IsSalary",    used: false },
                { name: "SalaryRule",  used: false },
                { name: "QBJob",       used: false },
                { name: "admingroupid",used: false },
              ].map((col) => (
                <span
                  key={col.name}
                  className={`px-2 py-0.5 rounded font-mono ${
                    col.used
                      ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {col.name}
                  {col.used && <span className="ml-1 text-[10px] opacity-75">✓</span>}
                </span>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Voorbeeld data-rij (verkorte weergave):</p>
              <code className="block bg-background border rounded p-2 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-nowrap">
                <span className="text-primary font-bold">001</span>,,<span className="text-primary font-bold">Jan Janssen</span>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Separator: tab (standaard prikklok-export), komma (,) of puntkomma (;) · Automatisch gedetecteerd
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overzicht tabel */}
      {prikklokRows.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <p className="font-semibold text-sm">Overzicht prikklok medewerkers</p>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <Input
                placeholder="Zoek op ID of naam…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-52 h-8 text-sm"
                data-testid="input-search-prikklok"
              />
              <span className="text-xs text-muted-foreground ml-auto">{displayedRows.length} rijen</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-28">Prikklok ID</TableHead>
                  <TableHead>Naam (prikklok)</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="pr-4">App-medewerker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRows.map((row) => {
                  const gevonden = kadasterMap[row.userid] as any;
                  return (
                    <TableRow key={row.userid} data-testid={`row-prikklok-${row.userid}`}>
                      <TableCell className="pl-4 font-mono text-sm font-medium">{row.userid}</TableCell>
                      <TableCell className="text-sm">{row.name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {gevonden ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Gevonden
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1 text-amber-500" />
                            Niet gevonden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        {gevonden
                          ? <span className="text-sm font-medium">{gevonden.fullName || gevonden.username}</span>
                          : <span className="text-xs text-muted-foreground italic">Stel userid in via Personalia</span>
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {displayedRows.length === 0 && (
              <div className="py-10 text-center text-muted-foreground text-sm">
                Geen rijen gevonden
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BeheerPage() {
  const [activeTab, setActiveTab] = useState("rechten");

  const tabs = [
    { key: "rechten", label: "Rechten", icon: Shield },
    { key: "afdelingen", label: "Onderhoud Afdelingen", icon: Building2 },
    { key: "functies", label: "Onderhoud Functies", icon: Briefcase },
    { key: "prikklok", label: "Prikklok", icon: Users },
  ];

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Beheer"
        subtitle="Beheer gebruikersrechten, afdelingen en functies"
        imageSrc="/uploads/App_pics/beheer.png"
        imageAlt="beheer"
      />
      <div className="p-6 space-y-6">
        <div className="flex gap-1 border-b overflow-x-auto" data-testid="tabs-beheer">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab.key}`}
              >
                <Icon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activeTab === "rechten" && <RechtenTab />}
          {activeTab === "afdelingen" && <AfdelingenTab />}
          {activeTab === "functies" && <FunctiesTab />}
          {activeTab === "prikklok" && <PrikklokOverzichtTab />}
        </div>
      </div>
    </div>
  );
}
