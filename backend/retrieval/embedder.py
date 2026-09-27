"""
embedder.py
Shared singleton embedding model instance with CPU memory optimization for cloud deployment.
Prevents multiple copies of SentenceTransformer / PyTorch from exceeding 512MB RAM.
"""
import os
import torch

# Optimize PyTorch memory footprint for low-memory cloud instances (e.g. Render 512MB)
torch.set_num_threads(1)

from sentence_transformers import SentenceTransformer

_instance = None

def get_embedder() -> SentenceTransformer:
    global _instance
    if _instance is None:
        print("[Embedder] Loading shared all-MiniLM-L6-v2 model (single instance)...")
        _instance = SentenceTransformer("all-MiniLM-L6-v2")
    return _instance
