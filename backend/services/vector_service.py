import os
import uuid
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from config import get_embedding_model

COLLECTION_NAME = "pericope_papers"
VECTOR_SIZE = 384  # all-MiniLM-L6-v2 output size

_qdrant_client = None

def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
        )
        # Create collection if it doesn't exist
        existing = [c.name for c in _qdrant_client.get_collections().collections]
        if COLLECTION_NAME not in existing:
            _qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
    return _qdrant_client


def embed_and_store(paper_id: str, chunks: List[str]) -> None:
    model = get_embedding_model()
    client = get_qdrant_client()
    embeddings = model.encode(chunks, show_progress_bar=False).tolist()
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={"paper_id": paper_id, "text": chunk},
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)


def similarity_search(paper_id: str, query: str, top_k: int = 5) -> List[str]:
    model = get_embedding_model()
    client = get_qdrant_client()
    query_embedding = model.encode([query]).tolist()[0]
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=Filter(
            must=[FieldCondition(key="paper_id", match=MatchValue(value=paper_id))]
        ),
        limit=top_k,
    )
    return [r.payload["text"] for r in results.points]


def cross_paper_search(query: str, top_k: int = 10) -> List[dict]:
    model = get_embedding_model()
    client = get_qdrant_client()
    query_embedding = model.encode([query]).tolist()[0]
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=top_k,
    )
    return [{"chunk": r.payload["text"], "paper_id": r.payload["paper_id"]} for r in results.points]


def delete_paper_vectors(paper_id: str) -> None:
    client = get_qdrant_client()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[FieldCondition(key="paper_id", match=MatchValue(value=paper_id))]
        ),
    )