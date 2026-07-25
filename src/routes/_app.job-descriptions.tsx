import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { JobDescAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/job-descriptions")({
  component: JobDescriptionsPage,
});

type JD = { id?: string; title: string; company?: string; description: string };

function JobDescriptionsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["jds"], queryFn: JobDescAPI.list, retry: false });
  const [editing, setEditing] = useState<JD | null>(null);
  const [open, setOpen] = useState(false);

  const saveMut = useMutation({
    mutationFn: (jd: JD) => (jd.id ? JobDescAPI.update(jd.id, jd) : JobDescAPI.create(jd)),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["jds"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to save"),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => JobDescAPI.remove(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["jds"] }); },
  });

  const openNew = () => { setEditing({ title: "", company: "", description: "" }); setOpen(true); };
  const openEdit = (jd: JD) => { setEditing(jd); setOpen(true); };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Descriptions</h1>
          <p className="text-muted-foreground">Add JDs to enable tailored analysis and suggestions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-gradient-primary text-white shadow-elegant hover:opacity-95">
              <Plus className="mr-2 h-4 w-4" /> New JD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} job description</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing?.title ?? ""} onChange={(e) => setEditing(editing ? { ...editing, title: e.target.value } : null)} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={editing?.company ?? ""} onChange={(e) => setEditing(editing ? { ...editing, company: e.target.value } : null)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={10} value={editing?.description ?? ""}
                  onChange={(e) => setEditing(editing ? { ...editing, description: e.target.value } : null)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => editing && saveMut.mutate(editing)} disabled={saveMut.isPending}
                className="bg-gradient-primary text-white">
                {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>}

      {data && data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted"><Briefcase className="h-6 w-6 text-muted-foreground" /></div>
            <div className="font-medium">No job descriptions yet</div>
            <Button onClick={openNew} className="mt-2 bg-gradient-primary text-white">Add your first JD</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {data?.map((jd: any) => (
            <motion.div key={jd.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{jd.title}</div>
                      {jd.company && <div className="text-sm text-muted-foreground">{jd.company}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(jd)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => { if (confirm("Delete this JD?")) removeMut.mutate(jd.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{jd.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
