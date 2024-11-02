from celery import shared_task
import time
from models import WFHRequests, db
from datetime import date
from dateutil.relativedelta import relativedelta
from util.wfh_request_logs import *

@shared_task(ignore_result=False)
def hello_world():
    for i in range(1, 6):
        print(i)
        time.sleep(1)

    print("Hello Celery")

@shared_task(ignore_result=False)
def auto_reject():
    curr_date = date.today()
    two_months_ago = curr_date - relativedelta(months=2)

    print("Updating Database for ", curr_date)
    print("Getting Pending Requests before ", two_months_ago)

    pending_requests = WFHRequests.query.filter(
        WFHRequests.request_status == "Pending",
        WFHRequests.apply_date < two_months_ago
    ).all()

    for request in pending_requests:
        request.request_status = "Cancelled"
        request.request_reason = "Auto-rejected by system"

        log_wfh_request(request.json())

    db.session.commit()
