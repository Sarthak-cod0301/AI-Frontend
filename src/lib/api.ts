import axios from "axios";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://ai-resume-analyzer-backend-h7hf.onrender.com" ;

export const TOKEN_KEY = "ara_token";
export const USER_KEY = "ara_user";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(err);
  },
);

export type ID = string;

export type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

// ---- API endpoints ----

export const AuthAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/api/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (data: { resetToken: string; newPassword: string }) =>
    api.post("/api/auth/reset-password", data).then((r) => r.data),
};

export const UserAPI = {
  me: () => api.get("/api/users/me").then((r) => r.data),
  update: (data: { name?: string; email?: string }) =>
    api.put("/api/users/me", data).then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/api/users/me/change-password", data).then((r) => r.data),
  deleteAccount: (data: { password: string }) =>
    api.delete("/api/users/me", { data }).then((r) => r.data),
};

export const ResumeAPI = {
  list: () => api.get("/api/resumes").then((r) => r.data),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/resumes/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  replace: (id: ID, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post(`/api/resumes/${id}/replace`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  rename: (id: ID, resumeName: string) =>
    api.put(`/api/resumes/${id}/rename`, { resumeName }).then((r) => r.data),
  remove: (id: ID) => api.delete(`/api/resumes/${id}`).then((r) => r.data),
  download: (id: ID) =>
    api
      .get(`/api/resumes/${id}/download`, { responseType: "blob" })
      .then((r) => r.data as Blob),
  versions: (id: ID) =>
    api.get(`/api/resumes/${id}/versions`).then((r) => r.data),
};

export const JobDescAPI = {
  list: () => api.get("/api/job-descriptions").then((r) => r.data),
  create: (data: { title: string; company?: string; description: string }) =>
    api.post("/api/job-descriptions", data).then((r) => r.data),
  update: (id: ID, data: { title: string; company?: string; description: string }) =>
    api.put(`/api/job-descriptions/${id}`, data).then((r) => r.data),
  remove: (id: ID) => api.delete(`/api/job-descriptions/${id}`).then((r) => r.data),
  get: (id: ID) => api.get(`/api/job-descriptions/${id}`).then((r) => r.data),
};

export const DashboardAPI = {
  get: () => api.get("/api/dashboard").then((r) => r.data),
};

const runWithResume = (path: string) => (resumeId: ID) =>
  api.post(`${path}/run`, null, { params: { resumeId } }).then((r) => r.data);

export const AtsAPI = {
  run: runWithResume("/api/ats-check"),
  history: () => api.get("/api/ats-check/history").then((r) => r.data),
};
export const GrammarAPI = {
  run: runWithResume("/api/grammar-check"),
  history: () => api.get("/api/grammar-check/history").then((r) => r.data),
};
export const FormattingAPI = {
  run: runWithResume("/api/formatting-check"),
  history: () => api.get("/api/formatting-check/history").then((r) => r.data),
};
export const ProjectAPI = {
  run: (resumeId: ID) =>
    api
      .post("/api/project-analysis/run", null, { params: { resumeId } })
      .then((r) => r.data),
  history: () => api.get("/api/project-analysis/history").then((r) => r.data),
};
export const ImprovementAPI = {
  run: (resumeId: ID) =>
    api
      .post("/api/improvement/improve", null, { params: { resumeId } })
      .then((r) => r.data),
  history: () => api.get("/api/improvement/history").then((r) => r.data),
};
export const AnalysisAPI = {
  run: (resumeId: ID, jobDescriptionId: ID) =>
    api
      .post("/api/analysis/run", null, { params: { resumeId, jobDescriptionId } })
      .then((r) => r.data),
  history: () => api.get("/api/analysis/history").then((r) => r.data),
};
export const SuggestionAPI = {
  run: (resumeId: ID, jobDescriptionId: ID) =>
    api
      .post("/api/suggestions/generate", null, { params: { resumeId, jobDescriptionId } })
      .then((r) => r.data),
  history: () => api.get("/api/suggestions/history").then((r) => r.data),
};

export const InterviewAPI = {
  start: (data: { resumeId?: ID; jobDescriptionId?: ID; role?: string; difficulty?: string; numQuestions?: number }) =>
    api.post("/api/interview/start", data).then((r) => r.data),
  next: (sessionId: ID) =>
    api.get(`/api/interview/${sessionId}/next-question`).then((r) => r.data),
  answer: (sessionId: ID, questionId: ID, data: { answerText: string }) =>
    api
      .post(`/api/interview/${sessionId}/questions/${questionId}/answer`, data)
      .then((r) => r.data),
  complete: (sessionId: ID) =>
    api.post(`/api/interview/${sessionId}/complete`, null).then((r) => r.data),
  session: (sessionId: ID) =>
    api.get(`/api/interview/${sessionId}`).then((r) => r.data),
  history: () => api.get("/api/interview/history").then((r) => r.data),
  delete: (sessionId: ID) =>
    api.delete(`/api/interview/${sessionId}`).then((r) => r.data),
};
