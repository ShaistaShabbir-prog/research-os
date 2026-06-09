import re

def extract_graph(title: str, text: str, source_type: str = 'paper') -> dict:
    text = text or ''
    methods = sorted(set(re.findall(r'\b(CNN|LSTM|Transformer|Random Forest|SVM|Ridge|XGBoost|BERT|GPT|Bayesian|Kalman|PCA)\b', text, re.I)))
    datasets = sorted(set(re.findall(r'\b([A-Z][A-Za-z0-9_-]+\s?(Dataset|Corpus|Benchmark|TS\d+))\b', text)))
    dataset_names = [d[0] for d in datasets]
    nodes = [{'label': source_type.title(), 'name': title, 'properties': {'source_type': source_type}}]
    nodes += [{'label': 'Method', 'name': m, 'properties': {}} for m in methods]
    nodes += [{'label': 'Dataset', 'name': d, 'properties': {}} for d in dataset_names]
    edges = []
    for m in methods:
        edges.append({'source': title, 'target': m, 'relation': 'USES_METHOD'})
    for d in dataset_names:
        edges.append({'source': title, 'target': d, 'relation': 'USES_DATASET'})
    return {'nodes': nodes, 'edges': edges}
