"""
embedder.py
Ultra-lightweight ONNX embedding model (all-MiniLM-L6-v2) for cloud deployment.
Runs via ChromaDB ONNX runtime (~60MB RAM) instead of PyTorch (~500MB RAM),
preventing Out-of-Memory crashes on 512MB RAM cloud tiers like Render.
"""
import os
import numpy as np
import chromadb.utils.embedding_functions as ef

class ONNXEmbedder:
    """Wrapper around ChromaDB's built-in ONNX all-MiniLM-L6-v2 model."""
    def __init__(self):
        print("[Embedder] Initializing lightweight ONNX MiniLM-L6-v2 embedder (low memory)...")
        self.ef = ef.ONNXMiniLM_L6_V2()

    def encode(self, text, normalize_embeddings: bool = True):
        single = isinstance(text, str)
        texts = [text] if single else list(text)
        raw = self.ef(texts)
        arr = np.array(raw, dtype=np.float32)
        if normalize_embeddings:
            norms = np.linalg.norm(arr, axis=-1, keepdims=True)
            norms[norms == 0] = 1e-12
            arr = arr / norms
        return arr[0] if single else arr

_instance = None

def get_embedder() -> ONNXEmbedder:
    global _instance
    if _instance is None:
        _instance = ONNXEmbedder()
    return _instance
