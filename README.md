# Pericope — AI Research Assistant

Upload any research paper and chat with it using RAG. Search semantically across your entire library.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Auth + Database | Firebase (Auth, Firestore) |
| File Storage | Local (uploaded_pdfs/) |
| Vector Search | ChromaDB (local) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Groq (llama-3.1-8b-instant) |
| Backend | FastAPI + Python 3.11 |

## Features

- Google Auth via Firebase
- PDF upload and parsing
- RAG-powered Q&A grounded in paper content
- Auto-generated summaries, methodology, key contributions
- Cross-paper semantic search across your entire library
- Persistent chat history via Firestore

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/pericope.git
cd pericope
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your Firebase and Groq credentials
py -3.11 -m pip install -r requirements.txt
py -3.11 -m uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Fill in your Firebase web config
npm install
npm run dev
```

## Environment Variables

Create `backend/.env` and `frontend/.env` from the provided `.env.example` files.

Never commit your `.env` files.