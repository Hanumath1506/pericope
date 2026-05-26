from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from auth import verify_token
from services.firebase_service import get_paper, save_message, get_messages
from services.vector_service import similarity_search
from services.llm_service import chat_with_context

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    paper_id: str
    message: str


@router.post("/")
def chat(req: ChatRequest, user_id: str = Depends(verify_token)):
    paper = get_paper(req.paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    if paper["user_id"] != user_id:
        raise HTTPException(403, "Access denied.")
    if paper["status"] != "ready":
        raise HTTPException(400, f"Paper is still {paper['status']}.")

    chunks = similarity_search(req.paper_id, req.message, top_k=5)
    if not chunks:
        raise HTTPException(500, "No context found for this paper.")

    history_docs = get_messages(req.paper_id)
    history = [{"role": d["role"], "content": d["content"]} for d in history_docs]

    answer = chat_with_context(req.message, chunks, history)

    save_message(req.paper_id, "user", req.message)
    save_message(req.paper_id, "assistant", answer)

    return {"answer": answer, "sources": chunks}


@router.get("/{paper_id}/history")
def get_chat_history(paper_id: str, user_id: str = Depends(verify_token)):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    if paper["user_id"] != user_id:
        raise HTTPException(403, "Access denied.")
    return get_messages(paper_id)


@router.post("/demo")
def demo_chat(req: ChatRequest):
    """Public chat endpoint for demo papers — no auth required."""
    if req.paper_id not in [
        "5084a3ad-000e-45be-8019-85909eb0f303",
        "a0b2fe51-f86b-48b6-a43f-1bcf5f64f4cc",
        "f4ee4f6d-4ea1-44cf-b6fd-553438be478b",
    ]:
        raise HTTPException(403, "Not a demo paper.")

    paper = get_paper(req.paper_id)
    if not paper or paper["status"] != "ready":
        raise HTTPException(400, "Demo paper not ready.")

    chunks = similarity_search(req.paper_id, req.message, top_k=5)
    if not chunks:
        raise HTTPException(500, "No context found.")

    answer = chat_with_context(req.message, chunks, [])
    return {"answer": answer, "sources": chunks}