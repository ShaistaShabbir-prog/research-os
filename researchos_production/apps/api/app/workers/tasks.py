from app.workers.celery_app import celery_app

@celery_app.task
def run_review_job(document_id: int) -> dict:
    return {'document_id': document_id, 'status': 'queued-review-placeholder'}

@celery_app.task
def run_graph_job(project_id: int) -> dict:
    return {'project_id': project_id, 'status': 'queued-graph-placeholder'}
