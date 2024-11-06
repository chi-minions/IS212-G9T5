from flask import Blueprint, jsonify
from models import WFHRequests, db
from datetime import date
from dateutil.relativedelta import relativedelta
from util.wfh_request_logs import *

cron = Blueprint('cron', __name__)

@cron.route("/api/auto-reject")
def auto_reject():
    try:
        print("Auto-reject route hit") 
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
        return jsonify({"message": "Auto-rejection complete"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500