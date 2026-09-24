"""
semantic_retriever.py
Retrieves top-k relevant chunks from ChromaDB for a given query + domain.
Implements domain filter + fallback to broader search if needed.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sentence_transformers import SentenceTransformer
from db.vector_client import get_or_create_collection

embedder = SentenceTransformer("all-MiniLM-L6-v2")


def retrieve_chunks(query: str, domain: str, top_k: int = 5, domains_list: list = None) -> list[dict]:
    """
    Retrieve relevant chunks from ChromaDB.

    Strategy:
    1. If domains_list has multiple domains (multi-domain query), filter by $in: domains_list
    2. Try single domain-filtered search if single domain specified
    3. If < 2 results found, fallback to unfiltered search across all domains
    """
    collection = get_or_create_collection("handbook")
    query_emb = embedder.encode(query, normalize_embeddings=True).tolist()

    chunks = []

    # ── Step 1: Multi-domain or Single-domain filtered retrieval ───────────────
    if domains_list and len(domains_list) > 1:
        try:
            results = collection.query(
                query_embeddings=[query_emb],
                n_results=top_k,
                where={"primary_domain": {"$in": domains_list}},
                include=["documents", "metadatas", "distances"]
            )
            chunks = _format_results(results)
        except Exception as e:
            print(f"[Retriever] Multi-domain filter error: {e}")
            chunks = []
    elif domain and "Multi-Domain" not in domain and domain != "unknown":
        try:
            results = collection.query(
                query_embeddings=[query_emb],
                n_results=top_k,
                where={"primary_domain": domain},   # filter by classified domain
                include=["documents", "metadatas", "distances"]
            )
            chunks = _format_results(results)
        except Exception:
            chunks = []

    # ── Step 2: Fallback — search without domain filter ─────────────────────
    if len(chunks) < 2:
        print(f"[Retriever] Low/empty domain results for '{domain}', falling back to full search.")
        results = collection.query(
            query_embeddings=[query_emb],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        chunks = _format_results(results)

    return chunks


def _format_results(results: dict) -> list[dict]:
    """Format ChromaDB query results into clean dicts."""
    chunks = []
    if not results or not results.get("documents"):
        return chunks

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    for doc, meta, dist in zip(docs, metas, distances):
        # ChromaDB cosine distance → similarity score
        similarity = round(1 - dist, 4)
        chunks.append({
            "text": doc,
            "filename": meta.get("filename", "unknown"),
            "primary_domain": meta.get("primary_domain", "unknown"),
            "domain_tags": meta.get("domain_tags", ""),
            "score": similarity,
            "chunk_index": meta.get("chunk_index", 0)
        })

    return chunks
