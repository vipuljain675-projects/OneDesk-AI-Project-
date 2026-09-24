"""
embed_and_store.py
Embeds chunks and stores them in ChromaDB with multi-domain tagging.
Run this ONCE to build the knowledge base.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sentence_transformers import SentenceTransformer
from db.vector_client import get_or_create_collection
from ingestion.load_handbook import load_markdown_files
from ingestion.chunk import chunk_documents
from config import DOMAINS, DOMAIN_DESCRIPTIONS

# Load embedding model (runs locally, no API needed)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Pre-embed domain descriptions for tagging
domain_desc_embeddings = {
    domain: embedder.encode(desc, normalize_embeddings=True)
    for domain, desc in DOMAIN_DESCRIPTIONS.items()
}


def classify_chunk_domains(chunk_text: str, threshold: float = 0.25) -> list[dict]:
    """
    Classify a chunk into one or more domains using embedding similarity.
    Returns list of {domain, confidence} sorted by confidence desc.
    Multi-tag: if multiple domains score above threshold, all are included.
    """
    chunk_emb = embedder.encode(chunk_text, normalize_embeddings=True)
    scores = []
    for domain, desc_emb in domain_desc_embeddings.items():
        score = float(chunk_emb @ desc_emb)  # cosine similarity (vectors normalized)
        scores.append({"domain": domain, "confidence": round(score, 4)})

    # Sort by confidence, keep domains above threshold
    scores.sort(key=lambda x: x["confidence"], reverse=True)
    tagged = [s for s in scores if s["confidence"] >= threshold]

    # Always keep at least top-1 domain
    if not tagged:
        tagged = [scores[0]]

    return tagged


def embed_and_store():
    """Main ingestion pipeline: load → chunk → embed → store in ChromaDB."""
    collection = get_or_create_collection("handbook")

    # Check if already ingested
    existing = collection.count()
    if existing > 0:
        print(f"[Embed] Collection already has {existing} chunks. Skipping ingestion.")
        print("[Embed] To re-ingest, delete the chroma_store/ folder and rerun.")
        return

    # Load and chunk
    docs = load_markdown_files()
    chunks = chunk_documents(docs)

    ids, embeddings, documents, metadatas = [], [], [], []

    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        domains = classify_chunk_domains(text)

        # Embed
        emb = embedder.encode(text, normalize_embeddings=True).tolist()

        # Metadata: primary domain + all domain scores
        primary_domain = domains[0]["domain"]
        all_domain_tags = ",".join([d["domain"] for d in domains])
        domain_scores = {f"score_{d['domain']}": d["confidence"] for d in domains}

        metadata = {
            "filename": chunk["filename"],
            "chunk_index": chunk["chunk_index"],
            "primary_domain": primary_domain,
            "domain_tags": all_domain_tags,  # comma-separated for ChromaDB filter
            **domain_scores
        }

        ids.append(f"chunk_{i}")
        embeddings.append(emb)
        documents.append(text)
        metadatas.append(metadata)

        if (i + 1) % 100 == 0:
            print(f"[Embed] Processed {i + 1}/{len(chunks)} chunks...")

    # Batch upsert to ChromaDB
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)
    print(f"[Embed] ✅ Done! Stored {len(chunks)} chunks in ChromaDB.")


if __name__ == "__main__":
    embed_and_store()
