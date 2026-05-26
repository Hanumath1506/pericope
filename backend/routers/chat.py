from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.firebase_service import get_paper, save_message, get_messages
from services.vector_service import similarity_search
from services.llm_service import chat_with_context

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    paper_id: str
    message: str


@router.post("/")
def chat(req: ChatRequest):
    paper = get_paper(req.paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
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
def get_chat_history(paper_id: str):
    return get_messages(paper_id)