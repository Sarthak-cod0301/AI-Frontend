import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, FileText, Layers, BarChart3, Wand2, Sparkles, Mic, ChevronDown } from "lucide-react";
import { AtsAPI, GrammarAPI, FormattingAPI, ProjectAPI, ImprovementAPI, AnalysisAPI, SuggestionAPI, InterviewAPI, ResumeAPI } from "@/lib/api";
import { formatDateTime, resumeDisplayName } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResultDetail } from "@/components/result-detail";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

const sources = [
  { key: "ats",         label: "ATS",         icon: Target,    fn: AtsAPI.history },
  { key: "grammar",     label: "Grammar",     icon: FileText,  fn: GrammarAPI.history },
  { key: "formatting",  label: "Formatting",  icon: Layers,    fn: FormattingAPI.history },
  { key: "project",     label: "Projects",    icon: BarChart3, fn: ProjectAPI.history },
  { key: "improvement", label: "Improvement", icon: Wand2,     fn: ImprovementAPI.history },
  { key: "analysis",    label: "Analysis",    icon: Sparkles,  fn: AnalysisAPI.history },
  { key: "suggestions", label: "Suggestions", icon: Sparkles,  fn: SuggestionAPI.history },
  { key: "interview",   label: "Interview",   icon: Mic,       fn: InterviewAPI.history },
] as const;

function extractScore(data: any): number | null {
  if (!data || typeof data !== "object") return null;
  const keys = ["score", "atsScore", "matchScore", "overallScore", "formattingScore", "grammarScore"];
  for (const k of keys) if (typeof (data as any)[k] === "number") return Math.round((data as any)[k]);
  return null;
}

function HistoryPage() {
  const queries = useQueries({
    queries: sources.map((s) => ({ queryKey: ["history", s.key], queryFn: s.fn, retry: false })),
  });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });
  const resumeNames = new Map<string, string>(
    (Array.isArray(resumes.data) ? resumes.data : []).map((r: any) => [String(r.id), resumeDisplayName(r)]),
  );


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">All previous analyses for your resumes, grouped by feature.</p>
      </motion.div>

      <Tabs defaultValue="ats">
        <TabsList className="flex-wrap">
          {sources.map((s, i) => {
            const count = Array.isArray(queries[i].data) ? queries[i].data.length : 0;
            return (
              <TabsTrigger key={s.key} value={s.key} className="gap-2">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
                {count > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sources.map((s, i) => {
          const q = queries[i];
          const items: any[] = Array.isArray(q.data) ? q.data : [];
          return (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              <Card className="border-border/60 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <s.icon className="h-4 w-4 text-primary" /> {s.label} history
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
                  {q.isError && <div className="text-sm text-destructive">Failed to load.</div>}
                  {!q.isLoading && items.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No {s.label.toLowerCase()} results yet.
                    </div>
                  )}

                  {items.map((it, idx) => (
                    <HistoryEntry key={it?.id ?? idx} item={it} index={idx} resumeNames={resumeNames} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function HistoryEntry({ item, index, resumeNames }: { item: any; index: number; resumeNames: Map<string, string> }) {
  const [open, setOpen] = useState(false);
  const score = extractScore(item);
  const created = formatDateTime(item?.createdAt ?? item?.updatedAt ?? item?.timestamp ?? item?.analyzedAt);
  const resumeName =
    resumeNames.get(String(item?.resumeId ?? "")) ??
    resumeDisplayName(item, "") ??
    "";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-gradient-primary text-white shadow-elegant">
              <span className="text-xs font-bold">#{index + 1}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {resumeName || "Resume analysis"}
              </div>
              <div className="text-xs text-muted-foreground">
                {created ?? "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {score != null && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Score {score}</Badge>
            )}
            <Button size="sm" variant="ghost" className="gap-1">
              {open ? "Hide" : "View"}
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/60 bg-muted/20 p-4">
                <ResultDetail data={item} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
