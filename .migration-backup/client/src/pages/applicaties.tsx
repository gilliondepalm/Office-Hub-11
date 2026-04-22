import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, AppWindow, ExternalLink, Trash2, UserPlus, FolderOpen, Monitor } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Application, AppAccess, User } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";

const appFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional(),
  url: z.string().optional(),
});

const accessFormSchema = z.object({
  userId: z.string().min(1, "Selecteer een gebruiker"),
  applicationId: z.string().min(1, "Selecteer een applicatie"),
  accessLevel: z.string().default("read"),
});

export default function ApplicatiesPage() {
  const [appOpen, setAppOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: accesses } = useQuery<(AppAccess & { userName?: string; appName?: string })[]>({
    queryKey: ["/api/app-access"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const appForm = useForm<z.infer<typeof appFormSchema>>({
    resolver: zodResolver(appFormSchema),
    defaultValues: { name: "", description: "", url: "" },
  });

  const accessForm = useForm<z.infer<typeof accessFormSchema>>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: { userId: "", applicationId: "", accessLevel: "read" },
  });

  const createAppMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appFormSchema>) => {
      await apiRequest("POST", "/api/applications", {
        ...data,
        description: data.description || null,
        url: data.url || null,
        icon: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Applicatie aangemaakt" });
      setAppOpen(false);
      appForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij aanmaken", variant: "destructive" });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Applicatie verwijderd" });
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accessFormSchema>) => {
      await apiRequest("POST", "/api/app-access", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Toegang verleend" });
      setAccessOpen(false);
      accessForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij verlenen", variant: "destructive" });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/app-access/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Toegang ingetrokken" });
    },
  });

  const myAccesses = accesses?.filter(a => a.userId === user?.id) || [];
  const myApps = myAccesses.map(a => {
    const app = applications?.find(ap => ap.id === a.applicationId);
    return app ? { ...app, accessId: a.id, accessLevel: a.accessLevel } : null;
  }).filter(Boolean) as (Application & { accessId: string; accessLevel: string })[];

  const userGroups = (() => {
    if (!accesses || !users || !applications) return [];
    const grouped = new Map<string, { user: User; apps: (Application & { accessId: string; accessLevel: string })[] }>();
    for (const access of accesses) {
      const u = users.find(usr => usr.id === access.userId);
      const app = applications.find(a => a.id === access.applicationId);
      if (!u || !app) continue;
      if (!grouped.has(u.id)) {
        grouped.set(u.id, { user: u, apps: [] });
      }
      grouped.get(u.id)!.apps.push({ ...app, accessId: access.id, accessLevel: access.accessLevel });
    }
    return Array.from(grouped.values()).sort((a, b) => a.user.fullName.localeCompare(b.user.fullName, "nl"));
  })();

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
        title="Applicaties"
        subtitle={isAdmin ? "Beheer applicaties en wijs ze toe aan gebruikers" : "Uw beschikbare applicaties op het netwerk"}
        imageSrc="/uploads/App_pics/applicaties.png"
        imageAlt="applicaties"
      />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-end gap-4 flex-wrap">
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-grant-access">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Toewijzen aan Gebruiker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Applicatie Toewijzen</DialogTitle>
                </DialogHeader>
                <Form {...accessForm}>
                  <form onSubmit={accessForm.handleSubmit((d) => grantAccessMutation.mutate(d))} className="space-y-4">
                    <FormField control={accessForm.control} name="userId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gebruiker</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-access-user"><SelectValue placeholder="Selecteer gebruiker" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {users?.sort((a, b) => a.fullName.localeCompare(b.fullName, "nl")).map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={accessForm.control} name="applicationId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicatie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-access-app"><SelectValue placeholder="Selecteer applicatie" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {applications?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={grantAccessMutation.isPending} data-testid="button-submit-access">
                      {grantAccessMutation.isPending ? "Toewijzen..." : "Toewijzen"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={appOpen} onOpenChange={setAppOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-application">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Applicatie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Applicatie</DialogTitle>
                </DialogHeader>
                <Form {...appForm}>
                  <form onSubmit={appForm.handleSubmit((d) => createAppMutation.mutate(d))} className="space-y-4">
                    <FormField control={appForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam</FormLabel>
                        <FormControl><Input {...field} placeholder="Bijv. SAP, Excel Rapportage" data-testid="input-app-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={appForm.control} name="url" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL (optioneel)</FormLabel>
                        <FormControl><Input {...field} placeholder="Bijv. http://192.168.1.10:8080" data-testid="input-app-url" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={appForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Korte beschrijving van de applicatie" data-testid="input-app-description" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createAppMutation.isPending} data-testid="button-submit-application">
                      {createAppMutation.isPending ? "Opslaan..." : "Applicatie Opslaan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isAdmin ? (
        <Tabs defaultValue="per-user">
          <TabsList>
            <TabsTrigger value="per-user" data-testid="tab-per-user">Per Gebruiker</TabsTrigger>
            <TabsTrigger value="apps" data-testid="tab-apps">Alle Applicaties</TabsTrigger>
          </TabsList>

          <TabsContent value="per-user" className="mt-4">
            {userGroups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen applicaties toegewezen</p>
                  <p className="text-muted-foreground text-xs mt-1">Gebruik "Toewijzen aan Gebruiker" om applicaties toe te wijzen</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userGroups.map(({ user: u, apps }) => (
                  <Card key={u.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" data-testid={`text-user-apps-${u.id}`}>{u.fullName}</h3>
                          <p className="text-xs text-muted-foreground">{u.department || "Geen afdeling"} - {u.role}</p>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Applicatie</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apps.map(app => (
                            <TableRow key={app.accessId} data-testid={`row-user-app-${app.accessId}`}>
                              <TableCell className="font-medium text-sm">{app.name}</TableCell>
                              <TableCell className="text-sm">
                                {app.url ? (
                                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1" data-testid={`link-app-url-${app.id}`}>
                                    <ExternalLink className="h-3 w-3" />
                                    {app.url}
                                  </a>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => revokeAccessMutation.mutate(app.accessId)} data-testid={`button-revoke-${app.accessId}`}>
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apps" className="mt-4">
            {(!applications || applications.length === 0) ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <AppWindow className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Geen applicaties aangemaakt</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Naam</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Icon</TableHead>
                          <TableHead>Gebruikers</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map(app => {
                          const appAccessCount = accesses?.filter(a => a.applicationId === app.id).length || 0;
                          return (
                            <TableRow key={app.id} data-testid={`row-app-${app.id}`}>
                              <TableCell className="font-medium text-sm">{app.name}</TableCell>
                              <TableCell className="text-sm">
                                {app.url ? (
                                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    Openen
                                  </a>
                                ) : "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{app.description || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">{appAccessCount}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => deleteAppMutation.mutate(app.id)} data-testid={`button-delete-app-${app.id}`}>
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          {myApps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <AppWindow className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">U heeft nog geen applicaties toegewezen gekregen</p>
                <p className="text-muted-foreground text-xs mt-1">Neem contact op met uw systeembeheerder</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myApps.map(app => (
                <Card
                  key={app.accessId}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-my-app-${app.id}`}
                  onClick={() => {
                    if (app.url) {
                      window.open(app.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <AppWindow className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{app.description || app.name}</h3>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
