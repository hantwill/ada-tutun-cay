#!/usr/bin/env python3
"""Ada Tütün ve Çay — RAG indexleme (Qdrant)"""

import requests
import json
import os
import hashlib

QDRANT_URL = "http://localhost:6333"
COLLECTION = "ada_tutun_cay"

# Dokümanları topla
docs_dir = "/mnt/wd500/ada-tutun-cay"
documents = []

# Tüm .md ve .sql dosyalarını oku
for root, dirs, files in os.walk(docs_dir):
    # .git ve node_modules'i atla
    if '.git' in root or 'node_modules' in root or 'target' in root:
        continue
    for f in files:
        if f.endswith(('.md', '.sql', '.ts', '.tsx', '.json')) and not f.startswith('.'):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                    if len(content.strip()) > 0:
                        rel_path = os.path.relpath(path, docs_dir)
                        documents.append({
                            "path": rel_path,
                            "content": content[:8000],
                        })
            except:
                pass

print(f"Toplam {len(dokümanlar)} dosya bulundu" if False else f"Toplam {len(documents)} dosya bulundu")

# Collection oluştur (yoksa)
resp = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}")
if resp.status_code == 404:
    # Yeni collection oluştur
    create_payload = {
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        }
    }
    resp = requests.put(f"{QDRANT_URL}/collections/{COLLECTION}", json=create_payload)
    print(f"Collection oluşturuldu: {resp.status_code}")
else:
    print(f"Collection zaten var: {resp.status_code}")

# Basit hash-based "embedding" (gerçek embedding yerine — Qdrant vektör alanı gerekli)
# Not: Gerçek embedding için bir model gerekli, şimdilik dummy vektör
import random
random.seed(42)

points = []
for i, doc in enumerate(documents):
    # Dosya içeriğinden basit hash vektör üret (384 boyut)
    content_hash = hashlib.md5(doc["content"].encode()).hexdigest()
    # 384 boyutlu vektor: hash'i tekrarlayarak doldur
    vector = []
    while len(vector) < 384:
        for j in range(0, len(content_hash), 2):
            vector.append(int(content_hash[j:j+2], 16) / 255.0)
            if len(vector) >= 384:
                break
    vector = vector[:384]
    
    points.append({
        "id": i,
        "vector": vector,
        "payload": {
            "path": doc["path"],
            "content": doc["content"][:4000],
            "content_length": len(doc["content"]),
        }
    })

# Qdrant'a yükle (batch)
batch_size = 10
for i in range(0, len(points), batch_size):
    batch = points[i:i+batch_size]
    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}/points",
        json={"points": batch}
    )
    if resp.status_code == 200:
        print(f"  Batch {i//batch_size + 1}/{(len(points)-1)//batch_size + 1} OK")
    else:
        print(f"  Batch {i//batch_size + 1} FAIL: {resp.text[:200]}")

print(f"\n✅ {len(points)} doküman Qdrant '{COLLECTION}' collection'ına indexlendi")

# Test sorgusu
print("\n=== TEST SORGU ===")
test_vector = [0.5] * 384
search_resp = requests.post(
    f"{QDRANT_URL}/collections/{COLLECTION}/points/search",
    json={
        "vector": test_vector,
        "limit": 3,
        "with_payload": True
    }
)
if search_resp.status_code == 200:
    results = search_resp.json().get("result", [])
    for r in results:
        payload = r.get("payload", {})
        print(f"  Score: {r.get('score', 0):.4f} | {payload.get('path', '?')}")
else:
    print(f"  Sorgu hatası: {search_resp.status_code}")