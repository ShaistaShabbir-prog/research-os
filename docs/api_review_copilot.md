# Review Copilot API

Base path:

```text
/api/review-copilot
```

## Analyze Paper

```http
POST /api/review-copilot/analyze
Content-Type: application/json
```

Request:

```json
{
  "document_text": "# Demo Paper\n\n## Abstract\nThis paper ...",
  "reviews": [
    {
      "reviewer_id": "R1",
      "summary": "The paper is promising but needs clearer baselines.",
      "strengths": ["important problem"],
      "weaknesses": ["missing ablations"],
      "recommendation": "borderline"
    }
  ]
}
```

Validation:

- `document_text` must be at least 30 characters.
- `document_text` must be at most 200,000 characters.
- External LLM APIs are not called by default.

Success response shape:

```json
{
  "paper": {
    "title": "Demo Paper",
    "abstract": "This paper ...",
    "sections": [],
    "references": [],
    "figures_tables": [],
    "raw_text": "# Demo Paper..."
  },
  "reviewer_analysis": {
    "paper_summary": "Demo Paper: This paper ...",
    "human_verification_required": true
  },
  "citation_audit": {
    "report_type": "citation_audit",
    "findings": []
  },
  "claim_audit": {
    "report_type": "claim_audit",
    "findings": []
  },
  "reproducibility_audit": {
    "code_availability": false,
    "findings": []
  },
  "meta_review": {
    "balanced_meta_review": "The reviews should be read as decision support..."
  },
  "knowledge_graph": {
    "nodes": [],
    "edges": []
  },
  "ethics": [
    "The system assists, but does not replace human scientific judgment."
  ],
  "exports": {
    "review_summary.md": "# Review Summary...",
    "review_analysis.md": "# Review Analysis...",
    "review_analysis.json": "{...}",
    "citation_audit.json": "{...}",
    "claim_audit.json": "{...}",
    "reproducibility_checklist.md": "# Reproducibility Checklist...",
    "meta_review_draft.md": "# Meta-Review Draft...",
    "research_kg.graphml": "<?xml version=\"1.0\"..."
  }
}
```

Structured error response:

```json
{
  "detail": {
    "code": "invalid_review_copilot_input",
    "message": "Paper text must be at least 30 characters.",
    "human_verification_required": true
  }
}
```

## Export Support

The API returns export-ready content in the `exports` object:

- `review_summary.md`
- `review_analysis.md`
- `review_analysis.json`
- `citation_audit.json`
- `claim_audit.json`
- `reproducibility_checklist.md`
- `meta_review_draft.md`
- `research_kg.graphml`

The frontend downloads these strings directly. No server-side file persistence is required for the MVP.
