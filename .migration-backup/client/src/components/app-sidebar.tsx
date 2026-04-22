import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Building2,
  Users,
  Clock,
  AppWindow,
  LogOut,
  Shield,
  UserCircle,
  Star,
  FileBarChart,
  BarChart3,
  Timer,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import { useAankondigingenNotifications } from "@/pages/aankondigingen";
import { useKalenderNotifications } from "@/pages/kalender";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, key: "dashboard" },
  { title: "Kalender", url: "/kalender", icon: CalendarDays, key: "kalender" },
  { title: "Aankondigingen", url: "/aankondigingen", icon: Megaphone, key: "aankondigingen" },
  { title: "Organisatie", url: "/organisatie", icon: Building2, key: "organisatie" },
  { title: "Personalia", url: "/personalia", icon: Users, key: "personalia" },
  { title: "Verlof", url: "/verzuim", icon: Clock, key: "verzuim" },
  { title: "Beloningen", url: "/beloningen", icon: Star, key: "beloningen" },
  { title: "Applicaties", url: "/applicaties", icon: AppWindow, key: "applicaties" },
  { title: "Productie", url: "/productie", icon: BarChart3, key: "productie" },
  { title: "Rapporten", url: "/rapporten", icon: FileBarChart, key: "rapporten" },
  { title: "Werktijden", url: "/werktijden", icon: Timer, key: "werktijden" },
  { title: "Beheer", url: "/beheer", icon: Shield, key: "beheer" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { totalNew } = useAankondigingenNotifications();
  const { totalNew: kalenderNew } = useKalenderNotifications();

  const userPermissions = user?.permissions || [];
  const visibleItems = menuItems.filter((item) => userPermissions.includes(item.key));

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(48,96%,53%)] text-[hsl(152,30%,10%)] font-bold text-sm shadow-sm">
            KD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Kadaster Dashboard</span>
            <span className="text-xs text-sidebar-foreground/60">
              {isAdminRole(user?.role) ? "Beheerportaal" : "Medewerkersportaal"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Navigatie
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.key === "aankondigingen" && totalNew > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground hover:bg-destructive" data-testid="badge-aankondigingen-new">
                            {totalNew}
                          </Badge>
                        )}
                        {item.key === "kalender" && kalenderNew > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground hover:bg-destructive" data-testid="badge-kalender-new">
                            {kalenderNew}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="space-y-2">
          <Link href="/profiel" data-testid="nav-profiel">
            <div className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate ${location === "/profiel" ? "bg-sidebar-accent" : ""}`}>
              <Avatar className="h-16 w-16 shrink-0">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName || ""} className="object-cover" />}
                <AvatarFallback className="text-base bg-[hsl(48,96%,53%)] text-[hsl(152,30%,10%)] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate text-sidebar-foreground">{user?.fullName}</span>
                <span className="text-xs text-sidebar-foreground/60 capitalize">{user?.role === "directeur" ? "Directeur" : user?.role === "admin" ? "Beheerder" : user?.role === "manager" ? "Manager" : user?.role === "manager_az" ? "Beheerder AZ" : "Medewerker"}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-sidebar-foreground/60"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
