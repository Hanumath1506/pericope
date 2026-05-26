import os
import uuid
from datetime import datetime
from config import get_firestore, get_storage


# ── Firestore ─────────────────────────────────────────────────────────────────

def create_paper_doc(user_id: str, filename: str) -> str:
    db = get_firestore()
    paper_id = str(uuid.uuid4())
    db.collection("papers").document(paper_id).set({
        "id": paper_id,
        "user_id": user_id,
        "filename": filename,
        "status": "processing",
        "created_at": datetime.utcnow().isoformat(),
        "summary": None,
    })
    return paper_id

def update_paper_status(paper_id: str, status: str, summary: dict = None):
    db = get_firestore()
    update = {"status": status}
    if summary:
        update["summary"] = summary
    db.collection("papers").document(paper_id).update(update)

def get_paper(paper_id: str) -> dict:
    db = get_firestore()
    doc = db.collection("papers").document(paper_id).get()
    return doc.to_dict() if doc.exists else None

def list_papers(user_id: str) -> list:
    db = get_firestore()
    docs = db.collection("papers").where("user_id", "==", user_id).stream()
    return [d.to_dict() for d in docs]

def save_message(paper_id: str, role: str, content: str):
    db = get_firestore()
    db.collection("papers").document(paper_id).collection("messages").add({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
    })

def get_messages(paper_id: str) -> list:
    db = get_firestore()
    docs = (
        db.collection("papers").document(paper_id)
        .collection("messages")
        .order_by("timestamp")
        .stream()
    )
    return [d.to_dict() for d in docs]

def delete_paper_doc(paper_id: str):
    db = get_firestore()
    db.collection("papers").document(paper_id).delete()

# ── Storage (Firebase) ────────────────────────────────────────────────────────

def upload_pdf(paper_id: str, pdf_bytes: bytes, filename: str) -> str:
    bucket = get_storage()
    blob = bucket.blob(f"papers/{paper_id}/{filename}")
    blob.upload_from_string(pdf_bytes, content_type="application/pdf")
    return blob.name

def download_pdf(paper_id: str, filename: str) -> bytes:
    bucket = get_storage()
    blob = bucket.blob(f"papers/{paper_id}/{filename}")
    return blob.download_as_bytes()

def delete_pdf(paper_id: str, filename: str):
    bucket = get_storage()
    blob = bucket.blob(f"papers/{paper_id}/{filename}")
    try:
        blob.delete()
    except Exception:
        pass