const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}, userId) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "x-user-id": userId,
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
  uploadPaper: (file, userId) => {
    const form = new FormData();
    form.append("file", file);
    return request("/papers/upload", { method: "POST", body: form }, userId);
  },

  listPapers: (userId) => request("/papers/", {}, userId),

  getPaper: (paperId, userId) => request(`/papers/${paperId}`, {}, userId),

  deletePaper: (paperId, userId) =>
    request(`/papers/${paperId}`, { method: "DELETE" }, userId),

  chat: (paperId, message, userId) =>
    request(
      "/chat/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: paperId, message }),
      },
      userId
    ),

  getChatHistory: (paperId, userId) =>
    request(`/chat/${paperId}/history`, {}, userId),

  search: (query, userId) =>
    request(
      "/search/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: 10 }),
      },
      userId
    ),
};