import { storage } from "@/src/utils/storage";

const BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const TOKEN_KEY = "pv_token";

async function req(path: string, opts: RequestInit = {}) {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers,
  });

  const text = await res.text();

  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }

  if (!res.ok) {
    const msg = data?.detail || `Request failed (${res.status})`;
    throw new Error(
      typeof msg === "string" ? msg : JSON.stringify(msg)
    );
  }

  return data;
}

export const api = {
  setToken: (token: string) =>
    storage.secureSet(TOKEN_KEY, token),

  getToken: () =>
    storage.secureGet<string>(TOKEN_KEY, ""),

  clearToken: () =>
    storage.secureRemove(TOKEN_KEY),

  signup: (payload: any) =>
    req("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: any) =>
    req("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => req("/auth/me"),

  calcSizing: (payload: any) =>
    req("/calc/sizing", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  calcFinancial: (payload: any) =>
    req("/calc/financial", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listProjects: () => req("/projects"),

  createProject: (payload: any) =>
    req("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProject: (id: string) =>
    req(`/projects/${id}`),

  updateProject: (id: string, payload: any) =>
    req(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteProject: (id: string) =>
    req(`/projects/${id}`, {
      method: "DELETE",
    }),

  aiSummary: (id: string) =>
    req(`/projects/${id}/ai-summary`, {
      method: "POST",
    }),

  generatePdf: (id: string) =>
    req(`/projects/${id}/pdf`, {
      method: "POST",
    }),

  plans: () => req("/plans"),

  createOrder: (planId: string) =>
    req("/subscription/order", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
      }),
    }),

  verifyOrder: (payload: any) =>
    req("/subscription/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};