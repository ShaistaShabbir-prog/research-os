"""Knowledge graph extraction from research text."""
import re


def extract_graph(title: str, text: str, source_type: str = "paper") -> dict:
    text = text or ""

    methods = sorted(set(re.findall(
        r"\b(CNN|LSTM|Transformer|Random Forest|SVM|Ridge|XGBoost|BERT|GPT|"
        r"Bayesian|Kalman|PCA|ResNet|GAN|VAE|GNN|RNN|BiLSTM|Attention|ViT)\b",
        text, re.I,
    )))

    datasets = re.findall(r"\b([A-Z][A-Za-z0-9_-]+\s?(Dataset|Corpus|Benchmark|TS\d+))\b", text)
    dataset_names = [d[0].strip() for d in datasets]

    institutions = sorted(set(re.findall(
        r"\b(University of [A-Z][a-zA-Z ]+|[A-Z][A-Za-z]+\s+University|"
        r"MIT|ETH Zurich|TU [A-Z][a-zA-Z]+|Max Planck|Lamarr Institute)\b",
        text,
    )))

    nodes = [{"label": source_type.capitalize(), "name": title, "properties": {"source_type": source_type}}]
    nodes += [{"label": "Method", "name": m, "properties": {}} for m in methods]
    nodes += [{"label": "Dataset", "name": d, "properties": {}} for d in dataset_names]
    nodes += [{"label": "Institution", "name": i, "properties": {}} for i in institutions]

    edges = []
    for m in methods:
        edges.append({"source": title, "target": m, "relation": "USES_METHOD"})
    for d in dataset_names:
        edges.append({"source": title, "target": d, "relation": "USES_DATASET"})
    for i in institutions:
        edges.append({"source": title, "target": i, "relation": "AFFILIATED_WITH"})

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "methods_found": len(methods),
            "datasets_found": len(dataset_names),
            "institutions_found": len(institutions),
        },
    }
