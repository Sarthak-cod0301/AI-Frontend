/** Shared display formatting helpers (presentation only — data is untouched). */

const HIDDEN_ID_FIELDS = new Set([
  "id",
  "_id",
  "resumeid",
  "resume_id",
  "jobdescriptionid",
  "job_description_id",
  "jdid",
  "jd_id",
  "userid",
  "user_id",
  "sessionid",
  "session_id",
  "questionid",
  "question_id",
  "interviewid",
  "interview_id",
  "objectid",
]);

/** Internal DB identifiers we never surface in the UI. */
export function isHiddenIdField(key: string) {
  return HIDDEN_ID_FIELDS.has(key.toLowerCase().replace(/\s+/g, ""));
}

/** Human readable file/resume name from whatever field the backend used. */
export function resumeDisplayName(r: any, fallback = "Untitled resume") {
  if (!r || typeof r !== "object") return fallback;
  const candidates = [
    r.resumeName,
    r.fileName,
    r.filename,
    r.originalFileName,
    r.originalFilename,
    r.name,
    r.title,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() && !looksLikeObjectId(c)) return c.trim();
  }
  return fallback;
}

export function looksLikeObjectId(v: string) {
  return /^[a-f\d]{24}$/i.test(v.trim());
}

const DATE_KEY = /(date|time|at)$/i;

export function isDateLikeKey(key: string) {
  return DATE_KEY.test(key.replace(/[_-]/g, ""));
}

/** "2026-07-25T02:12:10.5784727" -> "25 Jul 2026, 02:12 AM" */
export function formatDateTime(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number") return safeFormat(new Date(value));
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  // Trim over-precise fractional seconds (JS only handles milliseconds).
  const normalized = raw.replace(/(\.\d{3})\d+/, "$1");
  if (!/^\d{4}-\d{2}-\d{2}/.test(normalized)) return null;
  const d = new Date(normalized);
  return safeFormat(d);
}

function safeFormat(d: Date) {
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
