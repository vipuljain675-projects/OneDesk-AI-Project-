import chromadb
from chromadb.config import Settings
from config import CHROMA_PERSIST_DIR

_client = None

def get_chroma_client():
    """Returns a persistent ChromaDB client (singleton)."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client

def get_or_create_collection(name: str):
    """Get or create a named ChromaDB collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}   # cosine similarity for confidence scores
    )
