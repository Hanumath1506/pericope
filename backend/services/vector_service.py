from typing import List
from config import get_embedding_model, chroma_client

GLOBAL_COLLECTION = "all_papers"

def embed_and_store(paper_id: str, chunks: List[str]) -> None:
    model = get_embedding_model()
    collection = chroma_client.get_or_create_collection(GLOBAL_COLLECTION)
    embeddings = model.encode(chunks, show_progress_bar=False).tolist()
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"{paper_id}_chunk_{i}" for i in range(len(chunks))],
        metadatas=[{"paper_id": paper_id} for _ in chunks],
    )

def similarity_search(paper_id: str, query: str, top_k: int = 5) -> List[str]:
    model = get_embedding_model()
    collection = chroma_client.get_or_create_collection(GLOBAL_COLLECTION)
    query_embedding = model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        where={"paper_id": paper_id},
    )
    return results["documents"][0] if results["documents"] else []

def cross_paper_search(query: str, top_k: int = 10) -> List[dict]:
    model = get_embedding_model()
    collection = chroma_client.get_or_create_collection(GLOBAL_COLLECTION)
    query_embedding = model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
    )
    chunks = results["documents"][0]
    metadatas = results["metadatas"][0]
    return [{"chunk": c, "paper_id": m["paper_id"]} for c, m in zip(chunks, metadatas)]

def delete_paper_vectors(paper_id: str) -> None:
    collection = chroma_client.get_or_create_collection(GLOBAL_COLLECTION)
    results = collection.get(where={"paper_id": paper_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])