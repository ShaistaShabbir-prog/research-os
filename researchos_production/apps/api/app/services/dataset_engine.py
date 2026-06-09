"""Dataset card generation and reproducibility scoring."""
from pathlib import Path


def create_dataset_card(name: str, abstract: str, files: list[str], license: str | None, domain: str) -> dict:
    extensions = sorted({Path(f).suffix.lower() or "unknown" for f in files})
    return {
        "name": name,
        "domain": domain,
        "summary": abstract,
        "intended_use": "Academic research, benchmarking, reproducibility, and model comparison.",
        "not_intended_use": "Do not use for high-stakes automated decisions without independent validation.",
        "file_inventory": files,
        "formats_detected": extensions,
        "license": license or "Not specified — choose an explicit open or restricted license before publication.",
        "collection_process": "Describe sensors/instruments, participants/materials, sampling rate, protocol, and QC.",
        "metadata_required": ["authors", "version", "license", "collection date", "schema", "variables", "units", "missing values"],
        "ethical_considerations": "Document privacy, consent, anonymization, sensitive attributes, and institutional approvals.",
        "limitations": [
            "Dataset card generated from limited metadata.",
            "Requires manual verification before DOI publication.",
        ],
        "citation": f"Cite as: {name}, version 0.1.0, ResearchOS Dataset Hub.",
    }


def reproducibility_check(files: list[str], has_readme: bool = False, has_env: bool = False) -> tuple[float, list[str]]:
    lower = [f.lower() for f in files]
    issues: list[str] = []
    score = 100.0

    has_data = any(f.endswith((".csv", ".json", ".parquet", ".npz", ".h5", ".zip")) for f in lower)
    has_code = any(f.endswith((".py", ".ipynb", ".r", ".m")) for f in lower)
    readme = has_readme or any("readme" in f for f in lower)
    env = has_env or any(f.endswith(("requirements.txt", "environment.yml", "pyproject.toml", "dockerfile")) for f in lower)
    license_file = any("license" in f for f in lower)

    if not has_data:
        score -= 25; issues.append("No data file detected (.csv, .json, .parquet, .npz, .h5, .zip).")
    if not readme:
        score -= 20; issues.append("README is missing.")
    if has_code and not env:
        score -= 20; issues.append("Code is present but no environment/dependency file (requirements.txt, environment.yml).")
    if not license_file:
        score -= 15; issues.append("License file is missing.")
    if not any("schema" in f or "metadata" in f for f in lower):
        score -= 10; issues.append("Schema or metadata file is missing.")
    if not any("citation" in f or "codemeta" in f for f in lower):
        score -= 10; issues.append("Citation metadata (CITATION.cff or codemeta.json) is missing.")

    return max(0.0, round(score, 1)), issues
