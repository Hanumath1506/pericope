from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from auth import verify_token
from services.firebase_service import (
    create_paper_doc, update_paper_status, get_paper,
    list_papers, upload_pdf, delete_paper_doc, delete_pdf
)
from services.pdf_service import parse_pdf_bytes, chunk_text
from services.vector_service import embed_and_store, delete_paper_vectors
from services.llm_service import generate_summary

DEMO_PAPER_IDS = [
    "5084a3ad-000e-45be-8019-85909eb0f303",
    "a0b2fe51-f86b-48b6-a43f-1bcf5f64f4cc",
    "f4ee4f6d-4ea1-44cf-b6fd-553438be478b",
]

router = APIRouter(prefix="/papers", tags=["papers"])


def process_paper(paper_id: str, pdf_bytes: bytes):
    try:
        text = parse_pdf_bytes(pdf_bytes)
        chunks = chunk_text(text)
        embed_and_store(paper_id, chunks)
        summary = generate_summary(text)
        update_paper_status(paper_id, "ready", summary)
    except Exception as e:
        update_paper_status(paper_id, "error")
        raise e


@router.post("/upload")
async def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")
    pdf_bytes = await file.read()
    paper_id = create_paper_doc(user_id=user_id, filename=file.filename)
    upload_pdf(paper_id, pdf_bytes, file.filename)
    background_tasks.add_task(process_paper, paper_id, pdf_bytes)
    return {"paper_id": paper_id, "status": "processing"}


@router.get("/")
def list_user_papers(user_id: str = Depends(verify_token)):
    return list_papers(user_id)


@router.get("/{paper_id}")
def get_paper_details(paper_id: str, user_id: str = Depends(verify_token)):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    if paper["user_id"] != user_id:
        raise HTTPException(403, "Access denied.")
    return paper


@router.delete("/{paper_id}")
def delete_paper(paper_id: str, user_id: str = Depends(verify_token)):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    if paper["user_id"] != user_id:
        raise HTTPException(403, "Access denied.")
    try:
        delete_pdf(paper_id, paper["filename"])
    except Exception:
        pass
    try:
        delete_paper_vectors(paper_id)
    except Exception:
        pass
    delete_paper_doc(paper_id)
    return {"deleted": True}


@router.get("/demo")
def list_demo_papers():
    """Public endpoint — no auth required."""
    from config import get_firestore
    db = get_firestore()
    papers = []
    for pid in DEMO_PAPER_IDS:
        doc = db.collection("papers").document(pid).get()
        if doc.exists:
            papers.append(doc.to_dict())
    return papers