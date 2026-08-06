import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Play, Send, CheckCircle2, Sparkles, History as HistoryIcon, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { InterviewAPI, ResumeAPI, JobDescAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResultDetail } from "@/components/result-detail";
import { formatDateTime, resumeDisplayName } from "@/lib/format";


const NUM_QUESTIONS = 10;

export const Route = createFileRoute("/_app/interview")({
  component: InterviewPage,
});

function InterviewPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-7 w-7 text-primary" /> Mock Interview
        </h1>
        <p className="text-muted-foreground">
          Practice with an AI interviewer. Answer questions and get instant feedback.
        </p>
      </motion.div>

      <Tabs defaultValue="session">
        <TabsList>
          <TabsTrigger value="session"><Play className="mr-2 h-4 w-4" /> Session</TabsTrigger>
          <TabsTrigger value="history"><HistoryIcon className="mr-2 h-4 w-4" /> History</TabsTrigger>
        </TabsList>
        <TabsContent value="session" className="mt-4"><SessionPanel /></TabsContent>
        <TabsContent value="history" className="mt-4"><HistoryPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------ Session ------------------------------ */

type Question = { id?: string; questionId?: string; question?: string; text?: string; questionText?: string; index?: number };
type Session = { id?: string; sessionId?: string; status?: string; completed?: boolean; questions?: Question[] };

function SessionPanel() {
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });
  const jds = useQuery({ queryKey: ["jds"], queryFn: JobDescAPI.list, retry: false });
  const qc = useQueryClient();

  const [resumeId, setResumeId] = useState<string>("");
  const [jdId, setJdId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  // numQuestions is fixed at NUM_QUESTIONS and is intentionally not user-editable.

  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [asked, setAsked] = useState(0);

  const sessionId = session?.id ?? session?.sessionId ?? "";

  const startMut = useMutation({
    mutationFn: () =>
      InterviewAPI.start({
        resumeId: resumeId || undefined,
        jobDescriptionId: jdId || undefined,
        role: role || undefined,
        difficulty,
        numQuestions: NUM_QUESTIONS,
      }),
    onSuccess: async (s: Session) => {
      setSession(s);
      setEvaluations([]);
      setSummary(null);
      setAsked(0);
      const first = s.questions?.[0];
      if (first) {
        setCurrent(first);
        setAsked(1);
      } else {
        const id = s.id ?? s.sessionId;
        if (id) {
          const q = await InterviewAPI.next(id);
          setCurrent(q);
          setAsked(1);
        }
      }
      toast.success("Interview started");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Could not start interview"),
  });

  const answerMut = useMutation({
    mutationFn: () => {
      const qid = current?.id ?? current?.questionId ?? "";
      return InterviewAPI.answer(sessionId, qid, { answerText: answer });
    },
    onSuccess: async (evalResult) => {
      setEvaluations((e) => [...e, { question: current, evaluation: evalResult }]);
      setAnswer("");
      if (asked >= NUM_QUESTIONS) {
        finishMut.mutate();
      } else {
        try {
          const q = await InterviewAPI.next(sessionId);
          if (!q || (!q.question && !q.text && !q.questionText)) {
            finishMut.mutate();
          } else {
            setCurrent(q);
            setAsked((n) => n + 1);
          }
        } catch {
          finishMut.mutate();
        }
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Answer submission failed"),
  });

  const finishMut = useMutation({
    mutationFn: () => InterviewAPI.complete(sessionId),
    onSuccess: (s) => {
      setSummary(s);
      setCurrent(null);
      qc.invalidateQueries({ queryKey: ["interview-history"] });
      toast.success("Interview complete");
    },
  });

  const reset = () => {
    setSession(null); setCurrent(null); setAnswer("");
    setEvaluations([]); setSummary(null); setAsked(0);
  };

  if (session && (current || summary)) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary">Question {Math.min(asked, NUM_QUESTIONS)} / {NUM_QUESTIONS}</Badge>
              {role && <span className="text-sm text-muted-foreground">Role: {role}</span>}
              <span className="text-xs text-muted-foreground uppercase">Difficulty: {difficulty}</span>
            </div>
            <Progress value={(Math.min(asked, NUM_QUESTIONS) / NUM_QUESTIONS) * 100} className="w-40" />
          </CardContent>
        </Card>

        {current && !summary && (
          <motion.div key={asked} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/60 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg">
                  {current.question ?? current.text ?? current.questionText ?? "Question"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Take a breath, structure your answer, then type…"
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={reset}>End session</Button>
                  <Button
                    onClick={() => answerMut.mutate()}
                    disabled={answerMut.isPending || !answer.trim()}
                    className="bg-gradient-primary text-white shadow-elegant hover:opacity-95"
                  >
                    {answerMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
          {evaluations.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-border/60 shadow-soft">
                <CardHeader><CardTitle className="text-base">Answered so far</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {evaluations.map((ev, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-background p-4">
                      <div className="text-sm font-medium">
                        Q{i + 1}. {ev.question?.question ?? ev.question?.text ?? ev.question?.questionText}
                      </div>
                      <div className="mt-3">
                        <ResultDetail data={ev.evaluation} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {summary && (
          <Card className="border-border/60 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Session summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResultDetail data={summary} />
              <div className="mt-4">
                <Button onClick={reset} variant="outline">Start new interview</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Configure your interview
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Resume (optional)</Label>
          <Select value={resumeId} onValueChange={setResumeId}>
            <SelectTrigger><SelectValue placeholder="Pick a resume" /></SelectTrigger>
            <SelectContent>
              {resumes.data?.map((r: any) => (
                <SelectItem key={r.id} value={String(r.id)}>{resumeDisplayName(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Job Description (optional)</Label>
          <Select value={jdId} onValueChange={setJdId}>
            <SelectTrigger><SelectValue placeholder="Pick a JD" /></SelectTrigger>
            <SelectContent>
              {jds.data?.map((j: any) => (
                <SelectItem key={j.id} value={String(j.id)}>{j.title}{j.company ? ` · ${j.company}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target role</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Number of questions is fixed at 10 and is not user-configurable. */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-muted-foreground">Questions</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{NUM_QUESTIONS} questions</Badge>
            <span>Every interview covers a fixed set of {NUM_QUESTIONS} questions.</span>
          </div>
        </div>
        <div className="flex items-end md:col-span-2">
          <Button
            className="w-full bg-gradient-primary text-white shadow-elegant hover:opacity-95"
            onClick={() => startMut.mutate()}
            disabled={startMut.isPending}
          >
            {startMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Start interview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ History ------------------------------ */

function HistoryPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["interview-history"], queryFn: InterviewAPI.history, retry: false });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });
  const items: any[] = Array.isArray(q.data) ? q.data : [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const nameById = new Map<string, string>(
    (Array.isArray(resumes.data) ? resumes.data : []).map((r: any) => [String(r.id), resumeDisplayName(r)]),
  );

  const deleteMut = useMutation({
    mutationFn: (sessionId: string) => InterviewAPI.delete(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-history"] });
      toast.success("Interview session deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Could not delete session"),
  });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (items.length === 0) {
    return (
      <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-muted-foreground">
        No interview sessions yet.
      </CardContent></Card>
    );
  }
  return (
    <div className="grid gap-4">
      {items.map((s, i) => {
        const when = formatDateTime(s?.createdAt ?? s?.startedAt ?? s?.completedAt ?? s?.updatedAt);
        const resumeName = nameById.get(String(s?.resumeId ?? "")) ?? s?.resumeName ?? null;
        const sid = String(s?.id ?? s?.sessionId ?? "");
        const rowKey = sid || `session-${i}`;
        const isOpen = !collapsed[rowKey];
        return (
          <motion.div key={rowKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span className="flex flex-col">
                    <span>{s?.role ? `${s.role} interview` : `Session #${i + 1}`}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {[when ?? null, resumeName].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCollapsed((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                      aria-label={isOpen ? "Collapse session details" : "Expand session details"}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteMut.isPending || !sid}
                      onClick={() => deleteMut.mutate(sid)}
                      aria-label="Delete session"
                    >
                      {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </span>
                </CardTitle>
              </CardHeader>
              {isOpen && (
                <CardContent>
                  <ResultDetail data={s} />
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}