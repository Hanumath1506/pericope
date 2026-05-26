import { auth } from "./firebase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function request(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  uploadPaper: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/papers/upload", { method: "POST", body: form });
  },

  listPapers: () => request("/papers/"),

  getPaper: (paperId) => request(`/papers/${paperId}`),

  deletePaper: (paperId) =>
    request(`/papers/${paperId}`, { method: "DELETE" }),

  chat: (paperId, message) =>
    request("/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, message }),
    }),

  getChatHistory: (paperId) =>
    request(`/chat/${paperId}/history`),

  search: (query) =>
    request("/search/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 10 }),
    }),
};