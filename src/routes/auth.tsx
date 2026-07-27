import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { AuthAPI } from "@/lib/api";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regForm.name, regForm.email, regForm.password);
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-8 px-6 py-10 md:grid-cols-2">
        <div className="hidden md:block">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-elegant">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold">ResumeIQ</span>
          </Link>
          <h1 className="mt-10 text-5xl font-bold leading-tight tracking-tight">
            Your resume,<br /><span className="text-gradient">scored & sharpened.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Sign in to run ATS checks, grammar analysis, formatting scans, tailored suggestions
            and AI improvements.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant"
        >
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="li-password">Password</Label>
                    
                  </div>
                  <Input id="li-password" type="password" required value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-gradient-primary text-white shadow-elegant hover:opacity-95">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rg-name">Name</Label>
                  <Input id="rg-name" required value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg-email">Email</Label>
                  <Input id="rg-email" type="email" required value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg-password">Password</Label>
                  <Input id="rg-password" type="password" required minLength={6}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-gradient-primary text-white shadow-elegant hover:opacity-95">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setBusy(true);
    try {
      const res = await AuthAPI.forgotPassword(email);
      if (res?.resetToken) setResetToken(res.resetToken);
      toast.success("Reset token generated");
      setStep("reset");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not request reset");
    } finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await AuthAPI.resetPassword({ resetToken, newPassword });
      toast.success("Password reset. Please sign in.");
      setOpen(false); setStep("request"); setEmail(""); setResetToken(""); setNewPassword("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Reset failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset password</DialogTitle></DialogHeader>
        {step === "request" ? (
          <div className="space-y-3">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={request} disabled={busy || !email} className="bg-gradient-primary text-white">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Get reset token
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Reset token</Label>
            <Input value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("request")}>Back</Button>
              <Button onClick={reset} disabled={busy || !resetToken || !newPassword} className="bg-gradient-primary text-white">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset password
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
