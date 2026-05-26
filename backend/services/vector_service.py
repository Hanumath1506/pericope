import os
import uuid
import httpx
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

COLLECTION_NAME = "pericope_papers"
VECTOR_SIZE = 384
HF_MODEL = "BAAI/bge-small-en-v1.5"
HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}/pipeline/feature-extraction"

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
    headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}
    response = httpx.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": texts, "options": {"wait_for_model": True}},
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()


def embed_and_store(paper_id: str, chunks: List[str]) -> None:
    client = get_qdrant_client()
    # Process in batches of 32 to avoid HF API limits
    all_embeddings = []
    for i in range(0, len(chunks), 32):
        batch = chunks[i:i+32]
        embeddings = embed_texts(batch)
        all_embeddings.extend(embeddings)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={"paper_id": paper_id, "text": chunk},
        )
        for chunk, embedding in zip(chunks, all_embeddings)
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