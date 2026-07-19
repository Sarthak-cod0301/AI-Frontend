import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileCheck2,
  Sparkles,
  Target,
  ShieldCheck,
  Wand2,
  Layers,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Target, title: "ATS Score", desc: "See exactly how applicant tracking systems rank your resume." },
  { icon: FileCheck2, title: "Grammar Check", desc: "AI-powered grammar, tone and clarity fixes." },
  { icon: Layers, title: "Formatting", desc: "Detect layout, spacing and structure issues that break parsing." },
  { icon: Sparkles, title: "Smart Suggestions", desc: "Tailored keywords and rewrites for a specific job." },
  { icon: Wand2, title: "AI Improvement", desc: "Rewrite your resume with recruiter-approved phrasing." },
  { icon: BarChart3, title: "Project Analyzer", desc: "Evaluate impact, tech depth and clarity of each project." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-elegant">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">ResumeIQ</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="sm" className="bg-gradient-primary text-white shadow-elegant hover:opacity-95">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center md:pt-28 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          Powered by AI · Trusted by candidates worldwide
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
        >
          Land the interview with a<br />
          <span className="text-gradient">resume that scores.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Upload your resume and get instant ATS scoring, grammar & formatting checks,
          tailored suggestions, and AI-driven improvements — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="lg" className="group bg-gradient-primary text-white shadow-elegant hover:opacity-95">
              Analyze my resume
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">See what it checks</Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroPreview() {
  const scores = [
    { label: "ATS", value: 87, color: "bg-primary" },
    { label: "Grammar", value: 94, color: "bg-[color:var(--color-chart-2)]" },
    { label: "Formatting", value: 78, color: "bg-[color:var(--color-chart-3)]" },
    { label: "Match", value: 82, color: "bg-[color:var(--color-chart-5)]" },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <span className="text-xs text-muted-foreground">resume-analysis.pdf</span>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {scores.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="rounded-xl border border-border/60 bg-background p-4 text-left"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 1.2, delay: 0.6 + i * 0.08 }}
                className={`h-full ${s.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Every check your resume needs
        </h2>
        <p className="mt-4 text-muted-foreground">
          Run a single check or all of them at once — get a unified score card in seconds.
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white shadow-elegant">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Upload your resume", d: "PDF or DOCX — we parse it in seconds." },
    { n: 2, title: "Add a job description", d: "Optional, for tailored analysis and match score." },
    { n: 3, title: "Run all checks", d: "See ATS, grammar, formatting and match score together." },
    { n: 4, title: "Apply AI improvements", d: "One-click rewrites and targeted suggestions." },
  ];
  return (
    <section id="how" className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Four steps to a better resume</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-background p-6"
            >
              <div className="font-display text-4xl font-bold text-gradient">0{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center shadow-elegant md:p-16">
        <ShieldCheck className="mx-auto h-10 w-10 text-white/90" />
        <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">
          Ready to score higher?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Get a full analysis of your resume in under a minute.
        </p>
        <div className="mt-8">
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="lg" variant="secondary" className="shadow-elegant">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} ResumeIQ. All rights reserved.</div>
        <div>Made with care · AI-powered</div>
      </div>
    </footer>
  );
}
