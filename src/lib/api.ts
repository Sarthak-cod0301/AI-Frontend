import axios from "axios";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:9095";

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

export type StoredUser = {
  id?: number;
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
  replace: (id: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post(`/api/resumes/${id}/replace`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  rename: (id: number, fileName: string) =>
    api.put(`/api/resumes/${id}/rename`, { fileName }).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/resumes/${id}`).then((r) => r.data),
  download: (id: number) =>
    api
      .get(`/api/resumes/${id}/download`, { responseType: "blob" })
      .then((r) => r.data as Blob),
};

export const JobDescAPI = {
  list: () => api.get("/api/job-descriptions").then((r) => r.data),
  create: (data: { title: string; company?: string; description: string }) =>
    api.post("/api/job-descriptions", data).then((r) => r.data),
  update: (id: number, data: { title: string; company?: string; description: string }) =>
    api.put(`/api/job-descriptions/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/job-descriptions/${id}`).then((r) => r.data),
  get: (id: number) => api.get(`/api/job-descriptions/${id}`).then((r) => r.data),
};

export const DashboardAPI = {
  get: () => api.get("/api/dashboard").then((r) => r.data),
};

const runWithResume = (path: string) => (resumeId: number) =>
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
  run: (resumeId: number) =>
    api
      .post("/api/project-analysis/run", null, { params: { resumeId } })
      .then((r) => r.data),
  history: () => api.get("/api/project-analysis/history").then((r) => r.data),
};
export const ImprovementAPI = {
  run: (resumeId: number) =>
    api
      .post("/api/improvement/improve", null, { params: { resumeId } })
      .then((r) => r.data),
  history: () => api.get("/api/improvement/history").then((r) => r.data),
};
export const AnalysisAPI = {
  run: (resumeId: number, jobDescriptionId: number) =>
    api
      .post("/api/analysis/run", null, { params: { resumeId, jobDescriptionId } })
      .then((r) => r.data),
  history: () => api.get("/api/analysis/history").then((r) => r.data),
};
export const SuggestionAPI = {
  run: (resumeId: number, jobDescriptionId: number) =>
    api
      .post("/api/suggestions/generate", null, { params: { resumeId, jobDescriptionId } })
      .then((r) => r.data),
  history: () => api.get("/api/suggestions/history").then((r) => r.data),
};
