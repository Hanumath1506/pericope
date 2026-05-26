from fastapi import APIRouter, Header
from pydantic import BaseModel
from services.vector_service import cross_paper_search
from services.firebase_service import get_paper
from services.llm_service import synthesize_across_papers

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10


@router.post("/")
def search(req: SearchRequest, x_user_id: str = Header(...)):
    results = cross_paper_search(req.query, top_k=req.top_k)

    paper_cache = {}
    enriched = []
    for r in results:
        pid = r["paper_id"]
        if pid not in paper_cache:
            paper = get_paper(pid)
            if not paper or paper.get("user_id") != x_user_id:
                continue
            paper_cache[pid] = paper
        paper = paper_cache.get(pid)
        if paper:
            enriched.append({
                "chunk": r["chunk"],
                "paper_id": pid,
                "paper_title": paper.get("summary", {}).get("title") or paper["filename"],
            })

    grouped = {}
    for r in enriched:
        pid = r["paper_id"]
        if pid not in grouped:
            grouped[pid] = {"paper_id": pid, "title": r["paper_title"], "chunks": []}
        grouped[pid]["chunks"].append(r["chunk"])

    synthesis = synthesize_across_papers(req.query, list(grouped.values()))

    return {"synthesis": synthesis, "sources": list(grouped.values())}