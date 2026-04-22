import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Award, Star, TrendingUp, ClipboardCheck, UserCheck, Gift, Printer, Save, ChevronLeft, ChevronRight, ChevronDown, Eye, FileText, Trash2, Settings, PlusCircle, X, Pencil, Building2, Layers, FolderOpen } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Reward, User, FunctioneringReview, Competency, BeoordelingReview, BeoordelingScore, JaarplanItem, JaarplanActie, JaarplanOnderdeel, YearlyAward } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { formatDate } from "@/lib/dateUtils";

function ReadOnlyFunctioneringForm({ review }: { review: FunctioneringReview }) {
  const fieldValue = (val: string | null | undefined) => val || "-";

  return (
    <div className="space-y-4 print:space-y-3 print:break-before-page">
      <Card className="border border-border/60 print:border print:shadow-none print:bg-white bg-card">
        <CardContent className="p-6 print:p-4">
          <h2 className="text-lg font-bold text-center mb-1 print:text-xl">
            GESPREKSFORMULIER FUNCTIONERINGSGESPREK
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6 print:text-sm print:text-black">
            Vertrouwelijk
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Medewerker</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{fieldValue(review.medewerker)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Functie</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{fieldValue(review.functie)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Afdeling</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{fieldValue(review.afdeling)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Leidinggevende</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{fieldValue(review.leidinggevende)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Datum gesprek</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{formatDate(review.datum)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Beoordelingsperiode</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{fieldValue(review.periode)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Functioneringsjaar</label>
              <p className="text-sm border-b border-border/60 pb-1 print:border-b print:border-gray-400">{review.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">1. Terugblik vorige periode</h3>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Welke taken/werkzaamheden zijn uitgevoerd?</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.terugblikTaken)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Welke resultaten zijn behaald?</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.terugblikResultaten)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Welke knelpunten zijn er ervaren?</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.terugblikKnelpunten)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">2. Werk en werkomstandigheden</h3>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Werkinhoud en takenpakket</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.werkinhoud)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Arbeidsomstandigheden</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.arbeidsomstandigheden)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">3. Samenwerking en communicatie</h3>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Samenwerking met collega's</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.samenwerking)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Communicatie</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.communicatie)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">4. Persoonlijke ontwikkeling</h3>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Persoonlijke ontwikkeling en competenties</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.persoonlijkeOntwikkeling)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Scholings- en opleidingswensen</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.scholingswensen)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">5. Doelstellingen komende periode</h3>
          {[1, 2, 3].map((n) => {
            const doel = (review as any)[`doelstelling${n}`];
            const termijn = (review as any)[`doelstelling${n}Termijn`];
            return (
              <div key={n} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Doelstelling {n}</label>
                  <p className="text-sm whitespace-pre-wrap">{fieldValue(doel)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Termijn</label>
                  <p className="text-sm">{fieldValue(termijn)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-3 print:space-y-2">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">6. Afspraken en opmerkingen</h3>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Gemaakte afspraken</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.afspraken)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen medewerker</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.opmerkingMedewerker)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen leidinggevende</label>
            <p className="text-sm whitespace-pre-wrap">{fieldValue(review.opmerkingLeidinggevende)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid bg-card">
        <CardContent className="p-6 print:p-4 space-y-6 print:space-y-4">
          <h3 className="font-semibold text-sm border-b pb-2 print:text-base">7. Ondertekening</h3>
          <p className="text-xs text-muted-foreground print:text-black">
            Beide partijen verklaren dat dit gesprek heeft plaatsgevonden en dat de inhoud van dit formulier een correcte weergave is van het besprokene.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8 print:space-y-12">
              <div>
                <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                <div className="border-b border-dashed h-6 print:h-8"></div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening medewerker</p>
                <div className="border-b border-dashed h-12 print:h-16"></div>
              </div>
            </div>
            <div className="space-y-8 print:space-y-12">
              <div>
                <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                <div className="border-b border-dashed h-6 print:h-8"></div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening leidinggevende</p>
                <div className="border-b border-dashed h-12 print:h-16"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunctioneringForm({ users, currentUser }: { users?: User[]; currentUser?: User | null }) {
  const { toast } = useToast();
  const isAdmin = isAdminRole(currentUser?.role) || currentUser?.role === "manager_az";
  const isPureManager = currentUser?.role === "manager";
  const myDept = currentUser?.department || "";
  const canEdit = isAdmin || isPureManager;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"form" | "overview">("overview");
  const [viewingReview, setViewingReview] = useState<FunctioneringReview | null>(null);

  const emptyForm = {
    medewerker: "",
    functie: "",
    afdeling: "",
    leidinggevende: "",
    datum: format(new Date(), "yyyy-MM-dd"),
    periode: "",
    functioneringsJaar: new Date().getFullYear(),
    terugblikTaken: "",
    terugblikResultaten: "",
    terugblikKnelpunten: "",
    werkinhoud: "",
    samenwerking: "",
    communicatie: "",
    arbeidsomstandigheden: "",
    persoonlijkeOntwikkeling: "",
    scholingswensen: "",
    doelstelling1: "",
    doelstelling1Termijn: "",
    doelstelling2: "",
    doelstelling2Termijn: "",
    doelstelling3: "",
    doelstelling3Termijn: "",
    afspraken: "",
    opmerkingMedewerker: "",
    opmerkingLeidinggevende: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const { data: reviewsByYear, isLoading: loadingReviews } = useQuery<(FunctioneringReview & { userName?: string })[]>({
    queryKey: ["/api/functionering", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/functionering?year=${selectedYear}`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: isAdmin || isPureManager,
  });

  const { data: myReviews } = useQuery<FunctioneringReview[]>({
    queryKey: ["/api/functionering/mine"],
    enabled: !isAdmin && !isPureManager,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("POST", "/api/functionering", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/functionering"] });
      queryClient.invalidateQueries({ queryKey: ["/api/functionering/mine"] });
      toast({ title: "Functioneringsgesprek opgeslagen" });
      handleBackToOverview();
    },
    onError: () => {
      toast({ title: "Opslaan mislukt", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/functionering/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/functionering"] });
      queryClient.invalidateQueries({ queryKey: ["/api/functionering/mine"] });
      toast({ title: "Functioneringsgesprek verwijderd" });
    },
    onError: () => {
      toast({ title: "Verwijderen mislukt", variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectEmployee = (userId: string) => {
    const emp = users?.find(u => u.id === userId);
    if (emp) {
      setSelectedUserId(userId);
      setFormData(prev => ({
        ...prev,
        medewerker: emp.fullName,
        functie: emp.role === "directeur" ? "Directeur" : emp.role === "admin" ? "Beheerder" : emp.role === "manager" ? "Manager" : "Medewerker",
        afdeling: emp.department || "",
      }));
    }
  };

  const handleSave = () => {
    if (!formData.medewerker) {
      toast({ title: "Selecteer eerst een medewerker", variant: "destructive" });
      return;
    }
    const userId = selectedUserId || currentUser?.id;
    if (!userId) return;

    const year = formData.functioneringsJaar;
    saveMutation.mutate({
      ...formData,
      userId,
      year,
      editId: viewingReview?.id,
      createdBy: currentUser?.id,
    });
  };

  const handleViewReview = (review: FunctioneringReview) => {
    setViewingReview(review);
    setFormData({
      medewerker: review.medewerker,
      functie: review.functie || "",
      afdeling: review.afdeling || "",
      leidinggevende: review.leidinggevende || "",
      datum: review.datum,
      periode: review.periode || "",
      functioneringsJaar: review.year,
      terugblikTaken: review.terugblikTaken || "",
      terugblikResultaten: review.terugblikResultaten || "",
      terugblikKnelpunten: review.terugblikKnelpunten || "",
      werkinhoud: review.werkinhoud || "",
      samenwerking: review.samenwerking || "",
      communicatie: review.communicatie || "",
      arbeidsomstandigheden: review.arbeidsomstandigheden || "",
      persoonlijkeOntwikkeling: review.persoonlijkeOntwikkeling || "",
      scholingswensen: review.scholingswensen || "",
      doelstelling1: review.doelstelling1 || "",
      doelstelling1Termijn: review.doelstelling1Termijn || "",
      doelstelling2: review.doelstelling2 || "",
      doelstelling2Termijn: review.doelstelling2Termijn || "",
      doelstelling3: review.doelstelling3 || "",
      doelstelling3Termijn: review.doelstelling3Termijn || "",
      afspraken: review.afspraken || "",
      opmerkingMedewerker: review.opmerkingMedewerker || "",
      opmerkingLeidinggevende: review.opmerkingLeidinggevende || "",
    });
    setSelectedUserId(review.userId);
    setViewMode("form");
  };

  const handleNewForm = () => {
    setFormData(emptyForm);
    setSelectedUserId("");
    setViewingReview(null);
    setViewMode("form");
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setViewingReview(null);
    setFormData(emptyForm);
    setSelectedUserId("");
  };

  const allReviews = (isAdmin || isPureManager) ? reviewsByYear : myReviews;
  const reviewsToShow = isPureManager && myDept
    ? allReviews?.filter(r => {
        const u = users?.find(u2 => u2.id === r.userId);
        return u?.department === myDept;
      })
    : allReviews;

  if (viewMode === "overview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)} data-testid="button-year-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[60px] text-center" data-testid="text-selected-year">{selectedYear}</span>
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)} data-testid="button-year-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {canEdit && (
            <Button onClick={handleNewForm} data-testid="button-new-functionering">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Gesprek
            </Button>
          )}
        </div>

        {loadingReviews ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !reviewsToShow || reviewsToShow.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Geen functioneringsgesprekken gevonden voor {selectedYear}</p>
              {canEdit && (
                <Button variant="link" onClick={handleNewForm} className="mt-2" data-testid="button-new-functionering-empty">
                  Nieuw gesprek aanmaken
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {reviewsToShow.map((review) => (
              <Card key={review.id} className="border border-border/60" data-testid={`review-card-${review.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`review-name-${review.id}`}>
                        {review.medewerker}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.functie}</span>
                        {review.afdeling && <span>- {review.afdeling}</span>}
                        <span>- {formatDate(review.datum)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewReview(review)} data-testid={`button-view-review-${review.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Bekijken
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(review.id)} data-testid={`button-delete-review-${review.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackToOverview} data-testid="button-back-overview">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Overzicht
          </Button>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? (viewingReview ? "Bekijk of bewerk het functioneringsgesprek" : "Vul het formulier in en sla op")
              : "Bekijk het functioneringsgesprek"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-functionering">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline" data-testid="button-print-functionering">
            <Printer className="h-4 w-4 mr-2" />
            Afdrukken
          </Button>
        </div>
      </div>

      <div id="functionering-form" className="space-y-6 print:hidden">
        <Card className="border border-border/60 print:border print:shadow-none print:bg-white">
          <CardContent className="p-6 print:p-4">
            <h2 className="text-lg font-bold text-center mb-1 print:text-xl" data-testid="text-functionering-title">
              GESPREKSFORMULIER FUNCTIONERINGSGESPREK
            </h2>
            <p className="text-xs text-muted-foreground text-center mb-6 print:text-sm print:text-black">
              Vertrouwelijk
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Medewerker</label>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Input
                      value={formData.medewerker}
                      onChange={(e) => updateField("medewerker", e.target.value)}
                      placeholder="Naam medewerker"
                      className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                      data-testid="input-func-medewerker"
                    />
                    <Select onValueChange={handleSelectEmployee} value={selectedUserId}>
                      <SelectTrigger className="w-[140px] print:hidden" data-testid="select-func-employee">
                        <SelectValue placeholder="Kies..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.active && (!isPureManager || !myDept || u.department === myDept)).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    value={formData.medewerker}
                    readOnly
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-func-medewerker"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Functie</label>
                <Input
                  value={formData.functie}
                  onChange={(e) => updateField("functie", e.target.value)}
                  readOnly={!canEdit}
                  placeholder="Functie"
                  className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                  data-testid="input-func-functie"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Afdeling</label>
                <Input
                  value={formData.afdeling}
                  onChange={(e) => updateField("afdeling", e.target.value)}
                  readOnly={!canEdit}
                  placeholder="Afdeling"
                  className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                  data-testid="input-func-afdeling"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Leidinggevende</label>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Input
                      value={formData.leidinggevende}
                      onChange={(e) => updateField("leidinggevende", e.target.value)}
                      placeholder="Naam leidinggevende"
                      className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                      data-testid="input-func-leidinggevende"
                    />
                    <Select onValueChange={(val) => { const mgr = users?.find(u => u.id === val); if (mgr) updateField("leidinggevende", mgr.fullName); }}>
                      <SelectTrigger className="w-[140px] print:hidden" data-testid="select-func-leidinggevende">
                        <SelectValue placeholder="Kies..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.active && (u.role === "manager" || isAdminRole(u.role))).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    value={formData.leidinggevende}
                    readOnly
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-func-leidinggevende"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Datum gesprek</label>
                <Input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => updateField("datum", e.target.value)}
                  readOnly={!canEdit}
                  className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                  data-testid="input-func-datum"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Beoordelingsperiode</label>
                  <Input
                    value={formData.periode}
                    onChange={(e) => updateField("periode", e.target.value)}
                    readOnly={!canEdit}
                    placeholder="bijv. jan 2025 - dec 2025"
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-func-periode"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Functioneringsjaar</label>
                  <Input
                    type="number"
                    value={formData.functioneringsJaar}
                    onChange={e => setFormData(prev => ({ ...prev, functioneringsJaar: parseInt(e.target.value) || new Date().getFullYear() }))}
                    readOnly={!canEdit}
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-func-jaar"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">1. Terugblik vorige periode</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Welke taken/werkzaamheden zijn uitgevoerd?</label>
              <Textarea
                value={formData.terugblikTaken}
                onChange={(e) => updateField("terugblikTaken", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-terugblik-taken"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Welke resultaten zijn behaald?</label>
              <Textarea
                value={formData.terugblikResultaten}
                onChange={(e) => updateField("terugblikResultaten", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-terugblik-resultaten"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Welke knelpunten zijn er ervaren?</label>
              <Textarea
                value={formData.terugblikKnelpunten}
                onChange={(e) => updateField("terugblikKnelpunten", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-terugblik-knelpunten"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">2. Werk en werkomstandigheden</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Werkinhoud en takenpakket</label>
              <Textarea
                value={formData.werkinhoud}
                onChange={(e) => updateField("werkinhoud", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                placeholder="Hoe ervaart u uw huidige takenpakket?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-werkinhoud"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Arbeidsomstandigheden</label>
              <Textarea
                value={formData.arbeidsomstandigheden}
                onChange={(e) => updateField("arbeidsomstandigheden", e.target.value)}
                readOnly={!canEdit}
                rows={2}
                placeholder="Hoe ervaart u de werkomgeving en faciliteiten?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-arbeidsomstandigheden"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">3. Samenwerking en communicatie</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Samenwerking met collega's</label>
              <Textarea
                value={formData.samenwerking}
                onChange={(e) => updateField("samenwerking", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                placeholder="Hoe verloopt de samenwerking binnen en buiten de afdeling?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-samenwerking"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Communicatie</label>
              <Textarea
                value={formData.communicatie}
                onChange={(e) => updateField("communicatie", e.target.value)}
                readOnly={!canEdit}
                rows={2}
                placeholder="Hoe ervaart u de communicatie met leidinggevende en collega's?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-communicatie"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">4. Persoonlijke ontwikkeling</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Persoonlijke ontwikkeling en competenties</label>
              <Textarea
                value={formData.persoonlijkeOntwikkeling}
                onChange={(e) => updateField("persoonlijkeOntwikkeling", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                placeholder="Welke competenties wilt u verder ontwikkelen?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-persoonlijke-ontwikkeling"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Scholings- en opleidingswensen</label>
              <Textarea
                value={formData.scholingswensen}
                onChange={(e) => updateField("scholingswensen", e.target.value)}
                readOnly={!canEdit}
                rows={2}
                placeholder="Welke cursussen of opleidingen heeft u nodig?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-scholingswensen"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">5. Doelstellingen komende periode</h3>
            <div className="space-y-3 print:space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2 items-start">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground print:text-black">Doelstelling {n}</label>
                    <Textarea
                      value={(formData as any)[`doelstelling${n}`]}
                      onChange={(e) => updateField(`doelstelling${n}`, e.target.value)}
                      readOnly={!canEdit}
                      rows={2}
                      placeholder={`Omschrijving doelstelling ${n}`}
                      className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                      data-testid={`input-func-doelstelling-${n}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground print:text-black">Termijn</label>
                    <Input
                      value={(formData as any)[`doelstelling${n}Termijn`]}
                      onChange={(e) => updateField(`doelstelling${n}Termijn`, e.target.value)}
                      readOnly={!canEdit}
                      placeholder="bijv. Q2 2026"
                      className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                      data-testid={`input-func-termijn-${n}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">6. Afspraken en opmerkingen</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Gemaakte afspraken</label>
              <Textarea
                value={formData.afspraken}
                onChange={(e) => updateField("afspraken", e.target.value)}
                readOnly={!canEdit}
                rows={3}
                placeholder="Welke concrete afspraken zijn er gemaakt?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-afspraken"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen medewerker</label>
              <Textarea
                value={formData.opmerkingMedewerker}
                onChange={(e) => updateField("opmerkingMedewerker", e.target.value)}
                readOnly={!canEdit}
                rows={2}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-opmerking-medewerker"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen leidinggevende</label>
              <Textarea
                value={formData.opmerkingLeidinggevende}
                onChange={(e) => updateField("opmerkingLeidinggevende", e.target.value)}
                readOnly={!canEdit}
                rows={2}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-func-opmerking-leidinggevende"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-6 print:space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">7. Ondertekening</h3>
            <p className="text-xs text-muted-foreground print:text-black">
              Beide partijen verklaren dat dit gesprek heeft plaatsgevonden en dat de inhoud van dit formulier een correcte weergave is van het besprokene.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8 print:space-y-12">
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                  <div className="border-b border-dashed h-6 print:h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening medewerker</p>
                  <div className="border-b border-dashed h-12 print:h-16"></div>
                </div>
              </div>
              <div className="space-y-8 print:space-y-12">
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                  <div className="border-b border-dashed h-6 print:h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening leidinggevende</p>
                  <div className="border-b border-dashed h-12 print:h-16"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden print:block">
        <ReadOnlyFunctioneringForm review={{
          ...formData,
          id: viewingReview?.id || "",
          userId: viewingReview?.userId || selectedUserId || "",
          year: formData.functioneringsJaar,
          createdBy: viewingReview?.createdBy || currentUser?.id || "",
          createdAt: viewingReview?.createdAt || new Date().toISOString(),
          updatedAt: viewingReview?.updatedAt || null,
          medewerker: viewingReview?.medewerker || formData.medewerker,
        } as FunctioneringReview} />
      </div>

      <div className="flex justify-end gap-2 print:hidden">
        {canEdit && (
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-functionering-bottom">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline" data-testid="button-print-functionering-bottom">
          <Printer className="h-4 w-4 mr-2" />
          Afdrukken
        </Button>
      </div>
    </div>
  );
}

function BeoordelingSection({ users, currentUser }: { users?: User[]; currentUser?: User | null }) {
  const { toast } = useToast();
  const isAdmin = isAdminRole(currentUser?.role) || currentUser?.role === "manager_az";
  const isPureManager = currentUser?.role === "manager";
  const myDept = currentUser?.department || "";
  const canEdit = isAdmin || isPureManager;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedFunctie, setSelectedFunctie] = useState<string>("");
  const [viewMode, setViewMode] = useState<"overview" | "form" | "competencies">("overview");
  const [viewingReview, setViewingReview] = useState<BeoordelingReview | null>(null);
  const [compFunctie, setCompFunctie] = useState<string>("");
  const [newCompName, setNewCompName] = useState("");
  const [newCompNorms, setNewCompNorms] = useState({ norm1: "", norm2: "", norm3: "", norm4: "", norm5: "" });
  const [showCompDropdown, setShowCompDropdown] = useState(false);
  const [expandedDropdownComp, setExpandedDropdownComp] = useState<string | null>(null);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editCompName, setEditCompName] = useState("");
  const [editCompNorms, setEditCompNorms] = useState({ norm1: "", norm2: "", norm3: "", norm4: "", norm5: "" });
  const [formScores, setFormScores] = useState<Record<string, { score: number | null; toelichting: string }>>({});
  const [formData, setFormData] = useState({
    beoordelaar: "",
    datum: format(new Date(), "yyyy-MM-dd"),
    periode: "",
    beoordelingsJaar: new Date().getFullYear(),
    afspraken: "",
    opmerkingMedewerker: "",
    opmerkingBeoordelaar: "",
  });

  const { data: reviewsByYear, isLoading: loadingReviews } = useQuery<(BeoordelingReview & { userName?: string })[]>({
    queryKey: ["/api/beoordeling", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/beoordeling?year=${selectedYear}`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: isAdmin || isPureManager,
  });

  const { data: myReviews } = useQuery<BeoordelingReview[]>({
    queryKey: ["/api/beoordeling/mine"],
    enabled: !isAdmin && !isPureManager,
  });

  const { data: functieCompetencies } = useQuery<Competency[]>({
    queryKey: ["/api/competencies/functie", selectedFunctie],
    queryFn: async () => {
      const res = await fetch(`/api/competencies/functie/${encodeURIComponent(selectedFunctie)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: !!selectedFunctie && viewMode === "form",
  });

  const { data: manageCompetencies } = useQuery<Competency[]>({
    queryKey: ["/api/competencies/functie", compFunctie],
    queryFn: async () => {
      const res = await fetch(`/api/competencies/functie/${encodeURIComponent(compFunctie)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: !!compFunctie && viewMode === "competencies",
  });

  const { data: allCompetencies } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
    enabled: viewMode === "competencies" || viewMode === "form",
  });

  const existingFuncties = [...new Set(allCompetencies?.map(c => c.functie) || [])].sort();

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("POST", "/api/beoordeling", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beoordeling"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beoordeling/mine"] });
      toast({ title: "Beoordeling opgeslagen" });
      setViewMode("overview");
      setViewingReview(null);
      setSelectedUserId("");
      setSelectedFunctie("");
      setFormScores({});
      setFormData({ beoordelaar: "", datum: format(new Date(), "yyyy-MM-dd"), periode: "", beoordelingsJaar: new Date().getFullYear(), afspraken: "", opmerkingMedewerker: "", opmerkingBeoordelaar: "" });
    },
    onError: () => {
      toast({ title: "Opslaan mislukt", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/beoordeling/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beoordeling"] });
      toast({ title: "Beoordeling verwijderd" });
    },
  });

  const createCompMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("POST", "/api/competencies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies/functie", compFunctie] });
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      setNewCompName("");
      setNewCompNorms({ norm1: "", norm2: "", norm3: "", norm4: "", norm5: "" });
      toast({ title: "Competentie toegevoegd" });
    },
    onError: () => {
      toast({ title: "Toevoegen mislukt", variant: "destructive" });
    },
  });

  const updateCompMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await apiRequest("PUT", `/api/competencies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies/functie", compFunctie] });
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      setEditingCompId(null);
      toast({ title: "Competentie bijgewerkt" });
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/competencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies/functie", compFunctie] });
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      toast({ title: "Competentie verwijderd" });
    },
  });

  const scoreValues = Object.values(formScores).filter(s => s.score !== null).map(s => s.score as number);
  const totalScore = scoreValues.reduce((a, b) => a + b, 0);
  const averageScore = scoreValues.length > 0 ? (totalScore / scoreValues.length) : 0;

  const handleSelectEmployee = (userId: string) => {
    setSelectedUserId(userId);
    setFormScores({});
    const emp = users?.find(u => u.id === userId);
    if (emp && emp.functie) {
      setSelectedFunctie(emp.functie);
    } else {
      setSelectedFunctie("");
    }
  };

  const handleSave = () => {
    if (!selectedUserId) {
      toast({ title: "Selecteer eerst een medewerker", variant: "destructive" });
      return;
    }
    const emp = users?.find(u => u.id === selectedUserId);
    const year = formData.beoordelingsJaar;
    const scores = Object.entries(formScores).map(([competencyId, data]) => ({
      competencyId,
      score: data.score,
      toelichting: data.toelichting,
    }));
    saveMutation.mutate({
      userId: selectedUserId,
      year,
      medewerker: emp?.fullName || "",
      functie: selectedFunctie,
      afdeling: emp?.department || "",
      beoordelaar: formData.beoordelaar,
      datum: formData.datum,
      periode: formData.periode,
      totalScore: scoreValues.length > 0 ? `Totaal: ${totalScore} / Gemiddeld: ${averageScore.toFixed(1)}` : "",
      afspraken: formData.afspraken,
      opmerkingMedewerker: formData.opmerkingMedewerker,
      opmerkingBeoordelaar: formData.opmerkingBeoordelaar,
      createdBy: currentUser?.id,
      scores,
      ...(viewingReview ? { editId: viewingReview.id } : {}),
    });
  };

  const handleViewReview = async (review: BeoordelingReview) => {
    setViewingReview(review);
    setSelectedUserId(review.userId);
    setSelectedFunctie(review.functie || "");
    setFormData({
      beoordelaar: review.beoordelaar || "",
      datum: review.datum,
      periode: review.periode || "",
      beoordelingsJaar: review.year,
      afspraken: review.afspraken || "",
      opmerkingMedewerker: review.opmerkingMedewerker || "",
      opmerkingBeoordelaar: review.opmerkingBeoordelaar || "",
    });
    try {
      const res = await fetch(`/api/beoordeling/${review.id}/scores`, { credentials: "include" });
      if (res.ok) {
        const scores: (BeoordelingScore & { competencyName?: string })[] = await res.json();
        const scoresMap: Record<string, { score: number | null; toelichting: string }> = {};
        scores.forEach(s => {
          scoresMap[s.competencyId] = { score: s.score, toelichting: s.toelichting || "" };
        });
        setFormScores(scoresMap);
      }
    } catch {}
    setViewMode("form");
  };

  const handleNewForm = () => {
    setFormData({ beoordelaar: "", datum: format(new Date(), "yyyy-MM-dd"), periode: "", beoordelingsJaar: new Date().getFullYear(), afspraken: "", opmerkingMedewerker: "", opmerkingBeoordelaar: "" });
    setFormScores({});
    setSelectedUserId("");
    setSelectedFunctie("");
    setViewingReview(null);
    setViewMode("form");
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setViewingReview(null);
    setFormScores({});
    setSelectedUserId("");
    setSelectedFunctie("");
  };

  const scoreLabels: Record<number, string> = {
    1: "Onvoldoende",
    2: "Nog te ontwikkelen",
    3: "Normaal/goed",
    4: "Zeer goed/aantoonbaar beter",
    5: "Uitstekend/voorbeeld voor anderen",
  };

  const allBeoordelingen = (isAdmin || isPureManager) ? reviewsByYear : myReviews?.filter(r => r.year === selectedYear);
  const reviewsToShow = isPureManager && myDept
    ? allBeoordelingen?.filter(r => {
        const u = users?.find(u2 => u2.id === r.userId);
        return u?.department === myDept;
      })
    : allBeoordelingen;

  if (viewMode === "competencies" && isAdmin) {
    const normLabels: Record<number, string> = { 1: "Onvoldoende", 2: "Nog te ontwikkelen", 3: "Normaal/goed", 4: "Zeer goed/aantoonbaar beter", 5: "Uitstekend/voorbeeld voor anderen" };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToOverview} data-testid="button-back-overview-comp">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Overzicht
            </Button>
            <h3 className="font-semibold text-sm">Competenties per functie beheren</h3>
          </div>
        </div>

        <Card className="border border-border/60">
          <CardContent className="p-4 space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Functie</label>
            <div className="flex gap-2">
              <Input
                value={compFunctie}
                onChange={e => setCompFunctie(e.target.value)}
                placeholder="Typ een functienaam (bijv. Landmeter, Administratief Medewerker)"
                data-testid="input-comp-functie"
              />
            </div>
            {existingFuncties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground mr-1">Bestaand:</span>
                {existingFuncties.map(f => (
                  <Badge
                    key={f}
                    variant={compFunctie === f ? "default" : "outline"}
                    className="text-xs cursor-pointer"
                    onClick={() => setCompFunctie(f)}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {compFunctie && (
          <>
            {manageCompetencies && manageCompetencies.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{manageCompetencies.length} competentie(s) voor "{compFunctie}" (max 6)</p>
                {manageCompetencies.map((comp, i) => (
                  <Card key={comp.id} className="border border-border/60" data-testid={`comp-card-${comp.id}`}>
                    <CardContent className="p-4 space-y-3">
                      {editingCompId === comp.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}.</span>
                            <Input value={editCompName} onChange={e => setEditCompName(e.target.value)} placeholder="Naam competentie" className="flex-1" data-testid="input-edit-comp-name" />
                          </div>
                          <div className="pl-6 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Normering omschrijvingen:</p>
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <div className="flex items-center gap-2 shrink-0 sm:w-64">
                                  <Badge variant="outline" className="shrink-0 w-6 justify-center text-[10px]">{n}</Badge>
                                  <span className="text-xs text-muted-foreground">{normLabels[n]}</span>
                                </div>
                                <Input
                                  value={(editCompNorms as any)[`norm${n}`]}
                                  onChange={e => setEditCompNorms(prev => ({ ...prev, [`norm${n}`]: e.target.value }))}
                                  placeholder={`Omschrijving voor ${normLabels[n]}`}
                                  className="text-xs h-8"
                                  data-testid={`input-edit-norm-${n}`}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pl-6">
                            <Button size="sm" onClick={() => updateCompMutation.mutate({ id: comp.id, data: { name: editCompName, ...editCompNorms } })} data-testid="button-save-edit-comp">
                              <Save className="h-4 w-4 mr-1" />
                              Bewaren
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCompId(null)}>Annuleren</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{i + 1}. {comp.name}</p>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingCompId(comp.id);
                                setEditCompName(comp.name);
                                setEditCompNorms({ norm1: comp.norm1 || "", norm2: comp.norm2 || "", norm3: comp.norm3 || "", norm4: comp.norm4 || "", norm5: comp.norm5 || "" });
                              }} data-testid={`button-edit-comp-${comp.id}`}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteCompMutation.mutate(comp.id)} data-testid={`button-delete-comp-${comp.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 pl-4 space-y-1.5 border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Normering:</p>
                            {[1, 2, 3, 4, 5].map(n => {
                              const normVal = (comp as any)[`norm${n}`];
                              return (
                                <div key={n} className="flex items-start gap-2 text-xs">
                                  <Badge variant="outline" className="shrink-0 w-6 justify-center text-[10px] mt-0.5">{n}</Badge>
                                  <span className="shrink-0 font-medium text-muted-foreground min-w-[12rem]">{normLabels[n]}</span>
                                  <span className={normVal ? "text-foreground" : "text-muted-foreground/50 italic"}>{normVal || "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!manageCompetencies || manageCompetencies.length < 6) && (
              <Card className="border border-dashed border-border/60">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-medium">Nieuwe competentie toevoegen</h4>
                  <div className="relative">
                    <Input
                      value={newCompName}
                      onChange={e => {
                        setNewCompName(e.target.value);
                        setShowCompDropdown(true);
                      }}
                      onFocus={() => setShowCompDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCompDropdown(false), 200)}
                      placeholder="Naam competentie (bijv. Leiderschap, Communicatie)"
                      data-testid="input-new-comp-name"
                    />
                    {showCompDropdown && (() => {
                      const existingNames = [...new Set(allCompetencies?.map(c => c.name) || [])].sort();
                      const filtered = existingNames.filter(name =>
                        name.toLowerCase().includes(newCompName.toLowerCase()) &&
                        !manageCompetencies?.some(mc => mc.name === name)
                      );
                      if (filtered.length === 0) return null;
                      return (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-80 overflow-y-auto" data-testid="comp-name-dropdown">
                          {filtered.map(name => {
                            const usedIn = [...new Set(allCompetencies?.filter(c => c.name === name).map(c => c.functie) || [])];
                            const source = allCompetencies?.find(c => c.name === name);
                            const hasNorms = source && (source.norm1 || source.norm2 || source.norm3 || source.norm4 || source.norm5);
                            const isExpanded = expandedDropdownComp === name;
                            return (
                              <div key={name} className="border-b border-border/40 last:border-0" data-testid={`comp-option-${name}`}>
                                <div className="flex items-center w-full">
                                  <button
                                    type="button"
                                    className="flex-1 text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setNewCompName(name);
                                      setShowCompDropdown(false);
                                      setExpandedDropdownComp(null);
                                      if (source) {
                                        setNewCompNorms({
                                          norm1: source.norm1 || "",
                                          norm2: source.norm2 || "",
                                          norm3: source.norm3 || "",
                                          norm4: source.norm4 || "",
                                          norm5: source.norm5 || "",
                                        });
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">{usedIn.join(", ")}</span>
                                    </div>
                                  </button>
                                  {hasNorms && (
                                    <button
                                      type="button"
                                      className="px-2 py-2 text-muted-foreground hover:text-foreground shrink-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setExpandedDropdownComp(isExpanded ? null : name);
                                      }}
                                      data-testid={`comp-toggle-${name}`}
                                    >
                                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    </button>
                                  )}
                                </div>
                                {hasNorms && isExpanded && (
                                  <div className="px-3 pb-2 space-y-0.5">
                                    {[1, 2, 3, 4, 5].map(n => {
                                      const nv = (source as any)[`norm${n}`];
                                      return nv ? (
                                        <div key={n} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                          <span className="shrink-0 font-medium w-3 text-center">{n}.</span>
                                          <span>{nv}</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Normering omschrijvingen (optioneel):</p>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2 shrink-0 sm:w-64">
                          <Badge variant="outline" className="shrink-0 w-6 justify-center text-[10px]">{n}</Badge>
                          <span className="text-xs text-muted-foreground">{normLabels[n]}</span>
                        </div>
                        <Input
                          value={(newCompNorms as any)[`norm${n}`]}
                          onChange={e => setNewCompNorms(prev => ({ ...prev, [`norm${n}`]: e.target.value }))}
                          placeholder={`Omschrijving voor ${normLabels[n]}`}
                          className="text-xs h-8"
                          data-testid={`input-new-norm-${n}`}
                        />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => {
                    if (!newCompName.trim()) {
                      toast({ title: "Vul een naam in", variant: "destructive" });
                      return;
                    }
                    createCompMutation.mutate({
                      functie: compFunctie,
                      name: newCompName.trim(),
                      ...newCompNorms,
                      sortOrder: manageCompetencies?.length || 0,
                    });
                  }} disabled={createCompMutation.isPending} data-testid="button-add-comp">
                    <Save className="h-4 w-4 mr-1" />
                    Bewaren
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  if (viewMode === "overview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)} data-testid="button-beoor-year-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[60px] text-center" data-testid="text-beoor-selected-year">{selectedYear}</span>
            <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)} data-testid="button-beoor-year-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => setViewMode("competencies")} data-testid="button-manage-competencies">
                  <Settings className="h-4 w-4 mr-2" />
                  Competenties
                </Button>
              )}
              <Button onClick={handleNewForm} data-testid="button-new-beoordeling">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Beoordeling
              </Button>
            </div>
          )}
        </div>

        {loadingReviews ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !reviewsToShow || reviewsToShow.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <UserCheck className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {canEdit
                  ? `Geen beoordelingen gevonden voor ${selectedYear}`
                  : "U heeft nog geen beoordelingen ontvangen"}
              </p>
              {canEdit && (
                <Button variant="link" onClick={handleNewForm} className="mt-2">
                  Nieuwe beoordeling aanmaken
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {reviewsToShow.map((review) => (
              <Card key={review.id} className="border border-border/60" data-testid={`beoor-card-${review.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.medewerker}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.functie}</span>
                        {review.afdeling && <span>- {review.afdeling}</span>}
                        <span>- {formatDate(review.datum)}</span>
                        {review.totalScore && <Badge variant="secondary" className="text-[10px]">{review.totalScore}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewReview(review)} data-testid={`button-view-beoor-${review.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Bekijken
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(review.id)} data-testid={`button-delete-beoor-${review.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const compList = functieCompetencies || [];
  const isReadOnly = !canEdit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackToOverview} data-testid="button-back-overview-beoor">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Overzicht
          </Button>
          <p className="text-sm text-muted-foreground">
            {viewingReview ? "Bekijk of bewerk de beoordeling" : "Vul de beoordeling in"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-beoordeling">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline" data-testid="button-print-beoordeling">
            <Printer className="h-4 w-4 mr-2" />
            Afdrukken
          </Button>
        </div>
      </div>

      <div id="beoordeling-form" className="space-y-6 print:hidden">
        <Card className="border border-border/60 print:border print:shadow-none print:bg-white">
          <CardContent className="p-6 print:p-4">
            <h2 className="text-lg font-bold text-center mb-1 print:text-xl" data-testid="text-beoordeling-title">
              BEOORDELINGSFORMULIER
            </h2>
            <p className="text-xs text-muted-foreground text-center mb-6 print:text-sm print:text-black">
              Vertrouwelijk
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {canEdit ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Medewerker</label>
                  <Select onValueChange={handleSelectEmployee} value={selectedUserId} disabled={isReadOnly}>
                    <SelectTrigger data-testid="select-beoor-employee">
                      <SelectValue placeholder="Kies een medewerker..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => u.active && (!isPureManager || !myDept || u.department === myDept)).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Medewerker</label>
                  <Input value={viewingReview?.medewerker || currentUser?.fullName || ""} readOnly className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Functie</label>
                {canEdit ? (
                  <Select onValueChange={val => setSelectedFunctie(val)} value={selectedFunctie}>
                    <SelectTrigger className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none" data-testid="select-beoor-functie">
                      <SelectValue placeholder="Selecteer functie..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingFuncties.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={viewingReview?.functie || ""} readOnly className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none" />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Beoordelaar</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.beoordelaar}
                    onChange={e => setFormData(prev => ({ ...prev, beoordelaar: e.target.value }))}
                    placeholder="Naam beoordelaar"
                    readOnly={isReadOnly}
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-beoor-beoordelaar"
                  />
                  {canEdit && (
                    <Select onValueChange={val => { const mgr = users?.find(u => u.id === val); if (mgr) setFormData(prev => ({ ...prev, beoordelaar: mgr.fullName })); }}>
                      <SelectTrigger className="w-[140px] print:hidden" data-testid="select-beoor-beoordelaar">
                        <SelectValue placeholder="Kies..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.active && (u.role === "manager" || isAdminRole(u.role))).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground print:text-black">Datum beoordeling</label>
                <Input
                  type="date"
                  value={formData.datum}
                  onChange={e => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                  readOnly={isReadOnly}
                  className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                  data-testid="input-beoor-datum"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Beoordelingsperiode</label>
                  <Input
                    value={formData.periode}
                    onChange={e => setFormData(prev => ({ ...prev, periode: e.target.value }))}
                    placeholder="bijv. jan 2025 - dec 2025"
                    readOnly={isReadOnly}
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-beoor-periode"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground print:text-black">Beoordelingsjaar</label>
                  <Input
                    type="number"
                    value={formData.beoordelingsJaar}
                    onChange={e => setFormData(prev => ({ ...prev, beoordelingsJaar: parseInt(e.target.value) || new Date().getFullYear() }))}
                    readOnly={isReadOnly}
                    className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none"
                    data-testid="input-beoor-jaar"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(selectedFunctie || viewingReview) && (
          <Card className="border border-border/60 print:border print:shadow-none print:bg-white">
            <CardContent className="p-6 print:p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm border-b pb-2 print:text-base flex-1">Competentiebeoordeling — {selectedFunctie || viewingReview?.functie}</h3>
              </div>
              {compList.length === 0 && !viewingReview ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">Geen competenties gevonden voor functie "{selectedFunctie}".</p>
                  {isAdmin && (
                    <Button variant="link" onClick={() => {
                      setCompFunctie(selectedFunctie);
                      setViewMode("competencies");
                    }} className="mt-1">
                      Competenties instellen voor deze functie
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-8">#</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Competentie</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground w-[180px]">Score (1-5)</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Toelichting</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compList.map((comp, i) => {
                          const currentScore = formScores[comp.id]?.score || null;
                          const currentToelichting = formScores[comp.id]?.toelichting || "";
                          const hasNorms = comp.norm1 || comp.norm2 || comp.norm3 || comp.norm4 || comp.norm5;
                          return (
                            <tr key={comp.id} className="border-b last:border-0" data-testid={`beoor-comp-${comp.id}`}>
                              <td className="py-3 px-3 text-muted-foreground align-top">{i + 1}</td>
                              <td className="py-3 px-3 align-top">
                                <p className="font-medium">{comp.name}</p>
                                {canEdit && hasNorms && currentScore && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {(comp as any)[`norm${currentScore}`]}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-3 align-top">
                                <div className="flex items-center justify-center gap-1">
                                  {[1, 2, 3, 4, 5].map(n => {
                                    const normText = (comp as any)[`norm${n}`];
                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        disabled={isReadOnly}
                                        title={normText || `Score ${n}`}
                                        onClick={() => {
                                          if (!isReadOnly) setFormScores(prev => ({
                                            ...prev,
                                            [comp.id]: { score: n, toelichting: prev[comp.id]?.toelichting || "" }
                                          }));
                                        }}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                                          currentScore === n
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-primary/20"
                                        } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                                        data-testid={`button-score-${comp.id}-${n}`}
                                      >
                                        {n}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-3 px-3 align-top">
                                {canEdit ? (
                                  <Input
                                    value={currentToelichting}
                                    onChange={e => setFormScores(prev => ({
                                      ...prev,
                                      [comp.id]: { score: prev[comp.id]?.score || null, toelichting: e.target.value }
                                    }))}
                                    placeholder="Optioneel"
                                    className="text-xs h-8"
                                    data-testid={`input-beoor-toelichting-${comp.id}`}
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">{currentToelichting || "—"}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-6 pt-2 border-t">
                    <div className="flex items-center gap-2" data-testid="text-beoor-total">
                      <span className="text-sm font-medium text-muted-foreground">Totaal:</span>
                      <span className="text-lg font-bold">{totalScore}</span>
                      <span className="text-sm text-muted-foreground">/ {compList.length * 5}</span>
                    </div>
                    <div className="flex items-center gap-2" data-testid="text-beoor-average">
                      <span className="text-sm font-medium text-muted-foreground">Gemiddelde:</span>
                      <Badge variant={averageScore >= 4 ? "default" : averageScore >= 3 ? "secondary" : "destructive"} className="text-sm px-3 py-1">
                        {scoreValues.length > 0 ? averageScore.toFixed(1) : "—"}
                      </Badge>
                      {scoreValues.length > 0 && (
                        <span className="text-xs text-muted-foreground">({scoreLabels[Math.round(averageScore)] || ""})</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border border-border/60 print:border print:shadow-none print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-4 print:space-y-2">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">Afspraken en opmerkingen</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Gemaakte afspraken</label>
              <Textarea
                value={formData.afspraken}
                onChange={e => setFormData(prev => ({ ...prev, afspraken: e.target.value }))}
                rows={3}
                readOnly={isReadOnly}
                placeholder="Welke afspraken zijn er gemaakt?"
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-beoor-afspraken"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen medewerker</label>
              <Textarea
                value={formData.opmerkingMedewerker}
                onChange={e => setFormData(prev => ({ ...prev, opmerkingMedewerker: e.target.value }))}
                rows={2}
                readOnly={isReadOnly}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-beoor-opmerking-medewerker"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground print:text-black">Opmerkingen beoordelaar</label>
              <Textarea
                value={formData.opmerkingBeoordelaar}
                onChange={e => setFormData(prev => ({ ...prev, opmerkingBeoordelaar: e.target.value }))}
                rows={2}
                readOnly={isReadOnly}
                className="print:border-0 print:border-b print:rounded-none print:px-0 print:shadow-none print:resize-none"
                data-testid="input-beoor-opmerking-beoordelaar"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 print:border print:shadow-none print:break-inside-avoid">
          <CardContent className="p-6 print:p-4 space-y-6 print:space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 print:text-base">Ondertekening</h3>
            <p className="text-xs text-muted-foreground print:text-black">
              Beide partijen verklaren dat deze beoordeling heeft plaatsgevonden en dat de inhoud van dit formulier een correcte weergave is van het besprokene.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8 print:space-y-12">
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                  <div className="border-b border-dashed h-6 print:h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening medewerker</p>
                  <div className="border-b border-dashed h-12 print:h-16"></div>
                </div>
              </div>
              <div className="space-y-8 print:space-y-12">
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Datum</p>
                  <div className="border-b border-dashed h-6 print:h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground print:text-black mb-1">Handtekening beoordelaar</p>
                  <div className="border-b border-dashed h-12 print:h-16"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden print:block print:space-y-4">
        <Card className="border print:shadow-none print:bg-white">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold text-center mb-1">BEOORDELINGSFORMULIER</h2>
            <p className="text-sm text-center mb-4">Vertrouwelijk</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Medewerker</label>
                <p className="text-sm border-b border-gray-400 pb-1">{viewingReview?.medewerker || users?.find(u => u.id === selectedUserId)?.fullName || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Functie</label>
                <p className="text-sm border-b border-gray-400 pb-1">{selectedFunctie || viewingReview?.functie || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Afdeling</label>
                <p className="text-sm border-b border-gray-400 pb-1">{viewingReview?.afdeling || users?.find(u => u.id === selectedUserId)?.department || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Beoordelaar</label>
                <p className="text-sm border-b border-gray-400 pb-1">{formData.beoordelaar || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Datum</label>
                <p className="text-sm border-b border-gray-400 pb-1">{formData.datum ? formatDate(formData.datum) : "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Beoordelingsperiode</label>
                <p className="text-sm border-b border-gray-400 pb-1">{formData.periode || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Beoordelingsjaar</label>
                <p className="text-sm border-b border-gray-400 pb-1">{formData.beoordelingsJaar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {compList.length > 0 && (
          <Card className="border print:shadow-none print:bg-white">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Competentiebeoordeling — {selectedFunctie || viewingReview?.functie}</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs font-medium w-8">#</th>
                    <th className="text-left py-2 px-2 text-xs font-medium">Competentie</th>
                    <th className="text-center py-2 px-2 text-xs font-medium w-20">Score</th>
                    <th className="text-left py-2 px-2 text-xs font-medium">Toelichting</th>
                  </tr>
                </thead>
                <tbody>
                  {compList.map((comp, i) => {
                    const s = formScores[comp.id]?.score;
                    const t = formScores[comp.id]?.toelichting || "";
                    const normText = s ? (comp as any)[`norm${s}`] : "";
                    return (
                      <tr key={comp.id} className="border-b last:border-0">
                        <td className="py-2 px-2 align-top">{i + 1}</td>
                        <td className="py-2 px-2 align-top">
                          <p className="font-medium">{comp.name}</p>
                          {normText && <p className="text-xs mt-0.5 text-gray-600">{normText}</p>}
                        </td>
                        <td className="py-2 px-2 align-top text-center font-bold">{s || "-"}</td>
                        <td className="py-2 px-2 align-top text-xs">{t || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-end gap-6 pt-2 border-t text-sm">
                <span>Totaal: <strong>{totalScore}</strong> / {compList.length * 5}</span>
                <span>Gemiddelde: <strong>{scoreValues.length > 0 ? averageScore.toFixed(1) : "—"}</strong>
                  {scoreValues.length > 0 && ` (${scoreLabels[Math.round(averageScore)] || ""})`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-base border-b pb-2">Afspraken en opmerkingen</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium">Gemaakte afspraken</label>
              <p className="text-sm whitespace-pre-wrap">{formData.afspraken || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Opmerkingen medewerker</label>
              <p className="text-sm whitespace-pre-wrap">{formData.opmerkingMedewerker || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Opmerkingen beoordelaar</label>
              <p className="text-sm whitespace-pre-wrap">{formData.opmerkingBeoordelaar || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border print:shadow-none print:bg-white print:break-inside-avoid">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-base border-b pb-2">Ondertekening</h3>
            <p className="text-xs">
              Beide partijen verklaren dat deze beoordeling heeft plaatsgevonden en dat de inhoud van dit formulier een correcte weergave is van het besprokene.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-12">
                <div>
                  <p className="text-xs font-medium mb-1">Datum</p>
                  <div className="border-b border-dashed h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Handtekening medewerker</p>
                  <div className="border-b border-dashed h-16"></div>
                </div>
              </div>
              <div className="space-y-12">
                <div>
                  <p className="text-xs font-medium mb-1">Datum</p>
                  <div className="border-b border-dashed h-8"></div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Handtekening beoordelaar</p>
                  <div className="border-b border-dashed h-16"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <div className="flex justify-end gap-2 print:hidden">
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-beoordeling-bottom">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
          <Button onClick={() => window.print()} variant="outline" data-testid="button-print-beoordeling-bottom">
            <Printer className="h-4 w-4 mr-2" />
            Afdrukken
          </Button>
        </div>
      )}
    </div>
  );
}

const statusOptions = [
  { value: "niet gestart", label: "Niet gestart", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "in uitvoering", label: "In uitvoering", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "op schema", label: "Op schema", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { value: "vertraagd", label: "Vertraagd", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  { value: "afgerond", label: "Afgerond", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  { value: "geannuleerd", label: "Geannuleerd", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
];

function ActieRow({ actie, canEdit, onDelete, onStatusChange }: {
  actie: JaarplanActie;
  canEdit: boolean;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const statusOpt = statusOptions.find(s => s.value === (actie.status ?? "niet gestart")) || statusOptions[0];
  return (
    <div className="flex items-start gap-2 text-xs py-1.5" data-testid={`jaarplan-actie-${actie.id}`}>
      <span className="text-muted-foreground whitespace-nowrap font-medium min-w-[80px]">{formatDate(actie.datum)}</span>
      <p className="flex-1 whitespace-pre-wrap">{actie.actie}</p>
      {canEdit ? (
        <Select value={actie.status ?? "niet gestart"} onValueChange={onStatusChange}>
          <SelectTrigger className={`h-5 w-auto text-[10px] px-1.5 py-0 border-0 ${statusOpt.color}`} data-testid={`select-actie-status-${actie.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="outline" className={`text-[9px] ${statusOpt.color}`}>{statusOpt.label}</Badge>
      )}
      {canEdit && (
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={onDelete} data-testid={`button-delete-actie-${actie.id}`}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function ActieForm({ onSave, onCancel, isPending, testPrefix }: {
  onSave: (datum: string, tekst: string) => void;
  onCancel: () => void;
  isPending: boolean;
  testPrefix: string;
}) {
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [tekst, setTekst] = useState("");
  return (
    <div className="bg-muted/40 rounded-md p-2 space-y-2">
      <div className="flex items-center gap-2">
        <Input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="h-7 text-xs w-36" data-testid={`input-actie-datum-${testPrefix}`} />
        <span className="text-xs text-muted-foreground">datum van de actie</span>
      </div>
      <Textarea value={tekst} onChange={e => setTekst(e.target.value)} placeholder="Beschrijf de ondernomen actie..." rows={2} className="text-xs" data-testid={`input-actie-tekst-${testPrefix}`} />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>Annuleren</Button>
        <Button size="sm" className="h-7 text-xs" onClick={() => { if (tekst.trim()) { onSave(datum, tekst); setTekst(""); setDatum(new Date().toISOString().slice(0, 10)); } }} disabled={!tekst.trim() || isPending} data-testid={`button-save-actie-${testPrefix}`}>
          <Save className="h-3 w-3 mr-1" />Opslaan
        </Button>
      </div>
    </div>
  );
}

function OnderdeelSection({ onderdeel, jaarplanId, canEdit, onDelete }: {
  onderdeel: JaarplanOnderdeel;
  jaarplanId: string;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNaam, setEditNaam] = useState(onderdeel.naam);

  const { data: acties = [] } = useQuery<JaarplanActie[]>({
    queryKey: ["/api/jaarplan/onderdelen", onderdeel.id, "acties"],
    queryFn: async () => {
      const res = await fetch(`/api/jaarplan/onderdelen/${onderdeel.id}/acties`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: expanded,
  });

  const addActieMutation = useMutation({
    mutationFn: ({ datum, tekst }: { datum: string; tekst: string }) =>
      apiRequest("POST", `/api/jaarplan/onderdelen/${onderdeel.id}/acties`, { datum, actie: tekst, jaarplanId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan/onderdelen", onderdeel.id, "acties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", jaarplanId, "acties"] });
      setShowForm(false);
      toast({ title: "Actie toegevoegd" });
    },
    onError: () => toast({ title: "Toevoegen mislukt", variant: "destructive" }),
  });

  const deleteActieMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jaarplan/acties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan/onderdelen", onderdeel.id, "acties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", jaarplanId, "acties"] });
    },
  });

  const updateActieStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/jaarplan/acties/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan/onderdelen", onderdeel.id, "acties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", jaarplanId, "acties"] });
    },
    onError: () => toast({ title: "Bijwerken mislukt", variant: "destructive" }),
  });

  const renameOnderdeelMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/jaarplan/onderdelen/${onderdeel.id}`, { naam: editNaam }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", jaarplanId, "onderdelen"] });
      setEditing(false);
      toast({ title: "Planonderdeel bijgewerkt" });
    },
    onError: () => toast({ title: "Bijwerken mislukt", variant: "destructive" }),
  });

  return (
    <div className="border rounded-md" data-testid={`onderdeel-${onderdeel.id}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/30 rounded-t-md">
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
            <FolderOpen className="h-3 w-3 shrink-0 text-primary" />
            <Input
              value={editNaam}
              onChange={e => setEditNaam(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && editNaam.trim() && !renameOnderdeelMutation.isPending) {
                  renameOnderdeelMutation.mutate();
                } else if (e.key === "Escape") {
                  setEditing(false);
                  setEditNaam(onderdeel.naam);
                }
              }}
              autoFocus
              className="h-6 text-xs py-0 px-1 flex-1"
              data-testid={`input-onderdeel-naam-${onderdeel.id}`}
            />
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => renameOnderdeelMutation.mutate()} disabled={!editNaam.trim() || renameOnderdeelMutation.isPending} data-testid={`button-save-rename-onderdeel-${onderdeel.id}`}><Save className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => { setEditing(false); setEditNaam(onderdeel.naam); }} data-testid={`button-cancel-rename-onderdeel-${onderdeel.id}`}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <>
            <button className="flex items-center gap-1 flex-1 min-w-0 text-xs font-semibold hover:text-foreground transition-colors text-left" onClick={() => setExpanded(v => !v)} data-testid={`button-toggle-onderdeel-${onderdeel.id}`}>
              {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
              <FolderOpen className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{onderdeel.naam}</span>
            </button>
            {canEdit && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); setEditing(true); }} data-testid={`button-rename-onderdeel-${onderdeel.id}`}><Pencil className="h-2.5 w-2.5" /></Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={e => { e.stopPropagation(); onDelete(); }} data-testid={`button-delete-onderdeel-${onderdeel.id}`}><Trash2 className="h-2.5 w-2.5" /></Button>
              </div>
            )}
          </>
        )}
      </div>
      {expanded && (
        <div className="p-2 space-y-1">
          {acties.length > 0 ? (
            <div className="divide-y divide-border/40">
              {acties.map(actie => (
                <ActieRow key={actie.id} actie={actie} canEdit={canEdit}
                  onDelete={() => deleteActieMutation.mutate(actie.id)}
                  onStatusChange={status => updateActieStatusMutation.mutate({ id: actie.id, status })}
                />
              ))}
            </div>
          ) : !showForm && (
            <p className="text-xs text-muted-foreground italic">Nog geen acties</p>
          )}
          {canEdit && showForm && (
            <ActieForm
              testPrefix={onderdeel.id}
              isPending={addActieMutation.isPending}
              onSave={(datum, tekst) => addActieMutation.mutate({ datum, tekst })}
              onCancel={() => setShowForm(false)}
            />
          )}
          {canEdit && !showForm && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 mt-1" onClick={() => setShowForm(true)} data-testid={`button-add-actie-onderdeel-${onderdeel.id}`}>
              <Plus className="h-3 w-3 mr-1" />Actie toevoegen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function JaarplanItemCard({ item, canEdit, onEdit, onDelete }: {
  item: JaarplanItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const [showActies, setShowActies] = useState(false);
  const [showActieForm, setShowActieForm] = useState(false);
  const [showOnderdeelForm, setShowOnderdeelForm] = useState(false);
  const [newOnderdeelNaam, setNewOnderdeelNaam] = useState("");

  const { data: acties = [] } = useQuery<JaarplanActie[]>({
    queryKey: ["/api/jaarplan", item.id, "acties"],
    queryFn: async () => {
      const res = await fetch(`/api/jaarplan/${item.id}/acties`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
  });

  const { data: onderdelen = [] } = useQuery<JaarplanOnderdeel[]>({
    queryKey: ["/api/jaarplan", item.id, "onderdelen"],
    queryFn: async () => {
      const res = await fetch(`/api/jaarplan/${item.id}/onderdelen`, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: showActies,
  });

  const addActieMutation = useMutation({
    mutationFn: ({ datum, tekst }: { datum: string; tekst: string }) =>
      apiRequest("POST", `/api/jaarplan/${item.id}/acties`, { datum, actie: tekst }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", item.id, "acties"] });
      setShowActieForm(false);
      toast({ title: "Actie toegevoegd" });
    },
    onError: () => toast({ title: "Toevoegen mislukt", variant: "destructive" }),
  });

  const deleteActieMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jaarplan/acties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", item.id, "acties"] }),
  });

  const updateActieStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/jaarplan/acties/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", item.id, "acties"] }),
    onError: () => toast({ title: "Bijwerken mislukt", variant: "destructive" }),
  });

  const addOnderdeelMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/jaarplan/${item.id}/onderdelen`, { naam: newOnderdeelNaam }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", item.id, "onderdelen"] });
      setNewOnderdeelNaam("");
      setShowOnderdeelForm(false);
      toast({ title: "Planonderdeel toegevoegd" });
    },
    onError: () => toast({ title: "Toevoegen mislukt", variant: "destructive" }),
  });

  const deleteOnderdeelMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jaarplan/onderdelen/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/jaarplan", item.id, "onderdelen"] }),
    onError: () => toast({ title: "Verwijderen mislukt", variant: "destructive" }),
  });

  const statusOpt = statusOptions.find(s => s.value === item.status) || statusOptions[0];
  const looseActies = acties.filter(a => !a.onderdeelId);
  const totalCount = acties.length + onderdelen.length;
  const totalActies = acties.length;
  const afgerondCount = acties.filter(a => a.status === "afgerond").length;
  const progressPct = totalActies > 0 ? Math.round((afgerondCount / totalActies) * 100) : 0;

  return (
    <div className="border rounded-lg p-3" data-testid={`jaarplan-plan-${item.id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium whitespace-pre-wrap">{item.afspraken}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            {item.startDatum && <span>Start: {formatDate(item.startDatum)}</span>}
            {item.eindDatum && <span>Einde: {formatDate(item.eindDatum)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className={`text-[10px] ${statusOpt.color}`} data-testid={`jaarplan-status-${item.id}`}>
            {statusOpt.label}
          </Badge>
          {canEdit && (
            <>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit} data-testid={`button-edit-jaarplan-${item.id}`}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDelete} data-testid={`button-delete-jaarplan-${item.id}`}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {totalActies > 0 && (
        <div className="mt-2" data-testid={`progress-acties-${item.id}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">{afgerondCount}/{totalActies} acties afgerond</span>
            <span className="text-[11px] text-muted-foreground">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
              data-testid={`progress-bar-${item.id}`}
            />
          </div>
        </div>
      )}

      <div className="mt-2 border-t pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setShowActies(v => !v); if (showActies) { setShowActieForm(false); setShowOnderdeelForm(false); } }}
            data-testid={`button-toggle-acties-${item.id}`}
          >
            {showActies ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Activiteiten ({totalCount})
          </button>
          {canEdit && showActies && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setShowOnderdeelForm(v => !v); setShowActieForm(false); }} data-testid={`button-add-onderdeel-${item.id}`}>
                <Layers className="h-3 w-3 mr-1" />
                Planonderdeel
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setShowActieForm(v => !v); setShowOnderdeelForm(false); }} data-testid={`button-add-actie-${item.id}`}>
                <Plus className="h-3 w-3 mr-1" />
                Actie
              </Button>
            </div>
          )}
        </div>

        {showActies && showOnderdeelForm && canEdit && (
          <div className="bg-muted/40 rounded-md p-2 flex items-center gap-2">
            <Input value={newOnderdeelNaam} onChange={e => setNewOnderdeelNaam(e.target.value)} placeholder="Naam planonderdeel..." className="h-7 text-xs flex-1" data-testid={`input-onderdeel-naam-new-${item.id}`} />
            <Button size="sm" className="h-7 text-xs" onClick={() => addOnderdeelMutation.mutate()} disabled={!newOnderdeelNaam.trim() || addOnderdeelMutation.isPending} data-testid={`button-save-onderdeel-${item.id}`}>
              <Save className="h-3 w-3 mr-1" />Opslaan
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setShowOnderdeelForm(false); setNewOnderdeelNaam(""); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {showActies && showActieForm && canEdit && (
          <ActieForm
            testPrefix={item.id}
            isPending={addActieMutation.isPending}
            onSave={(datum, tekst) => addActieMutation.mutate({ datum, tekst })}
            onCancel={() => setShowActieForm(false)}
          />
        )}

        {showActies && onderdelen.length > 0 && (
          <div className="space-y-1.5">
            {onderdelen.map(ond => (
              <OnderdeelSection
                key={ond.id}
                onderdeel={ond}
                jaarplanId={item.id}
                canEdit={canEdit}
                onDelete={() => deleteOnderdeelMutation.mutate(ond.id)}
              />
            ))}
          </div>
        )}

        {showActies && looseActies.length > 0 && (
          <div className="divide-y divide-border/40">
            {looseActies.map(actie => (
              <ActieRow key={actie.id} actie={actie} canEdit={canEdit}
                onDelete={() => deleteActieMutation.mutate(actie.id)}
                onStatusChange={status => updateActieStatusMutation.mutate({ id: actie.id, status })}
              />
            ))}
          </div>
        )}

        {showActies && totalCount === 0 && !showActieForm && !showOnderdeelForm && (
          <p className="text-xs text-muted-foreground italic">Nog geen activiteiten geregistreerd</p>
        )}
      </div>
    </div>
  );
}

function JaarplanSection({ currentUser }: { currentUser?: User | null }) {
  const { toast } = useToast();
  const isAdmin = isAdminRole(currentUser?.role) || currentUser?.role === "manager_az";
  const isPureManager = currentUser?.role === "manager";
  const canEdit = isAdmin || isPureManager;
  const myDept = currentUser?.department || "";

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingItem, setEditingItem] = useState<JaarplanItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adminAfdeling, setAdminAfdeling] = useState("__all__");
  const [progressFilter, setProgressFilter] = useState<"all" | "incomplete" | "complete">(() => {
    if (typeof window === "undefined") return "all";
    const saved = window.sessionStorage.getItem("jaarplanProgressFilter");
    return saved === "incomplete" || saved === "complete" || saved === "all" ? saved : "all";
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.sessionStorage.setItem("jaarplanProgressFilter", progressFilter);
  }, [progressFilter]);
  const [formData, setFormData] = useState({
    afspraken: "",
    startDatum: "",
    eindDatum: "",
    status: "niet gestart",
  });
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [printData, setPrintData] = useState<Record<string, {
    onderdelen: JaarplanOnderdeel[];
    actiesByOnderdeel: Record<string, JaarplanActie[]>;
    looseActies: JaarplanActie[];
  }> | null>(null);

  const { data: departments } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/departments"],
    enabled: isAdmin,
  });

  const { data: items = [], isLoading } = useQuery<JaarplanItem[]>({
    queryKey: ["/api/jaarplan", selectedYear, adminAfdeling],
    queryFn: async () => {
      let url = `/api/jaarplan?year=${selectedYear}`;
      if (isAdmin && adminAfdeling && adminAfdeling !== "__all__") url += `&afdeling=${encodeURIComponent(adminAfdeling)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("POST", "/api/jaarplan", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan"] });
      toast({ title: "Jaarplan opgeslagen" });
      handleCloseForm();
    },
    onError: () => toast({ title: "Opslaan mislukt", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jaarplan/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jaarplan"] });
      toast({ title: "Plan verwijderd" });
    },
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ afspraken: "", startDatum: "", eindDatum: "", status: "niet gestart" });
  };

  const handleNewItem = () => { handleCloseForm(); setShowForm(true); };

  const handleEditItem = (item: JaarplanItem) => {
    setEditingItem(item);
    if (isAdmin) setAdminAfdeling(item.afdeling);
    setFormData({
      afspraken: item.afspraken,
      startDatum: item.startDatum || "",
      eindDatum: item.eindDatum || "",
      status: item.status || "niet gestart",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.afspraken.trim()) {
      toast({ title: "Vul de afspraken in", variant: "destructive" });
      return;
    }
    const afdeling = isAdmin ? (adminAfdeling !== "__all__" ? adminAfdeling : "") : myDept;
    if (!afdeling) {
      toast({ title: "Selecteer een afdeling voor het plan", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      afdeling,
      year: selectedYear,
      ...formData,
      startDatum: formData.startDatum || null,
      eindDatum: formData.eindDatum || null,
      editId: editingItem?.id,
    });
  };

  const actiesQueries = useQueries({
    queries: items.map(item => ({
      queryKey: ["/api/jaarplan", item.id, "acties"],
      queryFn: async () => {
        const res = await fetch(`/api/jaarplan/${item.id}/acties`, { credentials: "include" });
        if (!res.ok) throw new Error("Ophalen mislukt");
        return res.json() as Promise<JaarplanActie[]>;
      },
    })),
  });

  const filteredItems = items.filter((_item, idx) => {
    if (progressFilter === "all") return true;
    const q = actiesQueries[idx];
    const acties = q?.data as JaarplanActie[] | undefined;
    if (acties === undefined) return true;
    if (acties.length === 0) return progressFilter === "incomplete";
    const allDone = acties.every(a => a.status === "afgerond");
    return progressFilter === "complete" ? allDone : !allDone;
  });

  const groupedByAfdeling = filteredItems.reduce((acc, item) => {
    const dept = item.afdeling || "Onbekend";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(item);
    return acc;
  }, {} as Record<string, JaarplanItem[]>);

  const fetchJson = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`Ophalen mislukt: ${url}`);
    return res.json();
  };

  const handlePrint = async () => {
    setIsPrintLoading(true);
    try {
      const data: Record<string, {
        onderdelen: JaarplanOnderdeel[];
        actiesByOnderdeel: Record<string, JaarplanActie[]>;
        looseActies: JaarplanActie[];
      }> = {};
      await Promise.all(items.map(async (item) => {
        const [acties, onderdelen] = await Promise.all([
          fetchJson<JaarplanActie[]>(`/api/jaarplan/${item.id}/acties`),
          fetchJson<JaarplanOnderdeel[]>(`/api/jaarplan/${item.id}/onderdelen`),
        ]);
        const actiesByOnderdeel: Record<string, JaarplanActie[]> = {};
        await Promise.all(onderdelen.map(async (ond) => {
          actiesByOnderdeel[ond.id] = await fetchJson<JaarplanActie[]>(`/api/jaarplan/onderdelen/${ond.id}/acties`);
        }));
        data[item.id] = {
          onderdelen,
          actiesByOnderdeel,
          looseActies: acties.filter(a => !a.onderdeelId),
        };
      }));
      setPrintData(data);
      setTimeout(() => {
        window.print();
        setPrintData(null);
        setIsPrintLoading(false);
      }, 200);
    } catch {
      toast({ title: "Afdrukken mislukt", variant: "destructive" });
      setIsPrintLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)} data-testid="button-jaarplan-year-prev">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[60px] text-center" data-testid="text-jaarplan-year">{selectedYear}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)} data-testid="button-jaarplan-year-next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={progressFilter} onValueChange={(v) => setProgressFilter(v as "all" | "incomplete" | "complete")}>
            <SelectTrigger className="w-48 h-8 text-sm" data-testid="select-jaarplan-progress-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-progress-all">Alle plannen</SelectItem>
              <SelectItem value="incomplete" data-testid="filter-progress-incomplete">Niet volledig afgerond</SelectItem>
              <SelectItem value="complete" data-testid="filter-progress-complete">Volledig afgerond</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={adminAfdeling} onValueChange={setAdminAfdeling}>
              <SelectTrigger className="w-44 h-8 text-sm" data-testid="select-jaarplan-admin-afdeling">
                <SelectValue placeholder="Alle afdelingen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle afdelingen</SelectItem>
                {departments?.sort((a, b) => a.name.localeCompare(b.name)).map(d => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canEdit && (
            <Button onClick={handleNewItem} data-testid="button-new-jaarplan">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Plan
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="outline" onClick={handlePrint} disabled={isPrintLoading} data-testid="button-print-jaarplan">
              <Printer className="h-4 w-4 mr-2" />
              {isPrintLoading ? "Laden..." : "Afdrukken"}
            </Button>
          )}
        </div>
      </div>

      {showForm && canEdit && (
        <Card className="border border-border/60 print:hidden">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{editingItem ? "Plan bewerken" : "Nieuw jaarplan"}</h4>
              <Button variant="ghost" size="sm" onClick={handleCloseForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAdmin && (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Afdeling</label>
                  <Select value={adminAfdeling} onValueChange={setAdminAfdeling}>
                    <SelectTrigger data-testid="select-jaarplan-department">
                      <SelectValue placeholder="Selecteer afdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.sort((a, b) => a.name.localeCompare(b.name)).map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isPureManager && myDept && (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Afdeling</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{myDept}</span>
                  </div>
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Plan / Afspraken</label>
                <Textarea
                  value={formData.afspraken}
                  onChange={e => setFormData(prev => ({ ...prev, afspraken: e.target.value }))}
                  placeholder="Beschrijf het plan of de gemaakte afspraken..."
                  rows={3}
                  data-testid="input-jaarplan-plan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Startdatum</label>
                <Input type="date" value={formData.startDatum} onChange={e => setFormData(prev => ({ ...prev, startDatum: e.target.value }))} data-testid="input-jaarplan-start" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Einddatum</label>
                <Input type="date" value={formData.eindDatum} onChange={e => setFormData(prev => ({ ...prev, eindDatum: e.target.value }))} data-testid="input-jaarplan-eind" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger data-testid="select-jaarplan-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseForm}>Annuleren</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-jaarplan">
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="print:hidden">
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : items.length === 0 ? (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Geen jaarplannen voor {selectedYear}</p>
              {canEdit && (
                <Button variant="link" onClick={handleNewItem} className="mt-2" data-testid="button-new-jaarplan-empty">
                  Voeg een plan toe
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-jaarplan-filter-empty">
                Geen plannen die voldoen aan het gekozen filter
              </p>
              <Button variant="link" onClick={() => setProgressFilter("all")} className="mt-2" data-testid="button-clear-progress-filter">
                Toon alle plannen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByAfdeling).sort(([a], [b]) => a.localeCompare(b)).map(([afdeling, afdelingItems]) => (
              <Card key={afdeling} className="border border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold" data-testid={`jaarplan-afdeling-${afdeling}`}>{afdeling}</h3>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {afdelingItems.map(item => (
                    <JaarplanItemCard
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => deleteMutation.mutate(item.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {printData && (
        <div className="hidden print:block print-jaarplan-layout">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">Jaarplan {selectedYear}</h1>
            {adminAfdeling !== "__all__" && <p className="text-sm text-gray-600 mt-1">Afdeling: {adminAfdeling}</p>}
          </div>
          {Object.entries(groupedByAfdeling).sort(([a], [b]) => a.localeCompare(b)).map(([afdeling, afdelingItems]) => (
            <div key={afdeling} className="mb-8 break-inside-avoid-page">
              <div className="flex items-center gap-2 border-b-2 border-gray-800 pb-1 mb-3">
                <h2 className="text-base font-bold">{afdeling}</h2>
              </div>
              {afdelingItems.map(item => {
                const itemData = printData[item.id];
                const statusOpt = statusOptions.find(s => s.value === item.status) || statusOptions[0];
                const allActies = [
                  ...(itemData?.looseActies || []),
                  ...Object.values(itemData?.actiesByOnderdeel || {}).flat(),
                ];
                const afgerond = allActies.filter(a => a.status === "afgerond").length;
                const totaal = allActies.length;
                return (
                  <div key={item.id} className="mb-5 pl-2 border-l-4 border-gray-300">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold whitespace-pre-wrap flex-1">{item.afspraken}</p>
                      <span className="text-xs font-medium border border-gray-400 rounded px-1.5 py-0.5 shrink-0">{statusOpt.label}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      {item.startDatum && <span>Start: {formatDate(item.startDatum)}</span>}
                      {item.eindDatum && <span>Einde: {formatDate(item.eindDatum)}</span>}
                      {totaal > 0 && <span>{afgerond}/{totaal} acties afgerond</span>}
                    </div>
                    {itemData && (
                      <div className="space-y-3 pl-2">
                        {itemData.onderdelen.map(ond => {
                          const ondActies = itemData.actiesByOnderdeel[ond.id] || [];
                          return (
                            <div key={ond.id} className="mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                                <span>▶</span>
                                <span>{ond.naam}</span>
                              </div>
                              {ondActies.length > 0 ? (
                                <div className="pl-4 space-y-0.5">
                                  {ondActies.map(actie => {
                                    const aStatusOpt = statusOptions.find(s => s.value === (actie.status ?? "niet gestart")) || statusOptions[0];
                                    return (
                                      <div key={actie.id} className="flex items-start gap-2 text-xs py-0.5">
                                        <span className="text-gray-400 shrink-0 min-w-[70px]">{formatDate(actie.datum)}</span>
                                        <span className="flex-1">{actie.actie}</span>
                                        <span className="text-gray-500 shrink-0 italic">{aStatusOpt.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="pl-4 text-xs text-gray-400 italic">Geen acties</p>
                              )}
                            </div>
                          );
                        })}
                        {itemData.looseActies.length > 0 && (
                          <div>
                            {itemData.onderdelen.length > 0 && (
                              <div className="text-xs font-semibold text-gray-700 mb-1">Overige acties</div>
                            )}
                            <div className="pl-2 space-y-0.5">
                              {itemData.looseActies.map(actie => {
                                const aStatusOpt = statusOptions.find(s => s.value === (actie.status ?? "niet gestart")) || statusOptions[0];
                                return (
                                  <div key={actie.id} className="flex items-start gap-2 text-xs py-0.5">
                                    <span className="text-gray-400 shrink-0 min-w-[70px]">{formatDate(actie.datum)}</span>
                                    <span className="flex-1">{actie.actie}</span>
                                    <span className="text-gray-500 shrink-0 italic">{aStatusOpt.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {itemData.onderdelen.length === 0 && itemData.looseActies.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Geen activiteiten geregistreerd</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BeloningenPage() {
  const [activeTab, setActiveTab] = useState("functionering");
  const [deptOpen, setDeptOpen] = useState(false);
  const [mgrOpen, setMgrOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: yearlyAwards } = useQuery<YearlyAward[]>({
    queryKey: ["/api/yearly-awards"],
  });

  const deptForm = useForm<{ year: number; name: string }>({
    defaultValues: { year: new Date().getFullYear(), name: "" },
  });

  const mgrForm = useForm<{ year: number; name: string }>({
    defaultValues: { year: new Date().getFullYear(), name: "" },
  });

  const [deptPhoto, setDeptPhoto] = useState<File | null>(null);
  const [mgrPhoto, setMgrPhoto] = useState<File | null>(null);

  const createAwardMutation = useMutation({
    mutationFn: async (data: { year: number; type: string; name: string; photo: File | null }) => {
      const formData = new FormData();
      formData.append("year", String(data.year));
      formData.append("type", data.type);
      formData.append("name", data.name);
      formData.append("awardedBy", user?.id || "");
      if (data.photo) {
        formData.append("photo", data.photo);
      }
      const res = await fetch("/api/yearly-awards", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fout bij opslaan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-awards"] });
      toast({ title: "Jaarlijkse onderscheiding toegekend" });
      setDeptOpen(false);
      setMgrOpen(false);
      setDeptPhoto(null);
      setMgrPhoto(null);
      deptForm.reset({ year: new Date().getFullYear(), name: "" });
      mgrForm.reset({ year: new Date().getFullYear(), name: "" });
    },
    onError: () => {
      toast({ title: "Fout bij toekennen", variant: "destructive" });
    },
  });

  const deleteAwardMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/yearly-awards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-awards"] });
      toast({ title: "Onderscheiding verwijderd" });
    },
    onError: () => {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Beloningen"
        subtitle="Functionering, beoordeling en beloning"
        imageSrc="/uploads/App_pics/beloningen.png"
        imageAlt="beloningen"
      />
      <div className="p-6 space-y-4">
      <div className="flex items-center justify-end gap-4 flex-wrap print:hidden">
        {activeTab === "beloningsysteem" && (isAdminRole(user?.role) || user?.role === "manager_az") && (
          <>
            <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-dept-award">
                  <Building2 className="h-4 w-4 mr-2" />
                  Afdeling van het Jaar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Afdeling van het Jaar</DialogTitle>
                </DialogHeader>
                <form onSubmit={deptForm.handleSubmit((d) => createAwardMutation.mutate({ ...d, type: "department", photo: deptPhoto }))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jaar</label>
                    <Input type="number" {...deptForm.register("year", { valueAsNumber: true })} data-testid="input-dept-award-year" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Naam Afdeling</label>
                    <Input {...deptForm.register("name", { required: true })} placeholder="Bijv. Financiën" data-testid="input-dept-award-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Foto (optioneel)</label>
                    <Input type="file" accept="image/*" onChange={(e) => setDeptPhoto(e.target.files?.[0] || null)} data-testid="input-dept-award-photo" />
                    {deptPhoto && <p className="text-xs text-muted-foreground">{deptPhoto.name}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={createAwardMutation.isPending} data-testid="button-submit-dept-award">
                    {createAwardMutation.isPending ? "Opslaan..." : "Opslaan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={mgrOpen} onOpenChange={setMgrOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-mgr-award">
                  <Award className="h-4 w-4 mr-2" />
                  Manager van het Jaar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manager van het Jaar</DialogTitle>
                </DialogHeader>
                <form onSubmit={mgrForm.handleSubmit((d) => createAwardMutation.mutate({ ...d, type: "manager", photo: mgrPhoto }))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jaar</label>
                    <Input type="number" {...mgrForm.register("year", { valueAsNumber: true })} data-testid="input-mgr-award-year" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Naam Manager</label>
                    <Input {...mgrForm.register("name", { required: true })} placeholder="Bijv. Jan de Vries" data-testid="input-mgr-award-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Foto (optioneel)</label>
                    <Input type="file" accept="image/*" onChange={(e) => setMgrPhoto(e.target.files?.[0] || null)} data-testid="input-mgr-award-photo" />
                    {mgrPhoto && <p className="text-xs text-muted-foreground">{mgrPhoto.name}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={createAwardMutation.isPending} data-testid="button-submit-mgr-award">
                    {createAwardMutation.isPending ? "Opslaan..." : "Opslaan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div className="flex gap-1 border-b print:hidden">
        <button
          onClick={() => setActiveTab("functionering")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "functionering"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-functionering"
        >
          <ClipboardCheck className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Functionering
        </button>
        <button
          onClick={() => setActiveTab("beoordeling")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "beoordeling"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-beoordeling"
        >
          <UserCheck className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Beoordeling
        </button>
        <button
          onClick={() => setActiveTab("jaarplan")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "jaarplan"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-jaarplan"
        >
          <FileText className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Jaarplan
        </button>
        <button
          onClick={() => setActiveTab("beloningsysteem")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "beloningsysteem"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-beloningsysteem"
        >
          <Gift className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Beloning
        </button>
      </div>

      {activeTab === "functionering" && (
        <FunctioneringForm users={users} currentUser={user} />
      )}

      {activeTab === "beoordeling" && (
        <BeoordelingSection users={users} currentUser={user} />
      )}

      {activeTab === "jaarplan" && (
        <JaarplanSection currentUser={user} />
      )}

      {activeTab === "beloningsysteem" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)} data-testid="button-award-year-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold min-w-[60px] text-center" data-testid="text-award-year">{selectedYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)} data-testid="button-award-year-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Afdeling van het Jaar</h3>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const deptAwards = yearlyAwards?.filter(a => a.type === "department" && a.year === selectedYear) || [];
                  if (deptAwards.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-6">Geen afdeling toegekend voor {selectedYear}</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {deptAwards.map((award) => (
                        <div key={award.id} className="p-3 rounded-md border space-y-3" data-testid={`dept-award-${award.id}`}>
                          {award.photo && (
                            <img src={award.photo} alt={award.name} className="w-full h-auto object-contain rounded-md" />
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{award.name}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(award.awardedAt)}</p>
                            </div>
                            {(isAdminRole(user?.role) || user?.role === "manager_az") && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteAwardMutation.mutate(award.id)} data-testid={`button-delete-dept-award-${award.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {(() => {
              const mgrAwards = yearlyAwards?.filter(a => a.type === "manager" && a.year === selectedYear) || [];
              const mgrNames = mgrAwards.map(a => a.name).filter(Boolean).join(", ");
              return (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">
                      Manager van het Jaar{mgrNames ? <span className="font-normal text-muted-foreground">: {mgrNames}</span> : ""}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {mgrAwards.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Geen manager toegekend voor {selectedYear}</p>
                    ) : (
                      <div className="space-y-3">
                        {mgrAwards.map((award) => (
                          <div key={award.id} className="p-3 rounded-md border space-y-3" data-testid={`mgr-award-${award.id}`}>
                            {award.photo && (
                              <img src={award.photo} alt={award.name} className="w-full h-auto object-contain rounded-md" />
                            )}
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <Award className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{award.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(award.awardedAt)}</p>
                              </div>
                              {(isAdminRole(user?.role) || user?.role === "manager_az") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteAwardMutation.mutate(award.id)} data-testid={`button-delete-mgr-award-${award.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
