import os
import uuid
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from config import get_embedding_model

COLLECTION_NAME = "pericope_papers"
VECTOR_SIZE = 384

_qdrant_client = None

def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
        )
        existing = [c.name for c in _qdrant_client.get_collections().collections]
        if COLLECTION_NAME not in existing:
            _qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
    return _qdrant_client


def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]


def embed_and_store(paper_id: str, chunks: List[str]) -> None:
    client = get_qdrant_client()
    embeddings = embed_texts(chunks)
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
    client = get_qdrant_client()
    query_embedding = embed_texts([query])[0]
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
    client = get_qdrant_client()
    query_embedding = embed_texts([query])[0]
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