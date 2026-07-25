import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";
import { UserAPI, USER_KEY } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: UserAPI.me, retry: false });

  const [form, setForm] = useState({ name: "", email: "" });
  useEffect(() => {
    if (me.data) setForm({ name: me.data.name ?? "", email: me.data.email ?? "" });
  }, [me.data]);

  const updateMut = useMutation({
    mutationFn: () => UserAPI.update(form),
    onSuccess: (u) => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_KEY, JSON.stringify(u));
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Update failed"),
  });

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const pwMut = useMutation({
    mutationFn: () => UserAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Change failed"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and password.</p>
      </motion.div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
            className="bg-gradient-primary text-white shadow-elegant hover:opacity-95">
            {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
          </div>
          <Button
            onClick={() => {
              if (!pw.newPassword || pw.newPassword !== pw.confirm) return toast.error("Passwords do not match");
              pwMut.mutate();
            }}
            disabled={pwMut.isPending}
            className="bg-gradient-primary text-white"
          >
            {pwMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
