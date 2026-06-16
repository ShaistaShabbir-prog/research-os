# Ethical Review Policy

Review Copilot assists research review workflows. It must be used as decision support, not as a substitute for human scientific judgment.

## Required Warnings

The product must show these warnings in user-facing Review Copilot flows:

- The system assists, but does not replace human scientific judgment.
- Do not submit AI-generated reviews without human verification.
- The reviewer remains responsible for correctness, fairness, and confidentiality.
- No paper content should be sent to external APIs unless explicitly configured.

## Acceptable Uses

- Highlighting possible weaknesses for a human reviewer to inspect.
- Drafting structured notes for a reviewer, supervisor, area chair, or editor.
- Flagging reproducibility checklist gaps.
- Flagging claims that may need evidence, qualification, or closer reading.
- Summarizing reviewer agreement and disagreement for meta-review support.
- Exporting transparent evidence-backed artifacts for human review.

## Unacceptable Uses

- Submitting AI-generated reviews without human verification.
- Treating Review Copilot output as a scientific decision.
- Uploading confidential paper content to external APIs without explicit configuration and authorization.
- Using the tool to bypass venue confidentiality, reviewer responsibility, or conflict-of-interest rules.
- Claiming the system proves novelty, correctness, ethical acceptability, or reproducibility.

## Confidentiality

Paper content may be confidential. The MVP uses local heuristics by default and does not call external LLM APIs. Any future external provider must be opt-in, documented, and configured with an explicit data-handling policy.

## Human Responsibility

The reviewer, supervisor, area chair, or editor remains responsible for:

- Reading the paper.
- Checking evidence spans.
- Verifying citations.
- Judging methodological soundness.
- Making fair and context-aware decisions.
- Following venue, institutional, and legal obligations.
