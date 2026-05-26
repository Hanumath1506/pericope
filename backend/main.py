from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import papers, chat, search

app = FastAPI(title="Pericope", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://pericope-xi.vercel.app",
        "https://pericope.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers.router)
app.include_router(chat.router)
app.include_router(search.router)

@app.get("/health")
def health():
    return {"status": "ok"}