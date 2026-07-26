import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, Pencil, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResumeAPI } from "@/lib/api";
import { formatDateTime, resumeDisplayName } from "@/lib/format";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/resumes")({
  component: ResumesPage,
});

function ResumesPage() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });

  const uploadMut = useMutation({
    mutationFn: (file: File) => ResumeAPI.upload(file),
    onSuccess: () => { toast.success("Resume uploaded"); qc.invalidateQueries({ queryKey: ["resumes"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Upload failed"),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => ResumeAPI.remove(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["resumes"] }); },
  });
  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => ResumeAPI.rename(id, name),
    onSuccess: () => { toast.success("Renamed"); setRenaming(null); qc.invalidateQueries({ queryKey: ["resumes"] }); },
  });

  const handleDownload = async (id: string, name: string) => {
    try {
      const blob = await ResumeAPI.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name || `resume-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed"); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground">Upload and manage your resume files.</p>
        </div>
        <Button
          onClick={() => fileInput.current?.click()}
          disabled={uploadMut.isPending}
          className="bg-gradient-primary text-white shadow-elegant hover:opacity-95"
        >
          {uploadMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload resume
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadMut.mutate(f);
            e.target.value = "";
          }}
        />
      </div>

      {isLoading && <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>}

      {data && data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted"><FileText className="h-6 w-6 text-muted-foreground" /></div>
            <div className="font-medium">No resumes yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">Upload your first resume to start analyzing.</p>
            <Button onClick={() => fileInput.current?.click()} className="mt-2 bg-gradient-primary text-white">Upload resume</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {data?.map((r: any) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="group border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-white shadow-elegant">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium" title={resumeDisplayName(r)}>{resumeDisplayName(r)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(r.uploadedAt ?? r.createdAt ?? r.updatedAt) ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(r.id, resumeDisplayName(r, ""))}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenaming({ id: r.id, name: resumeDisplayName(r, "") })}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this resume?")) removeMut.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename resume</DialogTitle></DialogHeader>
          <Input value={renaming?.name ?? ""} onChange={(e) => setRenaming(renaming ? { ...renaming, name: e.target.value } : null)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={() => renaming && renameMut.mutate({ id: renaming.id, name: renaming.name })}
              disabled={renameMut.isPending} className="bg-gradient-primary text-white">
              {renameMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
