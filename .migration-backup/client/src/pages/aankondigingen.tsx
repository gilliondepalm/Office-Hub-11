import { useState, useRef, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Plus, Megaphone, Pin, Trash2, AlertCircle, Pencil, FileText, Upload, X, Send, Mail, MailOpen, Reply, Clock, User as UserIcon, Users, Newspaper, Archive } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Announcement, Message, User } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { formatDateTime } from "@/lib/dateUtils";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht"),
  priority: z.string().default("normal"),
  pinned: z.boolean().default(false),
});

const messageFormSchema = z.object({
  toUserId: z.string().min(1, "Selecteer een medewerker"),
  subject: z.string().min(1, "Onderwerp is verplicht"),
  content: z.string().min(1, "Bericht is verplicht"),
});

function AnnouncementFormDialog({
  open,
  onOpenChange,
  editAnn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAnn?: Announcement | null;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfRemoved, setPdfRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const existingPdf = !pdfRemoved && !pdfFile ? (editAnn?.pdfUrl || null) : null;

  const form = useForm<z.infer<typeof announcementFormSchema>>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: editAnn?.title || "",
      content: editAnn?.content || "",
      priority: editAnn?.priority || "normal",
      pinned: editAnn?.pinned || false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof announcementFormSchema>) => {
      let pdfUrl: string | null = existingPdf;

      if (pdfFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        const uploadRes = await fetch("/api/upload/pdf", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!uploadRes.ok) {
          throw new Error("PDF upload mislukt");
        }
        const uploadData = await uploadRes.json();
        pdfUrl = uploadData.pdfUrl;
        setUploading(false);
      }

      const payload = { ...data, pdfUrl };

      if (editAnn) {
        await apiRequest("PATCH", `/api/announcements/${editAnn.id}`, payload);
      } else {
        await apiRequest("POST", "/api/announcements", {
          ...payload,
          createdBy: user?.id || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: editAnn ? "Aankondiging bijgewerkt" : "Aankondiging geplaatst" });
      onOpenChange(false);
      form.reset();
      setPdfFile(null);
      setPdfRemoved(false);
    },
    onError: () => {
      setUploading(false);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Alleen PDF-bestanden zijn toegestaan", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Bestand is te groot (max 10 MB)", variant: "destructive" });
        return;
      }
      setPdfFile(file);
      setPdfRemoved(false);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        setPdfFile(null);
        setPdfRemoved(false);
      }
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editAnn ? "Aankondiging Bewerken" : "Nieuwe Aankondiging"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl><Input {...field} data-testid="input-announcement-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Inhoud</FormLabel>
                <FormControl><Textarea {...field} rows={4} data-testid="input-announcement-content" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-0">Hoge prioriteit</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value === "high"}
                    onCheckedChange={(checked) => field.onChange(checked ? "high" : "normal")}
                    data-testid="switch-announcement-priority"
                  />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="pinned" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-0">Vastzetten</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-announcement-pinned" />
                </FormControl>
              </FormItem>
            )} />

            <div>
              <p className="text-sm font-medium mb-2">PDF-bijlage</p>
              {pdfFile ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{pdfFile.name}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={removePdf} data-testid="button-remove-pdf">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingPdf ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">Bestaand PDF-bestand</span>
                  <Button type="button" size="icon" variant="ghost" onClick={removePdf} data-testid="button-remove-pdf">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-pdf"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  PDF uploaden
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-pdf-file"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 10 MB, alleen PDF-bestanden</p>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending || uploading} data-testid="button-submit-announcement">
              {uploading ? "PDF uploaden..." : mutation.isPending ? "Opslaan..." : editAnn ? "Bijwerken" : "Aankondiging Plaatsen"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type MessageWithNames = Message & { fromUserName?: string; toUserName?: string };

function SendMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { data: allUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [sendMode, setSendMode] = useState<"individual" | "department">("individual");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const activeUsers = (allUsers || []).filter(u => u.active);
  const isManager = currentUser?.role === "manager";
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;

  const departmentUsers = activeUsers.filter(
    u => u.department && currentUser?.department && u.department === currentUser.department && u.id !== currentUser.id
  );

  const form = useForm<{ subject: string; content: string }>({
    resolver: zodResolver(z.object({
      subject: z.string().min(1, "Onderwerp is verplicht"),
      content: z.string().min(1, "Bericht is verplicht"),
    })),
    defaultValues: { subject: "", content: "" },
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const recipientIds = sendMode === "department"
        ? departmentUsers.map(u => u.id)
        : selectedUserIds;
      if (recipientIds.length === 0) {
        throw new Error("Selecteer minimaal één ontvanger");
      }
      if (recipientIds.length === 1) {
        await apiRequest("POST", "/api/messages", { toUserId: recipientIds[0], ...data });
      } else {
        await apiRequest("POST", "/api/messages", { toUserIds: recipientIds, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      const count = sendMode === "department" ? departmentUsers.length : selectedUserIds.length;
      toast({ title: `Bericht verzonden naar ${count} medewerker${count !== 1 ? "s" : ""}` });
      onOpenChange(false);
      form.reset();
      setSelectedUserIds([]);
      setSendMode("individual");
    },
    onError: (err: any) => {
      toast({ title: err.message || "Fout bij verzenden", variant: "destructive" });
    },
  });

  const handleSubmit = (data: { subject: string; content: string }) => {
    const recipientIds = sendMode === "department"
      ? departmentUsers.map(u => u.id)
      : selectedUserIds;
    if (recipientIds.length === 0) {
      toast({ title: "Selecteer minimaal één ontvanger", variant: "destructive" });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) { setSelectedUserIds([]); setSendMode("individual"); }
    }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bericht Sturen</DialogTitle>
        </DialogHeader>

        {(isManager || isAdmin) && departmentUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Verzendwijze</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sendMode === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSendMode("individual"); setSelectedUserIds([]); }}
                data-testid="button-mode-individual"
              >
                <UserIcon className="h-4 w-4 mr-1" />
                Selecteer medewerkers
              </Button>
              <Button
                type="button"
                variant={sendMode === "department" ? "default" : "outline"}
                size="sm"
                onClick={() => setSendMode("department")}
                data-testid="button-mode-department"
              >
                <Users className="h-4 w-4 mr-1" />
                Hele afdeling ({departmentUsers.length})
              </Button>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {sendMode === "individual" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Aan medewerker{selectedUserIds.length > 0 ? ` (${selectedUserIds.length} geselecteerd)` : ""}
                </label>
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {activeUsers.filter(u => u.id !== currentUser?.id).map(u => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      data-testid={`checkbox-user-${u.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded border-input"
                      />
                      <span className="text-sm flex-1">{u.fullName}</span>
                      <span className="text-xs text-muted-foreground">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {sendMode === "department" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Ontvangers: alle medewerkers in {currentUser?.department}
                </label>
                <div className="border rounded-md max-h-40 overflow-y-auto bg-muted/30">
                  {departmentUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" data-testid={`dept-user-${u.id}`}>
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm flex-1">{u.fullName}</span>
                      <span className="text-xs text-muted-foreground">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Onderwerp</FormLabel>
                <FormControl><Input {...field} data-testid="input-message-subject" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Bericht</FormLabel>
                <FormControl><Textarea {...field} rows={4} data-testid="input-message-content" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-send-message">
              <Send className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Verzenden..." : `Bericht Verzenden${sendMode === "department" ? ` (${departmentUsers.length})` : selectedUserIds.length > 1 ? ` (${selectedUserIds.length})` : ""}`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MessageDetailDialog({
  message,
  onClose,
  currentUserId,
}: {
  message: MessageWithNames | null;
  onClose: () => void;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");

  const isRecipient = message?.toUserId === currentUserId;
  const canReply = isRecipient && !message?.reply;

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!message) return;
      await apiRequest("PATCH", `/api/messages/${message.id}/reply`, { reply: replyText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "Reactie verzonden" });
      setReplyText("");
      onClose();
    },
    onError: () => {
      toast({ title: "Fout bij reageren", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (message && isRecipient && !message.read) {
      readMutation.mutate(message.id);
    }
  }, [message?.id]);

  return (
    <Dialog open={!!message} onOpenChange={(o) => { if (!o) { setReplyText(""); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {message?.subject}
          </DialogTitle>
        </DialogHeader>
        {message && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Van: <span className="font-medium text-foreground">{message.fromUserName}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Aan: <span className="font-medium text-foreground">{message.toUserName}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDateTime(message.createdAt)}</span>
            </div>

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm whitespace-pre-wrap" data-testid="text-message-content">{message.content}</p>
            </div>

            {message.reply && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Reply className="h-4 w-4" />
                  Reactie van {message.toUserName}
                </div>
                <div className="rounded-md bg-muted p-4 border-l-2 border-primary">
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-message-reply">{message.reply}</p>
                  {message.repliedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateTime(message.repliedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {canReply && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Uw reactie</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Typ uw reactie..."
                  data-testid="input-message-reply"
                />
                <Button
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-reply"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {replyMutation.isPending ? "Verzenden..." : "Reactie Verzenden"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type NieuwsbriefFile = { name: string; path: string; size: number; modified: string };

function getLastSeenKey(userId: string, tab: string) {
  return `aankondigingen_last_seen_${userId}_${tab}`;
}

function getLastSeen(userId: string, tab: string): number {
  const key = getLastSeenKey(userId, tab);
  const val = localStorage.getItem(key);
  if (!val) {
    const now = Date.now().toString();
    localStorage.setItem(key, now);
    return parseInt(now, 10);
  }
  return parseInt(val, 10);
}

const AANKONDIGINGEN_SEEN_EVENT = "aankondigingen-seen";

function setLastSeen(userId: string, tab: string) {
  localStorage.setItem(getLastSeenKey(userId, tab), Date.now().toString());
  window.dispatchEvent(new CustomEvent(AANKONDIGINGEN_SEEN_EVENT));
}

export function useAankondigingenNotifications() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(n => n + 1);
    window.addEventListener(AANKONDIGINGEN_SEEN_EVENT, handler);
    return () => window.removeEventListener(AANKONDIGINGEN_SEEN_EVENT, handler);
  }, []);

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: messagesData } = useQuery<MessageWithNames[]>({
    queryKey: ["/api/messages"],
  });

  const { data: nieuwsbrieven } = useQuery<NieuwsbriefFile[]>({
    queryKey: ["/api/uploads/nieuwsbrief"],
  });

  const newAnnouncementsCount = (announcements || []).filter(
    a => new Date(a.createdAt).getTime() > getLastSeen(userId, "announcements")
  ).length;

  const unreadMessagesCount = (messagesData || []).filter(
    m => m.toUserId === userId && !m.read
  ).length;

  const newMessagesCount = (messagesData || []).filter(
    m => (m.toUserId === userId || (m as any).fromUserId === userId) &&
      new Date((m as any).createdAt).getTime() > getLastSeen(userId, "messages")
  ).length;

  const newNieuwsbrievenCount = (nieuwsbrieven || []).filter(
    f => new Date(f.modified).getTime() > getLastSeen(userId, "nieuwsbrieven")
  ).length;

  const totalNew = newAnnouncementsCount + Math.max(unreadMessagesCount, newMessagesCount) + newNieuwsbrievenCount;

  return { newAnnouncementsCount, unreadMessagesCount, newMessagesCount, newNieuwsbrievenCount, totalNew };
}

export default function AankondigingenPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [sendMsgOpen, setSendMsgOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithNames | null>(null);
  const [activeTab, setActiveTab] = useState<"announcements" | "messages" | "nieuwsbrieven" | "archief">("announcements");
  const [deleteConfirmAnn, setDeleteConfirmAnn] = useState<Announcement | null>(null);
  const [permanentDeleteAnn, setPermanentDeleteAnn] = useState<Announcement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: archivedAnnouncements, isLoading: archivedLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/archived"],
    enabled: activeTab === "archief",
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessageWithNames[]>({
    queryKey: ["/api/messages"],
  });

  const { data: nieuwsbrieven } = useQuery<NieuwsbriefFile[]>({
    queryKey: ["/api/uploads/nieuwsbrief"],
  });

  const userId = user?.id || "";

  const [, forceUpdate] = useState(0);

  const newAnnouncementsCount = (announcements || []).filter(
    a => new Date(a.createdAt).getTime() > getLastSeen(userId, "announcements")
  ).length;

  const newNieuwsbrievenCount = (nieuwsbrieven || []).filter(
    f => new Date(f.modified).getTime() > getLastSeen(userId, "nieuwsbrieven")
  ).length;

  const newMessagesCount = (messagesData || []).filter(
    m => (m.toUserId === userId || (m as any).fromUserId === userId) &&
      new Date((m as any).createdAt).getTime() > getLastSeen(userId, "messages")
  ).length;

  const handleTabChange = (tab: "announcements" | "messages" | "nieuwsbrieven") => {
    setActiveTab(tab);
    if (userId) {
      setLastSeen(userId, tab);
      forceUpdate(n => n + 1);
    }
  };

  useEffect(() => {
    if (userId && activeTab === "announcements") {
      setLastSeen(userId, "announcements");
      forceUpdate(n => n + 1);
    }
  }, [userId]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/archived"] });
      toast({ title: "Aankondiging verwijderd" });
      setDeleteConfirmAnn(null);
      setPermanentDeleteAnn(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/announcements/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/archived"] });
      toast({ title: "Aankondiging gearchiveerd" });
      setDeleteConfirmAnn(null);
    },
  });

  const sorted = [...(announcements || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = (messagesData || []).filter(m => m.toUserId === user?.id && !m.read).length;

  const isAdminOrManager = isAdminRole(user?.role) || user?.role === "manager";
  const canCreateAnnouncement = isAdminRole(user?.role) || user?.role === "manager_az";

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <PageHero
        title="Aankondigingen"
        subtitle="Belangrijke mededelingen en berichten"
        imageSrc="/uploads/App_pics/aankondigingen.png"
        imageAlt="aankondigingen"
      />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {isAdminOrManager && activeTab === "messages" && (
            <Button onClick={() => setSendMsgOpen(true)} data-testid="button-send-message-open">
              <Send className="h-4 w-4 mr-2" />
              Bericht Sturen
            </Button>
          )}
          {canCreateAnnouncement && activeTab === "announcements" && (
            <Button onClick={() => setCreateOpen(true)} data-testid="button-add-announcement">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Aankondiging
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => handleTabChange("announcements")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "announcements"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-announcements"
        >
          <Megaphone className="h-4 w-4 inline -mt-0.5" />
          Aankondigingen
          {newAnnouncementsCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center" data-testid="badge-new-announcements">
              {newAnnouncementsCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => handleTabChange("messages")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "messages"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-messages"
        >
          <Mail className="h-4 w-4 inline -mt-0.5" />
          Berichten
          {Math.max(unreadCount, newMessagesCount) > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center" data-testid="badge-unread-count">
              {Math.max(unreadCount, newMessagesCount)}
            </Badge>
          )}
        </button>
        <button
          onClick={() => handleTabChange("nieuwsbrieven")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "nieuwsbrieven"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-nieuwsbrieven"
        >
          <Newspaper className="h-4 w-4 inline -mt-0.5" />
          Nieuwsbrieven
          {newNieuwsbrievenCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center" data-testid="badge-new-nieuwsbrieven">
              {newNieuwsbrievenCount}
            </Badge>
          )}
        </button>
        {canCreateAnnouncement && (
          <button
            onClick={() => setActiveTab("archief")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "archief"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-archief"
          >
            <Archive className="h-4 w-4 inline -mt-0.5" />
            Oude aankondigingen
          </button>
        )}
      </div>

      <AnnouncementFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editAnn && (
        <AnnouncementFormDialog open={!!editAnn} onOpenChange={(open) => { if (!open) setEditAnn(null); }} editAnn={editAnn} />
      )}
      <SendMessageDialog open={sendMsgOpen} onOpenChange={setSendMsgOpen} />
      <MessageDetailDialog message={selectedMessage} onClose={() => setSelectedMessage(null)} currentUserId={user?.id || ""} />

      <Dialog open={!!deleteConfirmAnn} onOpenChange={(o) => { if (!o) setDeleteConfirmAnn(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aankondiging verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Wilt u deze aankondiging toevoegen aan de oude aankondiging archief?
          </p>
          <p className="text-sm font-medium mt-1">{deleteConfirmAnn?.title}</p>
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1"
              onClick={() => deleteConfirmAnn && archiveMutation.mutate(deleteConfirmAnn.id)}
              disabled={archiveMutation.isPending || deleteMutation.isPending}
              data-testid="button-confirm-archive"
            >
              <Archive className="h-4 w-4 mr-2" />
              {archiveMutation.isPending ? "Archiveren..." : "Ja, archiveren"}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirmAnn && deleteMutation.mutate(deleteConfirmAnn.id)}
              disabled={deleteMutation.isPending || archiveMutation.isPending}
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Verwijderen..." : "Nee, verwijderen"}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-1"
            onClick={() => setDeleteConfirmAnn(null)}
            data-testid="button-cancel-delete"
          >
            Annuleren
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!permanentDeleteAnn} onOpenChange={(o) => { if (!o) setPermanentDeleteAnn(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Permanent verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Weet u het zeker? Deze aankondiging wordt permanent verwijderd en kan niet worden hersteld.
          </p>
          <p className="text-sm font-medium mt-1">{permanentDeleteAnn?.title}</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => permanentDeleteAnn && deleteMutation.mutate(permanentDeleteAnn.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-permanent-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Verwijderen..." : "Ja, permanent verwijderen"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPermanentDeleteAnn(null)}
              data-testid="button-cancel-permanent-delete"
            >
              Annuleren
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {activeTab === "announcements" && (
        <>
          {sorted.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen aankondigingen</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sorted.map((ann) => (
                <Card key={ann.id} className={ann.pinned ? "border-primary/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                        ann.priority === "high"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {ann.priority === "high" ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm" data-testid={`text-announcement-${ann.id}`}>{ann.title}</h3>
                          {ann.pinned && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Pin className="h-3 w-3" /> Vastgezet
                            </Badge>
                          )}
                          {ann.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">Hoog</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                        {ann.pdfUrl && (
                          <a
                            href={ann.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline"
                            data-testid={`link-pdf-${ann.id}`}
                          >
                            <FileText className="h-4 w-4" />
                            PDF-bijlage bekijken
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(ann.createdAt)}
                        </p>
                      </div>
                      {canCreateAnnouncement && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditAnn(ann)} data-testid={`button-edit-announcement-${ann.id}`}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmAnn(ann)} data-testid={`button-delete-announcement-${ann.id}`}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "messages" && (
        <>
          {messagesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (messagesData || []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen berichten</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {(messagesData || []).map((msg) => {
                const isSent = msg.fromUserId === user?.id;
                const isUnread = !isSent && !msg.read;
                return (
                  <Card
                    key={msg.id}
                    className={`cursor-pointer hover-elevate ${isUnread ? "border-primary/40" : ""}`}
                    onClick={() => setSelectedMessage(msg)}
                    data-testid={`card-message-${msg.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm ${isUnread ? "font-bold" : "font-semibold"}`} data-testid={`text-message-subject-${msg.id}`}>
                              {msg.subject}
                            </h3>
                            {isSent && (
                              <Badge variant="outline" className="text-xs">
                                <Send className="h-3 w-3 mr-1" /> Verzonden
                              </Badge>
                            )}
                            {isUnread && (
                              <Badge variant="default" className="text-xs">Nieuw</Badge>
                            )}
                            {msg.reply && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Reply className="h-3 w-3" /> Beantwoord
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {isSent ? `Aan: ${msg.toUserName}` : `Van: ${msg.fromUserName}`}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{msg.content}</p>
                        </div>
                        <div className="shrink-0 text-right ml-2" data-testid={`text-message-date-${msg.id}`}>
                          <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Ingediend op</p>
                          <p className="text-xs text-foreground mt-0.5 whitespace-nowrap">{formatDateTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "nieuwsbrieven" && (
        <NieuwsbrievenTab />
      )}

      {activeTab === "archief" && (
        <>
          {archivedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : !archivedAnnouncements || archivedAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen gearchiveerde aankondigingen</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {archivedAnnouncements.map((ann) => (
                <Card key={ann.id} className="opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Archive className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm" data-testid={`text-archived-announcement-${ann.id}`}>{ann.title}</h3>
                          <Badge variant="outline" className="text-xs">Gearchiveerd</Badge>
                          {ann.priority === "high" && (
                            <Badge variant="secondary" className="text-xs">Hoog</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                        {ann.pdfUrl && (
                          <a
                            href={ann.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline"
                            data-testid={`link-archived-pdf-${ann.id}`}
                          >
                            <FileText className="h-4 w-4" />
                            PDF-bijlage bekijken
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(ann.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPermanentDeleteAnn(ann)}
                        data-testid={`button-permanent-delete-archived-${ann.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function NieuwsbrievenTab() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: files, isLoading } = useQuery<NieuwsbriefFile[]>({
    queryKey: ["/api/uploads/nieuwsbrief"],
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
      const res = await fetch("/api/uploads/nieuwsbrief", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/nieuwsbrief"] });
      toast({ title: "Nieuwsbrief toegevoegd" });
    } catch {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/uploads/nieuwsbrief/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/nieuwsbrief"] });
      toast({ title: "Nieuwsbrief verwijderd" });
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
            onClick={() => document.getElementById("nieuwsbrief-upload-input")?.click()}
            disabled={uploading}
            data-testid="button-add-nieuwsbrief"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploaden..." : "Nieuw Document"}
          </Button>
          <input
            id="nieuwsbrief-upload-input"
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
            data-testid="input-nieuwsbrief-upload"
          />
        </div>
      )}

      {!files || files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen nieuwsbrieven gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
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
                  data-testid={`nieuwsbrief-file-${file.name}`}
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
                      data-testid={`button-delete-nieuwsbrief-${file.name}`}
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
