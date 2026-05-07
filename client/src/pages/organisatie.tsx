import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus, Building2, Users, Trash2, FileText, ExternalLink, Upload,
  BookOpen, Network, Scale, ChevronRight, ClipboardList, FolderOpen,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Department, User, AoProcedure, AoInstruction, LegislationLink, CaoDocument, JobFunction } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";

const procedureFormSchema = z.object({
  departmentId: z.string().min(1, "Afdeling is verplicht"),
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().optional(),
});

const instructionFormSchema = z.object({
  procedureId: z.string().min(1),
  title: z.string().min(1, "Titel is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht"),
  sortOrder: z.number().int().min(0),
});

const legislationFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  url: z.string().optional().default(""),
  description: z.string().optional(),
  category: z.string().min(1, "Categorie is verplicht"),
});

function AoProceduresTab() {
  const [procOpen, setProcOpen] = useState(false);
  const [instrOpen, setInstrOpen] = useState(false);
  const [selectedProcId, setSelectedProcId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: procedures, isLoading } = useQuery<(AoProcedure & { departmentName?: string })[]>({
    queryKey: ["/api/ao-procedures"],
  });

  const procForm = useForm<z.infer<typeof procedureFormSchema>>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: { departmentId: "", title: "", description: "" },
  });

  const instrForm = useForm<z.infer<typeof instructionFormSchema>>({
    resolver: zodResolver(instructionFormSchema),
    defaultValues: { procedureId: "", title: "", content: "", sortOrder: 0 },
  });

  const createProcMutation = useMutation({
    mutationFn: async (data: z.infer<typeof procedureFormSchema>) => {
      await apiRequest("POST", "/api/ao-procedures", {
        ...data,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ao-procedures"] });
      toast({ title: "Procedure aangemaakt" });
      setProcOpen(false);
      procForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij aanmaken", variant: "destructive" });
    },
  });

  const deleteProcMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ao-procedures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ao-procedures"] });
      toast({ title: "Procedure verwijderd" });
    },
  });

  const createInstrMutation = useMutation({
    mutationFn: async (data: z.infer<typeof instructionFormSchema>) => {
      await apiRequest("POST", "/api/ao-instructions", data);
    },
    onSuccess: () => {
      if (selectedProcId) {
        queryClient.invalidateQueries({ queryKey: ["/api/ao-instructions", selectedProcId] });
      }
      toast({ title: "Instructie toegevoegd" });
      setInstrOpen(false);
      instrForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij aanmaken", variant: "destructive" });
    },
  });

  const deleteInstrMutation = useMutation({
    mutationFn: async ({ id, procedureId }: { id: string; procedureId: string }) => {
      await apiRequest("DELETE", `/api/ao-instructions/${id}`);
      return procedureId;
    },
    onSuccess: (procedureId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ao-instructions", procedureId] });
      toast({ title: "Instructie verwijderd" });
    },
  });

  const filteredProcedures = isAdmin
    ? procedures
    : procedures?.filter((proc) => proc.departmentName === user?.department);

  const groupedByDept = filteredProcedures?.reduce((acc, proc) => {
    const key = proc.departmentName || "Onbekend";
    if (!acc[key]) acc[key] = [];
    acc[key].push(proc);
    return acc;
  }, {} as Record<string, typeof procedures>) || {};

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Procedures ({filteredProcedures?.length || 0})
          </CardTitle>
        </CardHeader>
      </Card>

      {isAdmin && (
        <div className="flex gap-2 justify-end flex-wrap">
          <Dialog open={procOpen} onOpenChange={setProcOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-procedure">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Procedure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe AO-Procedure</DialogTitle>
              </DialogHeader>
              <Form {...procForm}>
                <form onSubmit={procForm.handleSubmit((d) => createProcMutation.mutate(d))} className="space-y-4">
                  <FormField control={procForm.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Afdeling</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-procedure-department">
                            <SelectValue placeholder="Selecteer afdeling" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={procForm.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel</FormLabel>
                      <FormControl><Input {...field} data-testid="input-procedure-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={procForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl><Textarea {...field} data-testid="input-procedure-description" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createProcMutation.isPending} data-testid="button-submit-procedure">
                    {createProcMutation.isPending ? "Opslaan..." : "Procedure Opslaan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {Object.keys(groupedByDept).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen AO-procedures gevonden</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDept).sort(([a], [b]) => a.localeCompare(b)).map(([deptName, procs]) => (
          <Card key={deptName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {deptName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {(procs ?? []).map((proc) => (
                  <AccordionItem key={proc.id} value={proc.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-medium text-sm" data-testid={`text-procedure-${proc.id}`}>{proc.title}</span>
                          {proc.description && (
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">{proc.description}</p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProcedureInstructions
                        procedureId={proc.id}
                        isAdmin={isAdmin}
                        onAddInstruction={() => {
                          setSelectedProcId(proc.id);
                          instrForm.setValue("procedureId", proc.id);
                          setInstrOpen(true);
                        }}
                        onDeleteInstruction={(instrId) => deleteInstrMutation.mutate({ id: instrId, procedureId: proc.id })}
                      />
                      {isAdmin && (
                        <div className="mt-3 pt-3 border-t flex justify-end">
                          <Button variant="destructive" size="sm" onClick={() => deleteProcMutation.mutate(proc.id)} data-testid={`button-delete-procedure-${proc.id}`}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Procedure Verwijderen
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={instrOpen} onOpenChange={setInstrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Instructie</DialogTitle>
          </DialogHeader>
          <Form {...instrForm}>
            <form onSubmit={instrForm.handleSubmit((d) => createInstrMutation.mutate(d))} className="space-y-4">
              <FormField control={instrForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl><Input {...field} data-testid="input-instruction-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={instrForm.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inhoud</FormLabel>
                  <FormControl><Textarea {...field} data-testid="input-instruction-content" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={instrForm.control} name="sortOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel>Volgorde</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-instruction-order"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createInstrMutation.isPending} data-testid="button-submit-instruction">
                {createInstrMutation.isPending ? "Opslaan..." : "Instructie Opslaan"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProcedureInstructions({
  procedureId,
  isAdmin,
  onAddInstruction,
  onDeleteInstruction,
}: {
  procedureId: string;
  isAdmin: boolean;
  onAddInstruction: () => void;
  onDeleteInstruction: (id: string) => void;
}) {
  const { data: instructions, isLoading } = useQuery<AoInstruction[]>({
    queryKey: ["/api/ao-instructions", procedureId],
    queryFn: async () => {
      const res = await fetch(`/api/ao-instructions/${procedureId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-16" />;

  return (
    <div className="space-y-2 pl-2">
      {(!instructions || instructions.length === 0) ? (
        <p className="text-sm text-muted-foreground italic">Geen instructies toegevoegd</p>
      ) : (
        instructions.map((instr, idx) => (
          <div key={instr.id} className="flex items-start gap-3 group" data-testid={`instruction-${instr.id}`}>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{instr.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{instr.content}</p>
            </div>
            {isAdmin && (
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDeleteInstruction(instr.id)}
                title="Stap verwijderen"
                data-testid={`button-delete-instruction-${instr.id}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        ))
      )}
      {isAdmin && (
        <Button variant="outline" size="sm" onClick={onAddInstruction} className="mt-2" data-testid="button-add-instruction">
          <Plus className="h-3 w-3 mr-1" />
          Instructie Toevoegen
        </Button>
      )}
    </div>
  );
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

function OrganogramTab() {
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: jobFunctionList } = useQuery<JobFunction[]>({
    queryKey: ["/api/job-functions"],
  });

  if (!departments || !users) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  const activeUsers = users.filter((u) => u.active !== false && u.role !== "tijdelijk");
  const directeur = activeUsers.find((u) => u.role === "directeur" || (isAdminRole(u.role) && u.username === "directeur"));
  const deptManagerIds = new Set(departments.map((d) => d.managerId).filter(Boolean));
  const stafAdmins = activeUsers.filter((u) => isAdminRole(u.role) && u.role !== "directeur" && u.username !== "directeur" && !deptManagerIds.has(u.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <Card className="w-full max-w-sm">
          <CardContent className="p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2">
              <Network className="h-6 w-6" />
            </div>
            <h3 className="font-semibold" data-testid="text-organogram-directie">Directie & Staf</h3>
            <div className="mt-2 space-y-1">
              {directeur && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{formatNaamMetTitels(directeur)}</span>
                    <Badge variant="default" className="text-xs">directeur</Badge>
                  </div>
                  <span className="text-xs font-mono w-10 text-right">{directeur.phoneExtension || ""}</span>
                </div>
              )}
              {stafAdmins.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>{formatNaamMetTitels(u)}</span>
                    <Badge variant="secondary" className="text-xs">admin</Badge>
                  </div>
                  <span className="text-xs font-mono w-10 text-right">{u.phoneExtension || ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {departments.filter((d) => d.name !== "Directie" && d.name !== "Directie & Staf").map((dept) => {
          const manager = dept.managerId ? activeUsers.find((u) => u.id === dept.managerId) : null;
          const rawMembers = activeUsers.filter((u) => u.department === dept.name && u.id !== dept.managerId);
          const getFuncSortOrder = (functie: string | null) => {
            if (!functie || !jobFunctionList) return 9999;
            // Match by name AND department for accurate sort order
            const jf = jobFunctionList.find((f) => f.name === functie && f.departmentId === dept.id)
              ?? jobFunctionList.find((f) => f.name === functie);
            return jf?.sortOrder ?? 9999;
          };
          const isManagerFunctie = (functie: string | null) =>
            !!functie && (/manager/i.test(functie) || /bewaarder/i.test(functie));

          const sortedMembers = [...rawMembers].sort((a, b) => {
            const orderDiff = getFuncSortOrder(a.functie ?? null) - getFuncSortOrder(b.functie ?? null);
            if (orderDiff !== 0) return orderDiff;
            return formatNaamMetTitels(a).localeCompare(formatNaamMetTitels(b), "nl");
          });

          const managerMembers = sortedMembers.filter((m) => isManagerFunctie(m.functie ?? null));
          const regularMembers = sortedMembers.filter((m) => !isManagerFunctie(m.functie ?? null));

          const hasManagerBlock = !!manager || managerMembers.length > 0;
          const hasRegularBlock = regularMembers.length > 0;

          return (
            <Card key={dept.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm" data-testid={`text-organogram-dept-${dept.id}`}>{dept.name}</h4>
                </div>

                {hasManagerBlock && (
                  <div className={`space-y-1 ${hasRegularBlock ? "mb-2 pb-2 border-b" : ""}`}>
                    {manager && (
                      <div>
                        <p className="text-xs text-muted-foreground">Manager</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formatNaamMetTitels(manager)}</p>
                          <span className="text-xs font-mono w-10 text-right text-muted-foreground">{manager.phoneExtension || ""}</span>
                        </div>
                      </div>
                    )}
                    {managerMembers.map((m) => (
                      <div key={m.id}>
                        <p className="text-xs text-muted-foreground">{m.functie}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formatNaamMetTitels(m)}</p>
                          <span className="text-xs font-mono w-10 text-right text-muted-foreground">{m.phoneExtension || ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  {regularMembers.map((m) => (
                    <div key={m.id} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                        <div>
                          <span className="text-sm text-muted-foreground">{formatNaamMetTitels(m)}</span>
                          {m.functie && (
                            <p className="text-xs text-muted-foreground/70 leading-tight">{m.functie}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono w-10 text-right text-muted-foreground shrink-0">{m.phoneExtension || ""}</span>
                    </div>
                  ))}
                  {!hasManagerBlock && !hasRegularBlock && (
                    <p className="text-xs text-muted-foreground italic">Geen medewerkers</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CaoInfoTab() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  type CaoFile = { name: string; path: string; size: number; modified: string };

  const { data: caoFiles, isLoading } = useQuery<CaoFile[]>({
    queryKey: ["/api/uploads/cao"],
  });

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF-bestanden toegestaan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/uploads/cao", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/cao"] });
      toast({ title: "CAO document toegevoegd" });
    } catch {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/uploads/cao/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/cao"] });
      toast({ title: "CAO document verwijderd" });
    } catch {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Documenten ({caoFiles?.length || 0})
            </CardTitle>
            {isAdmin && (
              <>
                <Button
                  onClick={() => document.getElementById("cao-upload-input")?.click()}
                  disabled={uploading}
                  data-testid="button-add-cao-doc"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploaden..." : "Nieuw Document"}
                </Button>
                <input
                  id="cao-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                  data-testid="input-cao-upload"
                />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1" data-testid="text-cao-title">Collectieve Arbeidsovereenkomst</h4>
            <p className="text-sm text-muted-foreground">
              De CAO regelt de arbeidsvoorwaarden voor alle medewerkers. Hieronder vindt u de beschikbare CAO documenten.
            </p>
          </div>

          {!caoFiles || caoFiles.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Geen CAO documenten gevonden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {caoFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md group hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => window.open(file.path, "_blank")}
                  data-testid={`cao-file-${file.name}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name.replace(/\.pdf$/i, "")}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 invisible group-hover:visible"
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                      data-testid={`button-delete-cao-${file.name}`}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InstructiesTab() {
  const [uploading, setUploading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  type InstructieFile = { name: string; path: string; size: number; modified: string };

  const { data: instructies, isLoading } = useQuery<Record<string, InstructieFile[]>>({
    queryKey: ["/api/uploads/instructies"],
  });

  const handleUpload = async (dept: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF-bestanden toegestaan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch(`/api/uploads/instructies/${encodeURIComponent(dept)}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/instructies"] });
      toast({ title: "Instructie document toegevoegd" });
    } catch {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (dept: string, filename: string) => {
    try {
      const res = await fetch(`/api/uploads/instructies/${encodeURIComponent(dept)}/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/instructies"] });
      toast({ title: "Instructie document verwijderd" });
    } catch {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  const deptNames = instructies ? Object.keys(instructies).sort() : [];
  const totalInstructies = instructies ? Object.values(instructies).reduce((sum, files) => sum + files.length, 0) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            Documenten ({totalInstructies})
          </CardTitle>
        </CardHeader>
      </Card>

      {isAdmin && (
        <div className="flex items-center gap-3 justify-end">
          <Select value={selectedDept || ""} onValueChange={(v) => setSelectedDept(v)}>
            <SelectTrigger className="w-[220px]" data-testid="select-instructie-dept">
              <SelectValue placeholder="Kies afdeling..." />
            </SelectTrigger>
            <SelectContent>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.name} data-testid={`option-dept-${d.id}`}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (!selectedDept) {
                toast({ title: "Selecteer eerst een afdeling", variant: "destructive" });
                return;
              }
              document.getElementById("instructie-upload-input")?.click();
            }}
            disabled={uploading || !selectedDept}
            data-testid="button-add-instructie"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploaden..." : "Nieuw Document"}
          </Button>
          <input
            id="instructie-upload-input"
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && selectedDept) handleUpload(selectedDept, file);
              e.target.value = "";
            }}
            data-testid="input-instructie-upload"
          />
        </div>
      )}

      {deptNames.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen instructie documenten gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={deptNames} className="w-full">
          {deptNames.map((dept) => {
            const files = instructies![dept] || [];
            return (
              <AccordionItem key={dept} value={dept}>
                <AccordionTrigger className="hover:no-underline" data-testid={`instructie-dept-${dept}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-left">{dept}</span>
                    {files.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{files.length}</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-11 space-y-2">
                    {files.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Geen documenten</p>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-md group hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => window.open(file.path, "_blank")}
                          data-testid={`instructie-file-${file.name}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name.replace(/\.pdf$/i, "")}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 invisible group-hover:visible"
                              onClick={(e) => { e.stopPropagation(); handleDelete(dept, file.name); }}
                              data-testid={`button-delete-instructie-${file.name}`}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

function WetgevingTab() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  type WetgevingFile = { name: string; path: string; size: number; modified: string };

  const { data: files, isLoading } = useQuery<WetgevingFile[]>({
    queryKey: ["/api/uploads/wetgeving"],
  });

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF-bestanden toegestaan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/uploads/wetgeving", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/wetgeving"] });
      toast({ title: "Document toegevoegd" });
    } catch {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/uploads/wetgeving/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/wetgeving"] });
      toast({ title: "Document verwijderd" });
    } catch {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={() => document.getElementById("wetgeving-upload-input")?.click()}
            disabled={uploading}
            data-testid="button-add-legislation"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploaden..." : "Nieuw Document"}
          </Button>
          <input
            id="wetgeving-upload-input"
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
            data-testid="input-wetgeving-upload"
          />
        </div>
      )}

      {!files || files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen wetgeving documenten gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Documenten ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md group hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => window.open(file.path, "_blank")}
                  data-testid={`legislation-file-${file.name}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`link-legislation-${file.name}`}>
                        {file.name.replace(/\.pdf$/i, "")}
                      </p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 invisible group-hover:visible"
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                      data-testid={`button-delete-legislation-${file.name}`}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HuishoudelijkReglementTab() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  type HuishoudelijkFile = { name: string; path: string; size: number; modified: string };

  const { data: files, isLoading } = useQuery<HuishoudelijkFile[]>({
    queryKey: ["/api/uploads/huishoudelijkreglement"],
  });

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF-bestanden toegestaan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/uploads/huishoudelijkreglement", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/huishoudelijkreglement"] });
      toast({ title: "Document toegevoegd" });
    } catch {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/uploads/huishoudelijkreglement/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/huishoudelijkreglement"] });
      toast({ title: "Document verwijderd" });
    } catch {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={() => document.getElementById("huishoudelijk-upload-input")?.click()}
            disabled={uploading}
            data-testid="button-add-huishoudelijk"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploaden..." : "Nieuw Document"}
          </Button>
          <input
            id="huishoudelijk-upload-input"
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
            data-testid="input-huishoudelijk-upload"
          />
        </div>
      )}

      {!files || files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen huishoudelijk reglement documenten gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documenten ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md group hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => window.open(file.path, "_blank")}
                  data-testid={`huishoudelijk-file-${file.name}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`link-huishoudelijk-${file.name}`}>
                        {file.name.replace(/\.pdf$/i, "")}
                      </p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 invisible group-hover:visible"
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                      data-testid={`button-delete-huishoudelijk-${file.name}`}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FunctieBeschrijvingTab() {
  const { user } = useAuth();

  const { data: jobFunctionList, isLoading: loadingFunctions } = useQuery<JobFunction[]>({
    queryKey: ["/api/job-functions"],
  });

  const { data: departments, isLoading: loadingDepts } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  if (loadingFunctions || loadingDepts) {
    return <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  const userFunctie = user?.functie;

  if (!userFunctie) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">Er is geen functie gekoppeld aan uw profiel.</p>
          <p className="text-sm text-muted-foreground text-center mt-1">Vraag uw beheerder om uw functie in te stellen in Personalia.</p>
        </CardContent>
      </Card>
    );
  }

  const userDeptId = departments?.find((d) => d.name === user?.department)?.id ?? null;

  const matchedFunction = jobFunctionList?.find(
    (jf) => jf.name === userFunctie && jf.departmentId === userDeptId
  ) ?? jobFunctionList?.find((jf) => jf.name === userFunctie) ?? null;

  if (!matchedFunction) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">Geen functiebeschrijving gevonden voor <strong>{userFunctie}</strong>.</p>
          <p className="text-sm text-muted-foreground text-center mt-1">Vraag uw beheerder om een functiebeschrijving te uploaden in Beheer → Onderhoud Functies.</p>
        </CardContent>
      </Card>
    );
  }

  if (!matchedFunction.descriptionFilePath) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">Geen document geüpload voor <strong>{userFunctie}</strong>.</p>
          <p className="text-sm text-muted-foreground text-center mt-1">Vraag uw beheerder om een functiebeschrijving te uploaden in Beheer → Onderhoud Functies.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {userFunctie}
            </CardTitle>
            <a
              href={matchedFunction.descriptionFilePath}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-open-functie-beschrijving"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Openen in nieuw tabblad
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <iframe
            src={matchedFunction.descriptionFilePath}
            className="w-full rounded-md border"
            style={{ height: "75vh", minHeight: "400px" }}
            title={`Functiebeschrijving ${userFunctie}`}
            data-testid="iframe-functie-beschrijving"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrganisatiePage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const [activeTab, setActiveTab] = useState("organogram");

  const tabs = [
    { key: "organogram", label: "Organogram", icon: Network },
    { key: "ao-procedures", label: "AO-Procedures", icon: ClipboardList },
    { key: "instructies", label: "Instructies", icon: FolderOpen },
    { key: "cao", label: "CAO Info", icon: BookOpen },
    { key: "wetgeving", label: "Wetgeving", icon: Scale },
    { key: "huishoudelijkreglement", label: "Huishoudelijkreglement", icon: FileText },
    { key: "functie-beschrijving", label: "Functie beschrijving", icon: FileText },
  ];

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Organisatie"
        subtitle="Afdelingen, procedures, organogram en wetgeving"
        imageSrc="/uploads/App_pics/organisatie.png"
        imageAlt="organisatie"
      />
      <div className="p-6 space-y-6">

      <div className="flex gap-1 border-b" data-testid="tabs-organisatie">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
        {activeTab === "organogram" && <OrganogramTab />}
        {activeTab === "ao-procedures" && <AoProceduresTab />}
        {activeTab === "instructies" && <InstructiesTab />}
        {activeTab === "cao" && <CaoInfoTab />}
        {activeTab === "wetgeving" && <WetgevingTab />}
        {activeTab === "huishoudelijkreglement" && <HuishoudelijkReglementTab />}
        {activeTab === "functie-beschrijving" && <FunctieBeschrijvingTab />}
      </div>
      </div>
    </div>
  );
}
