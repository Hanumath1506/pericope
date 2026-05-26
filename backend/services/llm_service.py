import json
from typing import List
from config import get_groq_client

MODEL = "llama-3.1-8b-instant"

def chat_with_context(query: str, context_chunks: List[str], history: List[dict]) -> str:
    client = get_groq_client()
    # Only use first 2 chunks, truncated to 300 words each
    truncated = []
    for chunk in context_chunks[:2]:
        words = chunk.split()[:300]
        truncated.append(" ".join(words))
    context = "\n\n---\n\n".join(truncated)
    system_prompt = (
        "You are a research assistant. Answer using ONLY the context below. Be brief.\n\n"
        f"CONTEXT:\n{context}"
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-2:])
    messages.append({"role": "user", "content": query})
    response = client.chat.completions.create(
        model=MODEL, messages=messages, max_tokens=512, temperature=0.2,
    )
    return response.choices[0].message.content

def generate_summary(text: str) -> dict:
    client = get_groq_client()
    words = text.split()[:1500]
    excerpt = " ".join(words)
    prompt = (
        "Analyze this research paper excerpt and return a JSON object with exactly these keys:\n"
        "- title: paper title (string)\n"
        "- summary: 2-3 sentence plain-english summary (string)\n"
        "- contributions: list of 3-5 key contributions (array of strings)\n"
        "- methodology: 1-2 sentence description of the approach (string)\n"
        "- keywords: list of 5-8 keywords (array of strings)\n\n"
        "Return ONLY valid JSON, no markdown, no explanation.\n\n"
        f"PAPER EXCERPT:\n{excerpt}"
    )
    response = client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}],
        max_tokens=800, temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)

def synthesize_across_papers(query: str, grouped_results: list) -> str:
    client = get_groq_client()
    context = ""
    for g in grouped_results:
        context += f"\n\n### From: {g['title']}\n"
        context += "\n".join(g["chunks"])
    prompt = (
        "You are a research assistant. Answer the user's question by synthesizing "
        "information from multiple papers. For each point, cite which paper it comes "
        "from using the paper title in brackets like [Paper Title]. Be concise and analytical.\n\n"
        f"QUESTION: {query}\n\n"
        f"SOURCES:\n{context}"
    )
    response = client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}],
        max_tokens=1024, temperature=0.2,
    )
    return response.choices[0].message.content

