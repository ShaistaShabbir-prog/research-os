# Review Copilot — Demo Walkthrough

> **DISCLAIMER:** This is a demonstration using synthetic materials.
> All papers, reviewers, results, and citations are illustrative only.
> Review Copilot supports human judgment and must not be used as an
> automated decision system. See [Ethical Review Policy](../ethical_review_policy.md).

---

## Who this demo is for

| Role | What you will see |
|---|---|
| **Reviewers** | How RC surfaces reproducibility gaps and claim flags before you write your review |
| **Area Chairs** | How meta-review synthesis aggregates reviewer signals across R1/R2/R3 |
| **Supervisors** | How the feedback report guides a student through a revision cycle |
| **Students / Authors** | How to self-assess a draft before submission |

---

## Demo materials

| File | Description |
|---|---|
| [`demo_paper.md`](../../examples/demo_paper.md) | Synthetic CNC chatter-detection paper with deliberate gaps |
| [`demo_reviews.json`](../../examples/demo_reviews.json) | Three synthetic reviewer reports (R1 weak accept, R2 borderline, R3 weak reject) |
| [`demo_review_output.md`](../../examples/demo_review_output.md) | Example RC output for the above inputs |

---

## Step 1 — Open Review Copilot

Navigate to **[research-os-phi.vercel.app/review-copilot](https://research-os-phi.vercel.app/review-copilot)**.

You will see three input areas:

1. **Paper text** — paste the full manuscript or upload a PDF.
2. **Reviewer reports** — paste JSON or plain-text reviews.
3. **Analysis options** — choose which modules to run.

> **Screenshot placeholder:** `docs/screenshots/01_review_copilot_landing.png`
> *Caption: Review Copilot landing page with three input panels.*

---

## Step 2 — Paste the demo paper

Copy the contents of `examples/demo_paper.md` into the **Paper text** field,
or click **Load demo** to auto-fill.

The system will immediately display:

- **Paper title** extracted: *Acoustic-Based Chatter Detection in CNC Milling...*
- **Abstract detected** ✓
- **Section count:** 6 sections found
- **Reference count:** 5 references found

> **Screenshot placeholder:** `docs/screenshots/02_paper_parsed.png`
> *Caption: Paper parsed — title, abstract, and section map displayed.*

---

## Step 3 — Add reviewer reports

Switch to the **Reviewer Reports** tab and paste the contents of
`examples/demo_reviews.json`, or click **Load demo reviews**.

Three reviewer cards will appear:

| Reviewer | Recommendation | Confidence |
|---|---|---|
| R1 — Senior Reviewer | Weak accept | High |
| R2 — Area Chair reviewer | Borderline | Medium-high |
| R3 — Reviewer | Weak reject | Medium |

> **Screenshot placeholder:** `docs/screenshots/03_reviews_loaded.png`
> *Caption: Three reviewer cards loaded with recommendation and confidence badges.*

---

## Step 4 — Run analysis

Click **Analyse**. Review Copilot runs four modules in parallel:

### 4a. Claim audit

RC flags three claim types:

| Claim | Location | Flag |
|---|---|---|
| "we are the first system to improve reviewer calibration..." | Abstract | ⚠️ Novelty claim — verify in literature |
| "running on embedded hardware" | Abstract | ⚠️ Deployment claim — no hardware spec in §5 |
| "all code, data splits, and random seeds are provided" | Abstract | ✓ Reproducibility claim — partially verified in §3 |

> **Screenshot placeholder:** `docs/screenshots/04_claim_flags.png`
> *Caption: Claim audit panel showing three flagged claims with location and severity.*

### 4b. Reproducibility audit

RC checks 12 reproducibility items against a checklist derived from
the NeurIPS Reproducibility Checklist:

```
✓  Random seed stated (seed = 42)
✓  Train/val/test split sizes reported
✓  5-fold CV with mean ± std reported
✓  Dataset DOI provided
✓  Hyperparameters fully disclosed
⚠  requirements.txt not mentioned in paper body
⚠  LightGBM version not pinned
⚠  SHAP version not specified
⚠  Hardware spec for latency benchmark missing
⚠  Model export format not specified
✗  Training time not reported
✗  CO₂ / energy budget not reported
```

Score: **6 / 12 (50 %)**

> **Screenshot placeholder:** `docs/screenshots/05_reproducibility_checklist.png`
> *Caption: Reproducibility checklist with 6 passes, 4 warnings, 2 missing items.*

### 4c. Citation audit

RC checks all five references against the claims that cite them:

```
[Smith 2023]  — cited for 420 ms latency → latency source unclear (paper or measured?)
[Jones 2022]  — cited for dataset unavailability → claim is fair
[Brown 2021]  — cited for 1-D CNN baseline → reproducibility of baseline unverified
[Chen 2024]   — cited for transformer result → latency benchmark conditions unspecified
[Ke 2017]     — LightGBM reference → correct and complete
```

> **Screenshot placeholder:** `docs/screenshots/06_citation_check.png`
> *Caption: Citation panel showing 1 correct, 3 warnings, 1 unverifiable.*

### 4d. Reviewer meta-synthesis

RC synthesises across R1, R2, and R3:

**Consensus strengths (cited by ≥ 2 reviewers):**
- Dataset release with full provenance
- Reproducibility (seeds, CV, splits)
- Baseline comparison breadth

**Consensus weaknesses (cited by ≥ 2 reviewers):**
- Single-machine dataset — generalisation overstated
- Latency benchmark hardware not specified
- Missing statistical significance tests

**Split opinions:**
- R1 and R2 find SHAP explanations a genuine contribution; R3 does not address them
- R2 flags the novelty claim as overstated; R1 does not raise this
- R3 raises safety concerns (fail-safe) not mentioned by R1 or R2

**Suggested meta-review decision:** `borderline` (2 weak-accept/borderline, 1 weak-reject)

> **Screenshot placeholder:** `docs/screenshots/07_meta_synthesis.png`
> *Caption: Meta-review synthesis panel with consensus, split opinions, and suggested decision.*

---

## Step 5 — Export results

Click **Export** to download:

- `review_analysis.md` — human-readable Markdown report
- `review_analysis.json` — structured data for programmatic use
- `reproducibility_checklist.csv` — item-by-item checklist

> **Screenshot placeholder:** `docs/screenshots/08_export_panel.png`
> *Caption: Export panel with three download options.*

---

## Step 6 — Revision guidance (author mode)

Switch to **Author view** to see the same analysis reframed as revision tasks:

```
Priority 1 (required for resubmission):
  □ Specify hardware used for 48 ms latency measurement
  □ Pin LightGBM and SHAP versions in requirements.txt
  □ Add McNemar test comparing LightGBM vs SVM

Priority 2 (strongly recommended):
  □ Add per-condition F1 breakdown (spindle speed × feed rate)
  □ Revise abstract novelty claim — remove "we are the first"
  □ Add concept-drift discussion (tool-wear degradation)

Priority 3 (optional but strengthening):
  □ Add user study validating SHAP explanations with engineers
  □ Report training time and model memory footprint
  □ Add energy/CO₂ estimate (ML carbon impact norms)
```

> **Screenshot placeholder:** `docs/screenshots/09_author_revision_tasks.png`
> *Caption: Author view showing prioritised revision task list.*

---

## API demo (curl)

You can reproduce the same analysis via the REST API:

```bash
curl -X POST https://researchos-api-8zqh.onrender.com/api/review-copilot/analyze \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "document_text": "$(cat examples/demo_paper.md)",
  "reviews": $(cat examples/demo_reviews.json)
}
EOF
```

Expected response structure:

```json
{
  "paper": {
    "title": "Acoustic-Based Chatter Detection in CNC Milling...",
    "sections": ["Abstract", "Introduction", "Related Work", "Dataset", "Method", "Experiments", "Conclusion"],
    "reference_count": 5
  },
  "claim_audit": {
    "novelty_claims": [...],
    "reproducibility_claims": [...],
    "deployment_claims": [...]
  },
  "reproducibility_score": {
    "score": 6,
    "max": 12,
    "items": [...]
  },
  "reviewer_analysis": {
    "consensus_strengths": [...],
    "consensus_weaknesses": [...],
    "split_opinions": [...],
    "suggested_decision": "borderline",
    "human_verification_required": true
  },
  "ethics": [
    "This analysis supports human review and must not be used as an automated decision system.",
    "All reviewer recommendations require human verification before any editorial decision.",
    "Confidential submission content should only be processed in your own deployment."
  ]
}
```

---

## Common questions

**Q: Can I use this for real conference papers?**
A: Yes — with caveats. Do not send confidential submissions to a third-party deployment.
Run your own instance with your own API key. Review Copilot assists; it does not decide.

**Q: Does RC replace the reviewer?**
A: No. RC surfaces patterns and flags items a busy reviewer might miss. The scientific
judgment, the recommendation, and the written review remain entirely the reviewer's
responsibility.

**Q: Who sees my paper content?**
A: In the public demo, paper text is sent to the configured LLM provider (Anthropic Claude).
For sensitive submissions, use a self-hosted instance. See [Privacy Policy](../ethical_review_policy.md).

**Q: How accurate are the reproducibility scores?**
A: RC applies rule-based checks against a fixed checklist. It can miss items and can
flag false positives. Treat scores as a starting point, not a final audit.

---

## Next steps

- [API Reference](../api_review_copilot.md)
- [Ethical Review Policy](../ethical_review_policy.md)
- [Design Document](../review_copilot_design.md)
- [Full Architecture](../../researchos_production/docs/ARCHITECTURE.md)
