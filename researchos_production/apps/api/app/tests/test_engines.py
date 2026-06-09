from app.services.supervisor_engine import review_document
from app.services.dataset_engine import reproducibility_check
from app.services.graph_engine import extract_graph

def test_supervisor_review_scores():
    text = 'Abstract Introduction Related Work Methodology Results Discussion Conclusion References. We propose a novel CNN baseline dataset experiment validation metric.'
    report = review_document(text)
    assert report['overall_score'] > 0
    assert 'major_concerns' in report

def test_dataset_reproducibility():
    score, issues = reproducibility_check(['data.csv', 'README.md', 'requirements.txt', 'LICENSE', 'metadata.json'])
    assert score >= 70
    assert isinstance(issues, list)

def test_graph_extract():
    graph = extract_graph('Paper A', 'We use CNN and Random Forest on TS1 Dataset.')
    assert graph['nodes']
    assert graph['edges']
