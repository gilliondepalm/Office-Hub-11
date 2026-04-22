import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Building2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "done">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ message: string } | null>(null);

  const { data: loginPhoto } = useQuery<{ value: string | null }>({
    queryKey: ["/api/site-settings/public", "login_photo"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/public/login_photo");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Inloggen mislukt",
        description: "Controleer uw gebruikersnaam en wachtwoord.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      toast({ title: "Vul uw e-mailadres in", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      setResetResult(data);
      setResetStep("done");
    } catch {
      toast({ title: "Er is een fout opgetreden", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowReset(false);
    setResetStep("email");
    setResetEmail("");
    setResetResult(null);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={loginPhoto?.value || "/uploads/App_pics/curacao_login.jpg"}
          alt="Kantoor"
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-login-photo"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(152,40%,20%/0.85)] to-[hsl(152,50%,12%/0.9)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(48,96%,53%)] text-[hsl(152,30%,10%)] font-bold text-sm">
              KD
            </div>
            <span className="text-lg font-semibold tracking-tight">Kadaster Dashboard</span>
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Uw kantoor,<br />overzichtelijk beheerd
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Beheer medewerkers, evenementen, afwezigheden en meer vanuit een centraal platform.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(48,96%,53%)]">9+</p>
                <p className="text-xs text-white/70">Modules</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(48,96%,53%)]">100%</p>
                <p className="text-xs text-white/70">Veilig</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(48,96%,53%)]">24/7</p>
                <p className="text-xs text-white/70">Toegang</p>
              </div>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-white/50">Kadaster Dashboard v2.0</p>
            <p className="text-xs text-white/50">GDP © ir. G.G. de Palm</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8">
          {!showReset ? (
            <>
              <div className="text-center space-y-3 lg:text-left">
                <div className="flex justify-center lg:hidden">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
                    KD
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Welkom terug</h2>
                <p className="text-muted-foreground text-sm">
                  Voer uw gegevens in om toegang te krijgen tot het dashboard
                </p>
              </div>

              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Gebruikersnaam</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  placeholder="Voer gebruikersnaam in"
                                  className="pl-10 h-11 bg-card border-border"
                                  data-testid="input-username"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Wachtwoord</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="Voer wachtwoord in"
                                  className="pl-10 h-11 bg-card border-border"
                                  data-testid="input-password"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 font-semibold text-sm"
                        disabled={loading}
                        data-testid="button-login"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {loading ? "Inloggen..." : "Inloggen"}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                      data-testid="button-forgot-password"
                    >
                      Wachtwoord of gebruikersnaam vergeten?
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="h-4 w-4" />
                Terug naar inloggen
              </button>

              {resetStep === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Gegevens herstellen</h2>
                    <p className="text-muted-foreground text-sm">
                      Vul uw e-mailadres in. Uw gebruikersnaam wordt getoond en uw beheerder kan uw wachtwoord resetten.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">E-mailadres</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="Voer uw e-mailadres in"
                        className="pl-10 h-11 bg-card border-border"
                        onKeyDown={e => e.key === "Enter" && handleRequestReset()}
                        data-testid="input-reset-email"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 font-semibold text-sm"
                    onClick={handleRequestReset}
                    disabled={resetLoading}
                    data-testid="button-request-reset"
                  >
                    {resetLoading ? "Verzoek versturen..." : "Verzoek indienen"}
                  </Button>
                </div>
              )}

              {resetStep === "done" && resetResult && (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Verzoek ingediend</h2>
                    <p className="text-muted-foreground text-sm">
                      {resetResult.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Neem contact op met uw beheerder om uw wachtwoord te laten resetten.
                    </p>
                  </div>
                  <Button
                    className="w-full h-11 font-semibold text-sm"
                    onClick={handleBackToLogin}
                    data-testid="button-back-after-reset"
                  >
                    Terug naar inloggen
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
