import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Briefcase, Sparkles, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { DashboardAPI, ResumeAPI, JobDescAPI } from "@/lib/api";
import { resumeDisplayName } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: DashboardAPI.get, retry: false });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: ResumeAPI.list, retry: false });
  const jds = useQuery({ queryKey: ["jds"], queryFn: JobDescAPI.list, retry: false });

  const stats = [
    { label: "Resumes", value: resumes.data?.length ?? "—", icon: FileText, color: "from-primary to-primary/70" },
    { label: "Job Descriptions", value: jds.data?.length ?? "—", icon: Briefcase, color: "from-[color:var(--color-chart-2)] to-[color:var(--color-chart-3)]" },
    {
      label: "Avg ATS Score",
      value: dash.data?.avgAtsScore ?? dash.data?.averageAtsScore ?? "—",
      icon: TrendingUp,
      color: "from-[color:var(--color-chart-3)] to-[color:var(--color-chart-4)]",
    },
    {
      label: "Analyses Run",
      value: dash.data?.totalAnalyses ?? dash.data?.analysesRun ?? "—",
      icon: Sparkles,
      color: "from-[color:var(--color-chart-5)] to-primary",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome back 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a resume, add a job description, and run a full AI analysis in seconds.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden border-border/60 shadow-soft">
              <CardContent className="p-5">
                <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-elegant`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-3xl font-bold">
                  {dash.isLoading && s.label.includes("Score") ? <Skeleton className="h-8 w-16" /> : String(s.value)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Get started
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StepCard n={1} to="/resumes" title="Upload a resume" desc="PDF or DOCX" />
            <StepCard n={2} to="/job-descriptions" title="Add a JD" desc="Optional but recommended" />
            <StepCard n={3} to="/analyze" title="Run all checks" desc="Unified score card" />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Recent resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumes.isLoading && <Skeleton className="h-16 w-full" />}
            {resumes.data?.slice(0, 4).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{resumeDisplayName(r)}</div>
                  {/* <div className="text-xs text-muted-foreground">#{r.id}</div> */}
                </div>
                <Link to="/analyze"><Button size="sm" variant="ghost"><ArrowRight className="h-4 w-4" /></Button></Link>
              </div>
            ))}
            {resumes.data && resumes.data.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No resumes yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepCard({ n, to, title, desc }: { n: number; to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="group block rounded-xl border border-border/60 bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="font-display text-2xl font-bold text-gradient">0{n}</div>
      <div className="mt-2 font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
      <div className="mt-3 flex items-center text-sm text-primary">
        Go <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
