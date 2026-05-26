from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Header
from services.firebase_service import (
    create_paper_doc, update_paper_status, get_paper,
    list_papers, upload_pdf, delete_paper_doc, delete_pdf
)
from services.pdf_service import parse_pdf_bytes, chunk_text
from services.vector_service import embed_and_store, delete_paper_vectors
from services.llm_service import generate_summary

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
    x_user_id: str = Header(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")
    pdf_bytes = await file.read()
    paper_id = create_paper_doc(user_id=x_user_id, filename=file.filename)
    upload_pdf(paper_id, pdf_bytes, file.filename)
    background_tasks.add_task(process_paper, paper_id, pdf_bytes)
    return {"paper_id": paper_id, "status": "processing"}


@router.get("/")
def list_user_papers(x_user_id: str = Header(...)):
    return list_papers(x_user_id)


@router.get("/{paper_id}")
def get_paper_details(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    return paper


@router.delete("/{paper_id}")
def delete_paper(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    delete_pdf(paper_id, paper["filename"])
    delete_paper_vectors(paper_id)
    delete_paper_doc(paper_id)
    return {"deleted": True}