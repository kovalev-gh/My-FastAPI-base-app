from fastapi import APIRouter
from tasks.reports import generate_reports
from core.celery_app import celery_app

router = APIRouter(tags=["Reports"])

@router.get("/reports")
def get_report():
    task = generate_reports.delay()
    return {"task_id": task.id}

@router.get("/reports/{task_id}")
def get_report_result(task_id: str):
    result = celery_app.AsyncResult(task_id)
    if result.ready():
        return {"status": "done", "result": result.get()}
    return {"status": "pending"}
