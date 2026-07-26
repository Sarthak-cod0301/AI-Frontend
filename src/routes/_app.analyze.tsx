import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, CheckCircle2, XCircle, Sparkles, FileText, Target, Layers, Wand2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  ResumeAPI, JobDescAPI,
  AtsAPI, GrammarAPI, FormattingAPI, ProjectAPI, ImprovementAPI, AnalysisAPI, SuggestionAPI,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResultDetail } from "@/components/result-detail";
import { resumeDisplayName } from "@/lib/format";


export const Route = createFileRoute("/_app/analyze")({
  component: AnalyzePage,
});

type CheckKey = "ats" | "grammar" | "formatting" | "project" | "improvement" | "analysis" | "suggestions";
type CheckState = { status: "idle" | "running" | "done" | "error"; data?: any; error?: string };

const CHECK_META: Record<CheckKey, { label: string; icon: any; needsJD?: boolean; color: string }> = {
  ats:         { label: "ATS Score",       icon: Target,    color: "from-primary to-primary/70" },
  grammar:     { label: "Grammar",         icon: FileText,  color: "from-[color:var(--color-chart-2)] to-[color:var(--color-chart-3)]" },
  formatting:  { label: "Formatting",      icon: Layers,    color: "from-[color:var(--color-chart-3)] to-[color:var(--color-chart-4)]" },
  project:     { label: "Project Analysis", icon: BarChart3, color: "from-[color:var(--color-chart-4)] to-[color:var(--color-chart-5)]" },
  improvement: { label: "AI Improvement",  icon: Wand2,     color: "from-[color:var(--color-chart-5)] to-primary" },
  analysis:    { label: "Resume vs JD",    icon: Sparkles,  needsJD: true, color: "from-primary to-[color:var(--color-chart-2)]" },
  suggestions: { label: "Tailored Suggestions", icon: Sparkles, needsJD: true, color: "from-[color:var(--color-chart-2)] to-primary" },
};

function extractScore(data: any): number | null {
  if (!data) return null;
  const keys = ["score", "atsScore", "matchScore", "overallScore", "formattingScore", "grammarScore"];
  for (const k of keys) if (typeof data[k] === "number") return Math.round(data[k]);
  return null;
}

function AnalyzePage() {
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });
  const jds = useQuery({ queryKey: ["jds"], queryFn: JobDescAPI.list, retry: false });

  const [resumeId, setResumeId] = useState<string>("");
  const [jdId, setJdId] = useState<string>("");
  const [states, setStates] = useState<Record<CheckKey, CheckState>>({
    ats: { status: "idle" }, grammar: { status: "idle" }, formatting: { status: "idle" },
    project: { status: "idle" }, improvement: { status: "idle" },
    analysis: { status: "idle" }, suggestions: { status: "idle" },
  });
  const [running, setRunning] = useState(false);

  const runners: Record<CheckKey, () => Promise<any>> = useMemo(() => ({
    ats:         () => AtsAPI.run(resumeId),
    grammar:     () => GrammarAPI.run(resumeId),
    formatting:  () => FormattingAPI.run(resumeId),
    project:     () => ProjectAPI.run(resumeId),
    improvement: () => ImprovementAPI.run(resumeId),
    analysis:    () => AnalysisAPI.run(resumeId, jdId),
    suggestions: () => SuggestionAPI.run(resumeId, jdId),
  }), [resumeId, jdId]);

  const runAll = async () => {
    if (!resumeId) return toast.error("Pick a resume first");
    const hasJD = !!jdId;
    setRunning(true);
    const keys: CheckKey[] = ["ats", "grammar", "formatting", "project", "improvement",
      ...(hasJD ? (["analysis", "suggestions"] as CheckKey[]) : []),
    ];
    setStates((s) => {
      const next = { ...s };
      keys.forEach((k) => (next[k] = { status: "running" }));
      if (!hasJD) { next.analysis = { status: "idle" }; next.suggestions = { status: "idle" }; }
      return next;
    });

    await Promise.all(keys.map(async (k) => {
      try {
        const data = await runners[k]();
        setStates((s) => ({ ...s, [k]: { status: "done", data } }));
      } catch (e: any) {
        setStates((s) => ({ ...s, [k]: { status: "error", error: e?.response?.data?.message ?? e.message } }));
      }
    }));

    setRunning(false);
    toast.success("Analysis complete");
  };

  const scores = (Object.keys(CHECK_META) as CheckKey[])
    .map((k) => ({ k, score: extractScore(states[k].data) }))
    .filter((x) => x.score != null) as { k: CheckKey; score: number }[];
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Run All Checks</h1>
        <p className="text-muted-foreground">
          Pick a resume (and optional JD) — we run every AI analysis in parallel and combine the results.
        </p>
      </motion.div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Resume</div>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger><SelectValue placeholder="Choose a resume" /></SelectTrigger>
              <SelectContent>
                {resumes.data?.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)}>{resumeDisplayName(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Job Description (optional)</div>
            <Select value={jdId} onValueChange={setJdId}>
              <SelectTrigger><SelectValue placeholder="Choose a JD" /></SelectTrigger>
              <SelectContent>
                {jds.data?.map((j: any) => (
                  <SelectItem key={j.id} value={String(j.id)}>{j.title}{j.company ? ` · ${j.company}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={runAll} disabled={running || !resumeId}
              className="w-full bg-gradient-primary text-white shadow-elegant hover:opacity-95 md:w-auto">
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Analyze All
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {overall != null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="overflow-hidden border-border/60 shadow-elegant">
              <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
                <ScoreRing value={overall} />
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Overall Resume Score</div>
                  <div className="mt-1 font-display text-4xl font-bold">{overall} / 100</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Weighted average across all completed AI checks.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {scores.map(({ k, score }) => (
                      <div key={k} className="rounded-lg border border-border/60 bg-background p-3">
                        <div className="text-xs font-medium text-muted-foreground">{CHECK_META[k].label}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-display text-xl font-bold">{score}</span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                        <Progress value={score} className="mt-2 h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(Object.keys(CHECK_META) as CheckKey[]).map((k) => {
          const meta = CHECK_META[k];
          const st = states[k];
          const score = extractScore(st.data);
          const disabled = meta.needsJD && !jdId;
          return (
            <motion.div key={k} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border-border/60 shadow-soft ${disabled ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${meta.color} text-white`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <StatusBadge status={st.status} needsJD={meta.needsJD} hasJD={!!jdId} />
                  </div>
                  <CardTitle className="text-base">{meta.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {st.status === "done" && score != null && (
                    <>
                      <div className="font-display text-3xl font-bold">{score}</div>
                      <Progress value={score} className="mt-2 h-1.5" />
                    </>
                  )}
                  {st.status === "done" && score == null && (
                    <div className="text-sm text-muted-foreground">Completed. See details below.</div>
                  )}
                  {st.status === "running" && <Skeleton />}
                  {st.status === "error" && <div className="text-sm text-destructive">{st.error}</div>}
                  {st.status === "idle" && (
                    <div className="text-sm text-muted-foreground">
                      {disabled ? "Requires a job description." : "Not run yet."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {Object.values(states).some((s) => s.status === "done") && (
        <Card className="border-border/60 shadow-soft">
          <CardHeader><CardTitle>Detailed results</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue={(Object.keys(states) as CheckKey[]).find((k) => states[k].status === "done") ?? "ats"}>
              <TabsList className="flex-wrap">
                {(Object.keys(CHECK_META) as CheckKey[]).map((k) => (
                  <TabsTrigger key={k} value={k} disabled={states[k].status !== "done"}>
                    {CHECK_META[k].label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(CHECK_META) as CheckKey[]).map((k) => (
                <TabsContent key={k} value={k} className="mt-4">
                  <ResultDetail data={states[k].data} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function StatusBadge({ status, needsJD, hasJD }: { status: CheckState["status"]; needsJD?: boolean; hasJD: boolean }) {
  if (needsJD && !hasJD) return <Badge variant="outline">JD required</Badge>;
  if (status === "running") return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
  if (status === "done") return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" />Done</Badge>;
  if (status === "error") return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Error</Badge>;
  return <Badge variant="outline">Idle</Badge>;
}

function ScoreRing({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} strokeWidth="10" className="fill-none stroke-muted" />
        <motion.circle
          cx="60" cy="60" r={r} strokeWidth="10" strokeLinecap="round"
          className="fill-none stroke-[url(#g)]"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.19 259)" />
            <stop offset="100%" stopColor="oklch(0.72 0.17 175)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-bold">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall</div>
        </div>
      </div>
    </div>
  );
}

