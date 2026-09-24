"""
chunk.py
Splits document content into overlapping chunks of ~300 words.
"""


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """
    Split text into chunks by word count with overlap.
    overlap ensures context isn't lost at chunk boundaries.
    """
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap  # slide forward with overlap

    return chunks


def chunk_documents(docs: list[dict]) -> list[dict]:
    """
    Takes list of {filename, content} dicts.
    Returns list of {filename, chunk_index, text} dicts.
    """
    all_chunks = []
    for doc in docs:
        chunks = chunk_text(doc["content"])
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "filename": doc["filename"],
                "chunk_index": i,
                "text": chunk
            })
    print(f"[Chunker] Generated {len(all_chunks)} chunks from {len(docs)} documents.")
    return all_chunks
