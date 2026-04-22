import { useState, useMemo, useEffect, useCallback } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  Plus, ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock,
  Trash2, Pencil, Cake, Award, Flag, Upload, X,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import { nl } from "date-fns/locale";
import type { Event, User, OfficialHoliday, Snipperdag } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { formatDate } from "@/lib/dateUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getKalenderLastSeenKey(userId: string) {
  return `kalender_last_seen_${userId}`;
}

function getKalenderLastSeen(userId: string): number {
  const key = getKalenderLastSeenKey(userId);
  const val = localStorage.getItem(key);
  if (!val) {
    const now = Date.now().toString();
    localStorage.setItem(key, now);
    return parseInt(now, 10);
  }
  return parseInt(val, 10);
}

const KALENDER_SEEN_EVENT = "kalender-seen";

function setKalenderLastSeen(userId: string) {
  localStorage.setItem(getKalenderLastSeenKey(userId), Date.now().toString());
  window.dispatchEvent(new CustomEvent(KALENDER_SEEN_EVENT));
}

export function useKalenderNotifications() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const [lastSeen, setLastSeenState] = useState(() => getKalenderLastSeen(userId));

  useEffect(() => {
    setLastSeenState(getKalenderLastSeen(userId));
  }, [userId]);

  useEffect(() => {
    const handler = () => setLastSeenState(getKalenderLastSeen(userId));
    window.addEventListener(KALENDER_SEEN_EVENT, handler);
    return () => window.removeEventListener(KALENDER_SEEN_EVENT, handler);
  }, [userId]);

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: snipperdagenData } = useQuery<Snipperdag[]>({
    queryKey: ["/api/snipperdagen"],
  });

  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const newEventsCount = (events || []).filter(e => {
    if (e.date < currentMonthStart || e.date > currentMonthEnd) return false;
    if (!e.createdAt) return false;
    return new Date(e.createdAt).getTime() > lastSeen;
  }).length;

  const newSnipperdagenCount = (snipperdagenData || []).filter(s => {
    if (s.date < currentMonthStart || s.date > currentMonthEnd) return false;
    return new Date(s.createdAt).getTime() > lastSeen;
  }).length;

  const totalNew = newEventsCount + newSnipperdagenCount;

  const markSeen = useCallback(() => {
    if (userId) {
      setKalenderLastSeen(userId);
    }
  }, [userId]);

  return { totalNew, markSeen };
}

const eventFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().optional(),
  date: z.string().min(1, "Datum is verplicht"),
  endDate: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
});

interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  type: "event" | "verjaardag" | "jubileum" | "feestdag" | "snipperdag";
  category?: string | null;
  description?: string | null;
  time?: string | null;
  location?: string | null;
  event?: Event;
  createdByUser?: User;
}

function getDutchHolidays(year: number): CalendarEntry[] {
  const easterDate = computeEaster(year);
  const easter = new Date(easterDate);

  const goedeVrijdag = new Date(easter);
  goedeVrijdag.setDate(easter.getDate() - 2);
  const tweedePaasdag = new Date(easter);
  tweedePaasdag.setDate(easter.getDate() + 1);
  const hemelvaartsdag = new Date(easter);
  hemelvaartsdag.setDate(easter.getDate() + 39);
  const eersteePinksterdag = new Date(easter);
  eersteePinksterdag.setDate(easter.getDate() + 49);
  const tweedePinksterdag = new Date(easter);
  tweedePinksterdag.setDate(easter.getDate() + 50);

  const holidays: { name: string; date: Date }[] = [
    { name: "Nieuwjaarsdag", date: new Date(year, 0, 1) },
    { name: "Goede Vrijdag", date: goedeVrijdag },
    { name: "Eerste Paasdag", date: easter },
    { name: "Tweede Paasdag", date: tweedePaasdag },
    { name: "Koningsdag", date: new Date(year, 3, 27) },
    { name: "Bevrijdingsdag", date: new Date(year, 4, 5) },
    { name: "Hemelvaartsdag", date: hemelvaartsdag },
    { name: "Eerste Pinksterdag", date: eersteePinksterdag },
    { name: "Tweede Pinksterdag", date: tweedePinksterdag },
    { name: "Eerste Kerstdag", date: new Date(year, 11, 25) },
    { name: "Tweede Kerstdag", date: new Date(year, 11, 26) },
  ];

  return holidays.map((h) => ({
    id: `feestdag-${h.name}-${year}`,
    title: h.name,
    date: format(h.date, "yyyy-MM-dd"),
    type: "feestdag" as const,
    description: "Nationale feestdag",
  }));
}

function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getBirthdaysForMonth(users: User[], currentMonth: Date): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  for (const u of users) {
    if (!u.birthDate || !u.active) continue;
    const bd = new Date(u.birthDate + "T00:00:00");
    if (bd.getMonth() === month) {
      const age = year - bd.getFullYear();
      entries.push({
        id: `verjaardag-${u.id}-${year}`,
        title: `${u.fullName} (${age} jaar)`,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`,
        type: "verjaardag",
        description: `Verjaardag van ${u.fullName}`,
      });
    }
  }
  return entries;
}

function getAnniversariesForMonth(users: User[], currentMonth: Date): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  for (const u of users) {
    if (!u.startDate || !u.active) continue;
    const sd = new Date(u.startDate + "T00:00:00");
    if (sd.getMonth() === month && sd.getFullYear() < year) {
      const years = year - sd.getFullYear();
      entries.push({
        id: `jubileum-${u.id}-${year}`,
        title: `${u.fullName} (${years} jaar in dienst)`,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(sd.getDate()).padStart(2, "0")}`,
        type: "jubileum",
        description: `Werkjubileum van ${u.fullName}`,
      });
    }
  }
  return entries;
}

const typeConfig: Record<string, { icon: typeof Cake; color: string; label: string }> = {
  verjaardag: {
    icon: Cake,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    label: "Verjaardag",
  },
  jubileum: {
    icon: Award,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Jubileum",
  },
  feestdag: {
    icon: Flag,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    label: "Feestdag",
  },
  snipperdag: {
    icon: Flag,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Snipperdag",
  },
  event: {
    icon: CalendarDays,
    color: "",
    label: "Evenement",
  },
};

const categoryColors: Record<string, string> = {
  vergadering: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  training: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sociaal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function EventFormDialog({
  open,
  onOpenChange,
  editEvent,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Event | null;
  initialDate?: string;
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: editEvent?.title || "",
      description: editEvent?.description || "",
      date: editEvent?.date || initialDate || "",
      endDate: editEvent?.endDate || "",
      time: editEvent?.time || "",
      location: editEvent?.location || "",
      category: editEvent?.category || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof eventFormSchema>) => {
      const payload = {
        ...data,
        description: data.description || null,
        endDate: data.endDate || null,
        time: data.time || null,
        location: data.location || null,
        category: data.category || null,
        createdBy: user?.id || null,
      };
      if (editEvent) {
        await apiRequest("PATCH", `/api/events/${editEvent.id}`, payload);
      } else {
        await apiRequest("POST", "/api/events", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: editEvent ? "Evenement bijgewerkt" : "Evenement aangemaakt" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Evenement Bewerken" : "Nieuw Evenement"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl><Input {...field} data-testid="input-event-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Beschrijving</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-event-description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Startdatum</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-event-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Einddatum</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-event-enddate" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tijd</FormLabel>
                  <FormControl><Input type="time" {...field} data-testid="input-event-time" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Locatie</FormLabel>
                  <FormControl><Input {...field} data-testid="input-event-location" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-event-category"><SelectValue placeholder="Selecteer categorie" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vergadering">Vergadering</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="sociaal">Sociaal</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-event">
              {mutation.isPending ? "Opslaan..." : editEvent ? "Bijwerken" : "Evenement Opslaan"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DayDetail({
  date,
  entries,
  onClose,
  onEditEvent,
  onDeleteEvent,
  canManage,
}: {
  date: Date;
  entries: CalendarEntry[];
  onClose: () => void;
  onEditEvent: (e: Event) => void;
  onDeleteEvent: (id: string) => void;
  canManage: boolean;
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{format(date, "EEEE d MMMM yyyy", { locale: nl })}</DialogTitle>
        </DialogHeader>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen items op deze dag</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entries.map((entry) => {
              const conf = typeConfig[entry.type] || typeConfig.event;
              const Icon = conf.icon;
              const colorClass = entry.type === "event" && entry.category
                ? categoryColors[entry.category] || ""
                : conf.color;

              const creator = entry.createdByUser;
              const creatorInitials = creator
                ? [creator.voornamen || creator.fullName?.split(" ")[0], creator.achternaam || creator.fullName?.split(" ").slice(-1)[0]]
                    .filter(Boolean).map(s => s![0].toUpperCase()).join("")
                : "";

              return (
                <div key={entry.id} className="flex items-start gap-3 p-2 rounded-md hover-elevate" data-testid={`detail-entry-${entry.id}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass || "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.title}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{conf.label}</Badge>
                      {entry.time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {entry.time}
                        </span>
                      )}
                      {entry.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {entry.location}
                        </span>
                      )}
                    </div>
                    {entry.type === "event" && creator && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Avatar className="h-5 w-5">
                          {creator.avatar && <AvatarImage src={creator.avatar} alt={creator.fullName || ""} className="object-cover" />}
                          <AvatarFallback className="text-[8px] bg-[hsl(48,96%,53%)] text-[hsl(152,30%,10%)] font-semibold">
                            {creatorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{creator.fullName}</span>
                      </div>
                    )}
                  </div>
                  {entry.type === "event" && entry.event && canManage && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => onEditEvent(entry.event!)} data-testid={`button-edit-event-${entry.event.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDeleteEvent(entry.event!.id)} data-testid={`button-delete-event-${entry.event.id}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HolidayUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [holidays, setHolidays] = useState<{ name: string; date: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  const { data: existingHolidays, isLoading } = useQuery<OfficialHoliday[]>({
    queryKey: ["/api/official-holidays", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/official-holidays?year=${selectedYear}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fout bij ophalen");
      return res.json();
    },
  });

  const hasUnsaved = holidays.length > 0;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/official-holidays", {
        year: parseInt(selectedYear),
        holidays,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-holidays"] });
      toast({ title: "Vakantiedagen opgeslagen", description: `${holidays.length} dagen voor ${selectedYear}` });
      setHolidays([]);
    },
    onError: (err: any) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });

  const addSingleMutation = useMutation({
    mutationFn: async ({ name, date }: { name: string; date: string }) => {
      await apiRequest("POST", "/api/official-holidays/single", {
        year: parseInt(selectedYear),
        name,
        date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-holidays"] });
      setNewName("");
      setNewDate("");
      toast({ title: "Vakantiedag toegevoegd" });
    },
    onError: (err: any) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/official-holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-holidays"] });
      toast({ title: "Vakantiedag verwijderd" });
    },
  });

  const addRow = () => {
    if (!newName.trim() || !newDate) return;
    addSingleMutation.mutate({ name: newName.trim(), date: newDate });
  };

  const removeRow = (idx: number) => {
    setHolidays(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const parsed: { name: string; date: string }[] = [];
      for (const line of lines) {
        const sep = line.includes(";") ? ";" : ",";
        const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 2) {
          const [dateStr, name] = parts[0].match(/^\d/) ? [parts[0], parts[1]] : [parts[1], parts[0]];
          const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/) ||
            dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
          if (dateMatch && name) {
            let isoDate: string;
            if (dateStr.match(/^\d{4}/)) {
              isoDate = dateStr;
            } else {
              isoDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
            }
            parsed.push({ name, date: isoDate });
          }
        }
      }
      if (parsed.length === 0) {
        toast({ title: "Geen geldige data gevonden", description: "Verwacht CSV-formaat: datum,naam (bijv. 2026-01-01,Nieuwjaarsdag)", variant: "destructive" });
      } else {
        setHolidays(parsed);
        toast({ title: `${parsed.length} dagen ingelezen uit bestand` });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Officiële Vakantiedagen Beheren
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Jaar</label>
            <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setHolidays([]); }}>
              <SelectTrigger className="w-32" data-testid="select-holiday-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium">CSV Importeren</label>
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="cursor-pointer"
              data-testid="input-holiday-file"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">CSV-formaat: dd-mm-yyyy datum,naam — bijv. <code>2026-01-01,Nieuwjaarsdag</code> of <code>01-01-2026,Nieuwjaarsdag</code></p>

        {(existingHolidays && existingHolidays.length > 0 && !hasUnsaved) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Huidige vakantiedagen ({selectedYear})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingHolidays.map(h => (
                  <TableRow key={h.id} data-testid={`row-holiday-${h.id}`}>
                    <TableCell className="text-sm">
                      {formatDate(h.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{h.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteMutation.mutate(h.id)}
                        data-testid={`button-delete-holiday-${h.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {hasUnsaved && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Nieuwe vakantiedagen ({holidays.length})</h3>
            <p className="text-xs text-muted-foreground">Opslaan vervangt alle bestaande dagen voor {selectedYear}.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((h, idx) => (
                  <TableRow key={idx} data-testid={`row-new-holiday-${idx}`}>
                    <TableCell className="text-sm">
                      {formatDate(h.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{h.name}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(idx)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex gap-2 items-end border-t pt-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium">Naam</label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="bijv. Koningsdag"
              data-testid="input-holiday-name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Datum</label>
            <Input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              data-testid="input-holiday-date"
            />
          </div>
          <Button variant="outline" onClick={addRow} disabled={!newName.trim() || !newDate || addSingleMutation.isPending} data-testid="button-add-holiday-row">
            <Plus className="h-4 w-4 mr-1" />
            {addSingleMutation.isPending ? "Opslaan..." : "Toevoegen"}
          </Button>
        </div>

        {hasUnsaved && (
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setHolidays([])} data-testid="button-cancel-holidays">
              Annuleren
            </Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} data-testid="button-save-holidays">
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? "Opslaan..." : `${holidays.length} dagen opslaan`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function KalenderPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string>("");
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [holidayUploadOpen, setHolidayUploadOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { markSeen } = useKalenderNotifications();

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: officialHolidayData } = useQuery<OfficialHoliday[]>({
    queryKey: ["/api/official-holidays"],
  });

  const { data: snipperdagenData } = useQuery<Snipperdag[]>({
    queryKey: ["/api/snipperdagen"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Evenement verwijderd" });
      setSelectedDay(null);
    },
  });

  const canManage = isAdminRole(user?.role) || user?.role === "manager";

  const allEntries = useMemo(() => {
    const year = currentMonth.getFullYear();
    const entries: CalendarEntry[] = [];

    if (events) {
      for (const ev of events) {
        const creator = ev.createdBy ? users?.find(u => u.id === ev.createdBy) : undefined;
        entries.push({
          id: `event-${ev.id}`,
          title: ev.title,
          date: ev.date,
          type: "event",
          category: ev.category,
          description: ev.description,
          time: ev.time,
          location: ev.location,
          event: ev,
          createdByUser: creator,
        });
      }
    }

    if (users) {
      entries.push(...getBirthdaysForMonth(users, currentMonth));
      entries.push(...getAnniversariesForMonth(users, currentMonth));
    }

    const prevMonth = subMonths(currentMonth, 1);
    const nextMonth = addMonths(currentMonth, 1);
    if (users) {
      entries.push(...getBirthdaysForMonth(users, prevMonth));
      entries.push(...getAnniversariesForMonth(users, prevMonth));
      entries.push(...getBirthdaysForMonth(users, nextMonth));
      entries.push(...getAnniversariesForMonth(users, nextMonth));
    }

    const addHolidaysForYear = (y: number) => {
      const uploaded = officialHolidayData?.filter(h => h.year === y);
      if (uploaded && uploaded.length > 0) {
        for (const h of uploaded) {
          entries.push({
            id: `feestdag-uploaded-${h.id}`,
            title: h.name,
            date: h.date,
            type: "feestdag",
            description: "Officiële vakantiedag",
          });
        }
      } else {
        entries.push(...getDutchHolidays(y));
      }
    };

    addHolidaysForYear(year);
    if (currentMonth.getMonth() === 0) addHolidaysForYear(year - 1);
    if (currentMonth.getMonth() === 11) addHolidaysForYear(year + 1);

    if (snipperdagenData) {
      for (const s of snipperdagenData) {
        entries.push({
          id: `snipperdag-${s.id}`,
          title: `📌 ${s.name}`,
          date: s.date,
          type: "snipperdag",
          description: "Verplichte vrije dag (snipperdag) — wordt afgetrokken van vakantiesaldo",
        });
      }
    }

    return entries;
  }, [events, users, currentMonth, officialHolidayData, snipperdagenData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEntriesForDay = (day: Date): CalendarEntry[] => {
    const dayStr = format(day, "yyyy-MM-dd");
    return allEntries.filter((e) => e.date === dayStr);
  };

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  const legendItems = [
    { type: "event", label: "Evenement", color: "bg-primary" },
    { type: "verjaardag", label: "Verjaardag", color: "bg-pink-500" },
    { type: "jubileum", label: "Jubileum", color: "bg-amber-500" },
    { type: "feestdag", label: "Feestdag", color: "bg-sky-400" },
    { type: "snipperdag", label: "Snipperdag", color: "bg-red-500" },
  ];

  if (loadingEvents) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Evenementen Kalender"
        subtitle="Beheer en bekijk alle evenementen en afspraken"
        imageSrc="/uploads/App_pics/kalender.png"
        imageAlt="kalender"
      />
      <div className="p-6 space-y-4">
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {isAdminRole(user?.role) && (
            <Button variant="outline" onClick={() => setHolidayUploadOpen(true)} data-testid="button-upload-holidays">
              <Upload className="h-4 w-4 mr-2" />
              Vakantiedagen
            </Button>
          )}
          {(isAdminRole(user?.role) || user?.role === "manager") && (
            <Button onClick={() => { setCreateDate(""); setCreateOpen(true); }} data-testid="button-add-event">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Evenement
            </Button>
          )}
        </div>
      </div>

      <EventFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={createDate}
      />
      {editEvent && (
        <EventFormDialog
          open={!!editEvent}
          onOpenChange={(open) => { if (!open) setEditEvent(null); }}
          editEvent={editEvent}
        />
      )}
      <HolidayUploadDialog
        open={holidayUploadOpen}
        onOpenChange={setHolidayUploadOpen}
      />
      {selectedDay && (
        <DayDetail
          date={selectedDay}
          entries={selectedDayEntries}
          onClose={() => setSelectedDay(null)}
          onEditEvent={(e) => { setSelectedDay(null); setEditEvent(e); }}
          onDeleteEvent={(id) => deleteMutation.mutate(id)}
          canManage={!!canManage}
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {legendItems.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${item.color}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button size="icon" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize" data-testid="text-current-month">
              {format(currentMonth, "MMMM yyyy", { locale: nl })}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} data-testid="button-today">
                Vandaag
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
            {weekDays.map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dayEntries = getEntriesForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0)) && !today;
              const isGray = inMonth && (isPast || isWeekend);
              const hasEvents = dayEntries.some((e) => e.type === "event");
              const hasBirthday = dayEntries.some((e) => e.type === "verjaardag");
              const hasAnniversary = dayEntries.some((e) => e.type === "jubileum");
              const hasHoliday = dayEntries.some((e) => e.type === "feestdag");
              const hasSnipperdag = dayEntries.some((e) => e.type === "snipperdag");

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[5rem] p-1 cursor-pointer transition-colors hover:bg-muted/50 ${
                    isGray ? "bg-muted/60" : "bg-background"
                  } ${!inMonth ? "opacity-40" : ""} ${today ? "ring-1 ring-inset ring-primary" : ""}`}
                  onClick={() => setSelectedDay(day)}
                  data-testid={`cal-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium leading-none p-1 rounded-md ${
                      today ? "bg-primary text-primary-foreground" : ""
                    }`}>
                      {format(day, "d")}
                    </span>
                    {dayEntries.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasEvents && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        {hasBirthday && <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />}
                        {hasAnniversary && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        {hasHoliday && <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                        {hasSnipperdag && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => {
                      const colorMap: Record<string, string> = {
                        verjaardag: "bg-pink-200 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300",
                        jubileum: "bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
                        feestdag: "bg-sky-200 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300",
                        snipperdag: "bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300",
                        event: entry.category && categoryColors[entry.category]
                          ? categoryColors[entry.category]
                          : "bg-primary/10 text-primary",
                      };
                      return (
                        <div
                          key={entry.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${colorMap[entry.type] || "bg-muted"}`}
                          title={entry.title}
                        >
                          {entry.title}
                        </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayEntries.length - 3} meer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
