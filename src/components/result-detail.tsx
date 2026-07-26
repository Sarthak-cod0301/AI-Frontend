import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lightbulb, AlertCircle, FileText, Sparkles, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isHiddenIdField, isDateLikeKey, formatDateTime } from "@/lib/format";


/**
 * Smart renderer for the varied AI result shapes returned by the backend.
 * Handles: section improvements, missing-skill suggestions, grammar
 * corrections, plain recommendation strings, and generic objects — without
 * changing the underlying data.
 */
export function ResultDetail({ data }: { data: any }) {
  if (data == null) return null;

  // Top-level array
  if (Array.isArray(data)) return <ItemList items={data} />;

  if (typeof data !== "object") {
    return <div className="text-sm">{String(data)}</div>;
  }

  const arrays: Record<string, any[]> = {};
  const scalars: Record<string, any> = {};
  const objects: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (isHiddenIdField(k)) continue;
    if (Array.isArray(v)) arrays[k] = v;
    else if (v !== null && typeof v === "object") objects[k] = v;
    else scalars[k] = v;
  }


  return (
    <div className="space-y-6">
      {Object.keys(scalars).length > 0 && <ScalarGrid data={scalars} />}

      {Object.entries(arrays).map(([k, arr]) => (
        <section key={k}>
          <SectionHeader title={humanize(k)} count={arr.length} />
          <ItemList items={arr} />
        </section>
      ))}

      {Object.entries(objects).map(([k, obj]) => (
        <section key={k}>
          <SectionHeader title={humanize(k)} />
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <ResultDetail data={obj} />
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {count != null && (
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      )}
    </div>
  );
}

function ScalarGrid({ data }: { data: Record<string, any> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="rounded-lg border border-border/60 bg-background p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {humanize(k)}
          </div>
          <div className="mt-1 break-words text-sm font-medium">{formatValue(k, v)}</div>
        </div>
      ))}
    </div>
  );
}

/** Presentational value formatting: pretty dates, readable booleans. */
function formatValue(key: string, v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (isDateLikeKey(key)) {
    const pretty = formatDateTime(v);
    if (pretty) return pretty;
  }
  return String(v);
}


function ItemList({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
        No items.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <ItemCard item={item} index={i} />
        </motion.li>
      ))}
    </ul>
  );
}

function ItemCard({ item, index }: { item: any; index: number }) {
  if (item == null) return null;
  if (typeof item === "string") {
    return (
      <div className="flex gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-primary" />
        <span className="leading-relaxed">{item}</span>
      </div>
    );
  }
  if (typeof item !== "object") {
    return <div className="rounded-lg border border-border/60 bg-background p-3 text-sm">{String(item)}</div>;
  }

  // Detect known shapes
  if ("sectionName" in item && ("originalContent" in item || "improvedContent" in item)) {
    return <SectionImprovementCard item={item} />;
  }
  if ("originalText" in item && "correctedText" in item) {
    return <GrammarCorrectionCard item={item} />;
  }
  if ("missingSkill" in item || "suggestedBullet" in item) {
    return <SkillSuggestionCard item={item} />;
  }
  if (isInterviewQuestion(item)) {
    return <InterviewQuestionCard item={item} index={index} />;
  }

  return <GenericObjectCard item={item} index={index} />;
}

function isInterviewQuestion(item: any) {
  return (
    ("question" in item || "questionText" in item) &&
    ("answer" in item || "userAnswer" in item || "correct" in item || "isCorrect" in item)
  );
}

/** Interview Q&A card — unanswered questions are shown as skipped, not wrong. */
function InterviewQuestionCard({ item, index }: { item: any; index: number }) {
  const question = item.question ?? item.questionText ?? item.text;
  const answer: string = item.answer ?? item.userAnswer ?? "";
  const answered = typeof answer === "string" && answer.trim().length > 0;
  const correct = item.correct ?? item.isCorrect;
  const feedback = item.feedback ?? item.evaluation ?? item.explanation;
  const score = typeof item.score === "number" ? item.score : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <span className="text-sm font-semibold">Q{index + 1}. {question}</span>
        {!answered ? (
          <Badge variant="outline" className="flex-none gap-1">
            <MinusCircle className="h-3 w-3" /> Not answered
          </Badge>
        ) : correct === true ? (
          <Badge className="flex-none bg-success text-success-foreground gap-1">
            <CheckCircle2 className="h-3 w-3" /> Correct
          </Badge>
        ) : correct === false ? (
          <Badge variant="destructive" className="flex-none">Needs work</Badge>
        ) : score != null ? (
          <Badge variant="secondary" className="flex-none">Score {score}</Badge>
        ) : null}
      </div>
      <div className="space-y-3 p-4 text-sm">
        <div>
          <Label icon={<FileText className="h-3.5 w-3.5" />} text="Your answer" tone="muted" />
          <p className="mt-1 whitespace-pre-wrap leading-relaxed">
            {answered ? answer : <span className="text-muted-foreground">Skipped — no answer submitted.</span>}
          </p>
        </div>
        {typeof feedback === "string" && feedback.trim() && (
          <div className="rounded-lg border-l-2 border-primary bg-muted/40 p-3">
            <Label icon={<Sparkles className="h-3.5 w-3.5" />} text="Feedback" tone="primary" />
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{feedback}</p>
          </div>
        )}
        {feedback && typeof feedback === "object" && <ResultDetail data={feedback} />}
      </div>
    </div>
  );
}


/* --------------------------- Specialised cards --------------------------- */

function SectionImprovementCard({ item }: { item: any }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold">{item.sectionName}</span>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        {item.originalContent != null && (
          <div className="border-b border-border/60 p-4 md:border-b-0 md:border-r">
            <Label icon={<AlertCircle className="h-3.5 w-3.5" />} text="Original" tone="muted" />
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {item.originalContent}
            </p>
          </div>
        )}
        {item.improvedContent != null && (
          <div className="p-4">
            <Label icon={<Sparkles className="h-3.5 w-3.5" />} text="Improved" tone="primary" />
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.improvedContent}</p>
          </div>
        )}
      </div>
      {item.changesSummary && (
        <div className="flex gap-2 border-t border-border/60 bg-primary/5 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Changes</div>
            <div className="text-sm">{item.changesSummary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function GrammarCorrectionCard({ item }: { item: any }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-destructive/10 px-2 py-1 font-mono text-xs text-destructive line-through">
          {item.originalText}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span className="rounded-md bg-success/10 px-2 py-1 font-mono text-xs text-success-foreground">
          {item.correctedText}
        </span>
      </div>
      {item.explanation && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Why: </span>
          {item.explanation}
        </p>
      )}
    </div>
  );
}

function SkillSuggestionCard({ item }: { item: any }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {item.missingSkill && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            {item.missingSkill}
          </Badge>
        )}
        {item.placementHint && (
          <span className="text-xs text-muted-foreground">{item.placementHint}</span>
        )}
      </div>
      {item.suggestedBullet && (
        <p className="mt-3 rounded-lg border-l-2 border-primary bg-muted/40 p-3 text-sm leading-relaxed">
          {item.suggestedBullet}
        </p>
      )}
      {item.rationale && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Rationale: </span>
          {item.rationale}
        </p>
      )}
    </div>
  );
}

function GenericObjectCard({ item, index }: { item: any; index: number }) {
  const entries = Object.entries(item).filter(([k]) => !isHiddenIdField(k));
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Item #{index + 1}
      </div>
      <dl className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(120px,1fr)_3fr] gap-3 text-sm">
            <dt className="font-medium text-muted-foreground">{humanize(k)}</dt>
            <dd className="break-words">
              {v === null || v === undefined ? (
                <span className="text-muted-foreground">—</span>
              ) : Array.isArray(v) ? (
                <ItemList items={v} />
              ) : typeof v === "object" ? (
                <ResultDetail data={v} />
              ) : (
                formatValue(k, v)
              )}
            </dd>

          </div>
        ))}
      </dl>
    </div>
  );
}

function Label({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: "muted" | "primary" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${
        tone === "primary" ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      {text}
    </div>
  );
}

function humanize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

