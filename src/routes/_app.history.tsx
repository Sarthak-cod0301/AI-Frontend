import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, FileText, Layers, BarChart3, Wand2, Sparkles } from "lucide-react";
import { AtsAPI, GrammarAPI, FormattingAPI, ProjectAPI, ImprovementAPI, AnalysisAPI, SuggestionAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
] as const;

function HistoryPage() {
  const queries = useQueries({
    queries: sources.map((s) => ({ queryKey: ["history", s.key], queryFn: s.fn, retry: false })),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">Everything you've run, grouped by feature.</p>
      </motion.div>

      <Tabs defaultValue="ats">
        <TabsList className="flex-wrap">
          {sources.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
          ))}
        </TabsList>

        {sources.map((s, i) => {
          const q = queries[i];
          const items = Array.isArray(q.data) ? q.data : [];
          return (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              <Card className="border-border/60 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <s.icon className="h-4 w-4 text-primary" /> {s.label} history
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
                  {q.isError && <div className="text-sm text-destructive">Failed to load.</div>}
                  {!q.isLoading && items.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No {s.label.toLowerCase()} results yet.
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((it: any, idx: number) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                        <div className="rounded-lg border border-border/60 bg-background p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">#{idx + 1}</div>
                            <div className="text-xs text-muted-foreground">
                              {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            {Object.entries(it)
                              .filter(([k]) => {
                                const lower = k.toLowerCase();
                                return lower !== "id" && lower !== "resumeid" && lower !== "resume_id";
                              })
                              .slice(0, 6)
                              .map(([k, v]) => (
                                typeof v !== "object" && v !== null ? (
                                  <div key={k} className="flex gap-2">
                                    <span className="text-muted-foreground">{k}:</span>
                                    <span className="truncate">{String(v)}</span>
                                  </div>
                                ) : null
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
