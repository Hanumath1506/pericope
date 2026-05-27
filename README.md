# Pericope — AI Research Paper Assistant

Upload any research paper and chat with it using RAG. Search semantically across your entire library.

🔗 **Live demo**: [pericope-xi.vercel.app](https://pericope-xi.vercel.app) — no sign-in required, 3 papers preloaded.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite — deployed on Vercel |
| Backend | FastAPI + Python 3.11 — deployed on Render |
| Auth | Firebase Authentication (Google sign-in) |
| Database | Firestore (paper metadata, chat history) |
| File Storage | Firebase Storage (PDFs) |
| Vector Search | Qdrant Cloud |
| Embeddings | HuggingFace Inference API (BAAI/bge-small-en-v1.5) |
| LLM | Groq (llama-3.1-8b-instant) |

## Features

- RAG-powered Q&A grounded in paper content — not LLM guessing from training data
- Auto-generated summaries, methodology extraction, and keyword tagging
- Cross-paper semantic search with LLM-synthesized answers citing multiple sources
- Persistent chat history via Firestore
- Guest demo mode — 3 preloaded landmark AI papers, no sign-in required
- Secure Firebase ID token verification on every backend request

## Architecture

```
Upload PDF
  → FastAPI stores in Firebase Storage
  → Background task: pdfplumber parses → chunks text
  → HuggingFace API embeds chunks → stored in Qdrant Cloud
  → Groq LLM generates structured summary → saved to Firestore

Ask a question
  → HuggingFace API embeds query
  → Qdrant similarity search (filtered by paper_id)
  → Top chunks sent to Groq LLM with system prompt
  → Answer returned, chat history saved to Firestore

Cross-paper search
  → HuggingFace API embeds query
  → Qdrant search across entire collection (no filter)
  → Results grouped by paper, sent to Groq for synthesis
  → Single answer citing multiple source papers
```

## Setup

### Prerequisites
- Python 3.11
- Node.js 18+
- Firebase project (Auth, Firestore, Storage enabled)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- Qdrant Cloud cluster — free at [cloud.qdrant.io](https://cloud.qdrant.io)
- HuggingFace API key — free at [huggingface.co](https://huggingface.co)

### 1. Clone the repo
```bash
git clone https://github.com/Hanumath1506/pericope.git
cd pericope
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your credentials (see Environment Variables below)
py -3.11 -m pip install -r requirements.txt
py -3.11 -m uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Fill in your Firebase web config and backend URL
npm install
npm run dev
```

Visit `http://localhost:5173`

## Environment Variables

### `backend/.env`
```
GROQ_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_STORAGE_BUCKET=
QDRANT_URL=
QDRANT_API_KEY=
HF_API_KEY=
```

### `frontend/.env`
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:8000
```

See `.env.example` files in each directory for guidance. Never commit your `.env` files.

## Project Structure

```
pericope/
├── backend/
│   ├── main.py                   # FastAPI app + CORS
│   ├── auth.py                   # Firebase token verification
│   ├── config.py                 # Firebase, Groq init
│   ├── requirements.txt
│   ├── routers/
│   │   ├── papers.py             # Upload, list, delete, demo
│   │   ├── chat.py               # RAG Q&A, demo chat
│   │   └── search.py             # Cross-paper search
│   └── services/
│       ├── pdf_service.py        # Parse + chunk PDFs
│       ├── vector_service.py     # Qdrant embed + search
│       ├── llm_service.py        # Groq chat + summary
│       └── firebase_service.py  # Firestore + Storage
└── frontend/
    └── src/
        ├── App.jsx
        ├── lib/
        │   ├── firebase.js       # Firebase client
        │   └── api.js            # Backend API calls
        ├── hooks/
        │   └── useAuth.jsx       # Auth context
        └── pages/
            ├── Login.jsx         # Sign-in page
            ├── Dashboard.jsx     # Paper library + upload
            ├── PaperView.jsx     # Chat + summary (authenticated)
            └── DemoView.jsx      # Guest demo mode
```