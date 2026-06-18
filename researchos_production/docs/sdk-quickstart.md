# ResearchOS Python SDK — Quickstart

```bash
pip install requests  # no SDK package yet — use REST directly
```

## Authentication

```python
API_KEY  = "ros_your_key_here"
BASE_URL = "https://researchos-api-8zqh.onrender.com"
HEADERS  = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
```

## Review Copilot

```python
import requests

paper_text = open("my_paper.md").read()

response = requests.post(
    f"{BASE_URL}/api/review-copilot/analyze",
    headers=HEADERS,
    json={"document_text": paper_text, "reviews": []},
)
result = response.json()
print(f"Reproducibility: {result['reproducibility_audit']['random_seeds']}")
```

## Claim Verification

```python
response = requests.post(
    f"{BASE_URL}/api/claim-verification/analyze",
    headers=HEADERS,
    json={"document_text": paper_text},
)
claims = response.json()
print(f"Found {claims['claim_count']} claims, {claims['unsupported_count']} unsupported")
```

## Research Memory (compare papers)

```python
papers = [
    {"id": "Paper A", "text": open("paper_a.md").read()},
    {"id": "Paper B", "text": open("paper_b.md").read()},
]
response = requests.post(
    f"{BASE_URL}/api/research-memory/compare",
    headers=HEADERS,
    json={"papers": papers},
)
memory = response.json()
for pair in memory["novelty_overlap"]["pairs"]:
    print(f"{pair['paper_a']} ↔ {pair['paper_b']}: {pair['overlap_label']}")
```

## Get Reproducibility Badge

```python
# Register paper
response = requests.post(
    f"{BASE_URL}/api/badge/register",
    headers=HEADERS,
    json={"document_text": paper_text, "reviews": []},
)
badge = response.json()
print(f"Badge hash: {badge['paper_hash']}")
print(f"Embed: {badge['embed_markdown']}")

# Get SVG badge (no auth needed)
svg_url = f"{BASE_URL}/api/badge/{badge['paper_hash']}.svg"
print(f"SVG URL: {svg_url}")
```

## Rate limits

| Plan | Calls/day |
|---|---|
| Free | 10 |
| Pro | 10,000 |
| Team | 100,000 |

## Error handling

```python
response = requests.post(url, headers=HEADERS, json=payload)
if response.status_code == 429:
    print("Rate limit exceeded — upgrade plan")
elif response.status_code == 401:
    print("Invalid API key")
elif response.status_code == 422:
    print("Validation error:", response.json()["detail"])
else:
    result = response.json()
```

All endpoints return `human_verification_required: true`.
Never use ResearchOS outputs as automated decision systems.
